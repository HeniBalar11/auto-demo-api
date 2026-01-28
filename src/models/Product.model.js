const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    details: {
      type: String,
      required: true,
    },

    media: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
      },
    ],

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      enum: ["ring", "necklace", "bracelet", "earring", "other"],
      default: "other",
    },

    material: {
      type: String, // gold, silver, diamond, etc.
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // maker id
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
