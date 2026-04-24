// models/CustomProductRequest.model.js
const mongoose = require("mongoose");

const customRequestSchema = new mongoose.Schema(

  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    budgetMin: {
      type: Number,
      required: true,
    },

    budgetMax: {
      type: Number,
      required: true,
    },

    referenceImages: [
      {
        type: String, // image path
      },
    ],

    deadline: {
      type: Date,
    },

    // ─────────────────────────────────────────
    // 3️⃣ VARIATIONS — Customer's preferred options
    // e.g. [{ name: "Ring Size", selectedValue: "7" },
    //        { name: "Metal Color", selectedValue: "Rose Gold" }]
    // ─────────────────────────────────────────
    variations: [
      {
        name: { type: String, trim: true },           // variation label, e.g. "Ring Size"
        selectedValue: { type: String, trim: true },  // chosen option, e.g. "7"
      },
    ],

    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "cancelled"],
      default: "open",
    },

    selectedMakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CustomRequest", customRequestSchema);