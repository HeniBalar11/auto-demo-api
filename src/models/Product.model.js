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
        url: String,
        type: {
          type: String,
          enum: ["image", "video"],
        },
      },
    ],

    price: {
      type: Number,
      required: true,
    },

    // category: {
    //   type: String,
    //   enum: ["ring", "necklace", "bracelet", "earring", "other"],
    //   default: "other",
    // },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    material: {
      type: String, // gold, silver, diamond, etc.
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // maker id
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
