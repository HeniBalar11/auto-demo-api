// models/SubCategory.model.js
const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  attributeSchema: [
    {
      key: String,
      label: String,
      type: {
        type: String,
        enum: ["text", "dropdown", "boolean", "number"],
        default: "text",
      },
      required: { type: Boolean, default: false },
      options: [String],
    },
  ],
  personalisationAllowed: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("SubCategory", subCategorySchema);