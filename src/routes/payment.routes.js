// routes/payment.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

// 💳 Create Stripe PaymentIntent via Backend API
router.post("/create-intent", auth, paymentController.createPaymentIntent);

// ✅ Confirm Stripe Payment after Checkout
router.post("/confirm", auth, paymentController.confirmPayment);

// ⚡ Stripe Asynchronous Webhook
router.post("/webhook", paymentController.handleStripeWebhook);

// 📊 Get Payment Status for Request / Bid
router.get("/status/:requestId", auth, paymentController.getPaymentStatus);

module.exports = router;
