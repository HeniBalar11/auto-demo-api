// models/Payment.model.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomProductRequest",
      required: true,
      index: true,
    },
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    makerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentType: {
      type: String,
      enum: ["advance", "full"],
      default: "advance",
    },
    gateway: {
      type: String,
      default: "stripe",
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    clientSecret: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "advance_paid", "completed", "failed"],
      default: "pending",
    },
    paymentDetails: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
