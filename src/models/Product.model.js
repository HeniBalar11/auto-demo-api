// models/Product.model.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────
    // 1️⃣ ABOUT
    // ─────────────────────────────────────────
    about: {
      title: { type: String, required: true, trim: true },
      description: { type: String, required: true },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
        default: null,
      },
      media: [
        {
          url: { type: String },
          type: { type: String, enum: ["image", "video"] },
        },
      ],
      personalisation: {
        enabled: { type: Boolean, default: false },
        maxChars: { type: Number, default: 0 },
      },
      shopSection: { type: String, default: null }, // Wedding / Daily Wear / Gifts
    },

    // ─────────────────────────────────────────
    // 2️⃣ PRICE & INVENTORY
    // ─────────────────────────────────────────
    pricing: {
      base: { type: Number, required: true },
      currency: { type: String, default: "INR" },
      // country-wise pricing e.g. { US: 520, UK: 480 }
      countryPrices: {
        type: Map,
        of: Number,
        default: {},
      },
    },

    inventory: {
      quantity: { type: Number, required: true, default: 1 },
      sku: { type: String, default: null },
    },

    // ─────────────────────────────────────────
    // 3️⃣ VARIATIONS (size, metal, etc.)
    // ─────────────────────────────────────────
    variations: [
      {
        name: { type: String }, // e.g. "Ring Size"
        options: [
          {
            value: { type: String },     // e.g. "6"
            priceDiff: { type: Number, default: 0 },
            quantity: { type: Number, default: 0 },
            sku: { type: String, default: null },
          },
        ],
      },
    ],

    // ─────────────────────────────────────────
    // 4️⃣ DETAILS
    // ─────────────────────────────────────────
    details: {
      madeBy: {
        type: String,
        enum: ["Handmade", "Factory"],
        default: "Handmade",
      },
      materials: [{ type: String }],   // max 13
      attributes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed, // dynamic per category
        default: {},
      },
      tags: [{ type: String }],         // max 13
    },

    // ─────────────────────────────────────────
    // 5️⃣ DELIVERY
    // ─────────────────────────────────────────
    delivery: {
      madeToOrder: { type: Boolean, default: false },
      processingTimeDays: { type: Number, default: 3 },
      shipping: {
        domestic: {
          price: { type: Number, default: 0 },
          days: { type: Number, default: 3 },
          freeShipping: { type: Boolean, default: false },
        },
        international: {
          price: { type: Number, default: 0 },
          days: { type: Number, default: 7 },
          available: { type: Boolean, default: false },
        },
      },
    },

    // ─────────────────────────────────────────
    // 6️⃣ SETTINGS
    // ─────────────────────────────────────────
    settings: {
      returnsAccepted: { type: Boolean, default: true },
      exchangeAccepted: { type: Boolean, default: false },
      cancellationAllowed: { type: Boolean, default: true },
      status: {
        type: String,
        enum: ["active", "draft", "inactive"],
        default: "active",
      },
    },

    // ─────────────────────────────────────────
    // 📋 PRODUCT INFORMATION (Etsy-style)
    // ─────────────────────────────────────────
    productInfo: {
      // "Who created this item?"
      whoCreated: {
        type: String,
        enum: ["I created it", "A team member created it"],
        // default: "I created it",
      },
      // "What type of item is this?"
      itemType: {
        type: String,
        enum: ["Finished product", "Supply or material"],
        // default: "Finished product",
      },
      // "When was this item produced?"
      itemProduced: {
        type: String,
        enum: [
          "Made to order",
          "2022 - 2026",
          "2010 - 2021",
          "2000 - 2009",
          "Vintage (20+ years old)",
        ],
        // default: "Made to order",
      },
    },

    // ─────────────────────────────────────────
    // META
    // ─────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ratingAvg: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);