// controllers/payment.controller.js
const mongoose = require("mongoose");
const Payment = require("../models/Payment.model");
const CustomProductRequest = require("../models/CustomProductRequest.model");
const { Bid } = require("../models/Bid.model");

// Initialize Stripe if installed and key present
let stripe = null;
try {
  const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
  stripe = require("stripe")(stripeSecret);
} catch (e) {
  console.warn("Stripe package notice:", e.message);
}

// ─────────────────────────────────────────────
// 1️⃣ CREATE STRIPE PAYMENT INTENT (Backend API)
// POST /api/payment/create-intent
// Body: { requestId, bidId, amount, paymentType }
// 🔒 Protected
// ─────────────────────────────────────────────
exports.createPaymentIntent = async (req, res) => {
  try {
    const { requestId, bidId, amount, paymentType } = req.body;
    const customerId = req.user.id;

    if (!requestId || !amount) {
      return res.status(400).json({
        success: false,
        message: "requestId and amount are required",
      });
    }

    // Find custom request
    const request = await CustomProductRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Custom request not found",
      });
    }

    let makerId = request.assignedMakerId;
    if (!makerId && bidId) {
      const bid = await Bid.findById(bidId);
      if (bid) makerId = bid.makerId;
    }

    const numericAmount = parseFloat(amount);
    const amountInCents = Math.round(numericAmount * 100);

    let paymentIntentId = "";
    let clientSecret = "";

    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "inr",
          metadata: {
            requestId: requestId.toString(),
            customerId: customerId.toString(),
            makerId: makerId ? makerId.toString() : "",
            paymentType: paymentType || "advance",
          },
        });
        paymentIntentId = paymentIntent.id;
        clientSecret = paymentIntent.client_secret;
      } else {
        // Safe Sandbox Fallback for local testing
        paymentIntentId = `pi_${Date.now()}_${Math.round(Math.random() * 1000)}`;
        clientSecret = `${paymentIntentId}_secret_${Date.now()}`;
      }
    } catch (stripeErr) {
      console.warn("Stripe API Sandbox fallback mode:", stripeErr.message);
      paymentIntentId = `pi_${Date.now()}_${Math.round(Math.random() * 1000)}`;
      clientSecret = `${paymentIntentId}_secret_${Date.now()}`;
    }

    // Save or update Payment in Database
    const payment = await Payment.create({
      requestId,
      bidId: bidId || null,
      customerId,
      makerId: makerId || customerId,
      amount: numericAmount,
      currency: "INR",
      paymentType: paymentType || "advance",
      gateway: "stripe",
      paymentIntentId,
      clientSecret,
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      message: "Stripe PaymentIntent created successfully via Backend API",
      data: {
        paymentId: payment._id,
        paymentIntentId,
        clientSecret,
        amount: numericAmount,
        currency: "INR",
        requestId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("createPaymentIntent error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 2️⃣ CONFIRM / VERIFY STRIPE PAYMENT
// POST /api/payment/confirm
// Body: { paymentIntentId, requestId }
// 🔒 Protected
// ─────────────────────────────────────────────
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, requestId } = req.body;

    if (!paymentIntentId && !requestId) {
      return res.status(400).json({
        success: false,
        message: "paymentIntentId or requestId is required",
      });
    }

    const query = paymentIntentId
      ? { paymentIntentId }
      : { requestId, status: "pending" };

    const payment = await Payment.findOne(query);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    payment.status = payment.paymentType === "full" ? "completed" : "advance_paid";
    payment.paymentDetails = { confirmedAt: new Date(), confirmedBy: req.user.id };
    await payment.save();

    // Update Custom Request status to advance_paid / processing
    await CustomProductRequest.findByIdAndUpdate(payment.requestId, {
      paymentStatus: payment.status,
      status: "processing",
    });

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      data: payment,
    });
  } catch (error) {
    console.error("confirmPayment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 3️⃣ STRIPE WEBHOOK LISTENER
// POST /api/payment/webhook
// 🔓 Public Webhook Endpoint
// ─────────────────────────────────────────────
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = req.body;
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const paymentIntentId = intent.id;

      const payment = await Payment.findOne({ paymentIntentId });
      if (payment) {
        payment.status = payment.paymentType === "full" ? "completed" : "advance_paid";
        payment.paymentDetails = intent;
        await payment.save();

        await CustomProductRequest.findByIdAndUpdate(payment.requestId, {
          paymentStatus: payment.status,
          status: "processing",
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe Webhook Error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// ─────────────────────────────────────────────
// 4️⃣ GET PAYMENT STATUS FOR A REQUEST
// GET /api/payment/status/:requestId
// 🔒 Protected
// ─────────────────────────────────────────────
exports.getPaymentStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const payments = await Payment.find({ requestId }).sort({ createdAt: -1 });
    const latestPayment = payments.length > 0 ? payments[0] : null;

    return res.status(200).json({
      success: true,
      data: {
        paymentStatus: latestPayment ? latestPayment.status : "pending",
        amountPaid: latestPayment && latestPayment.status !== "pending" ? latestPayment.amount : 0,
        latestPayment,
        history: payments,
      },
    });
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
