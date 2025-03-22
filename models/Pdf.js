const mongoose = require("mongoose");

const PdfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number, // Size in bytes
    required: true,
  },
  contentType: {
    type: String, // e.g., 'application/pdf'
    required: true,
  },
  filePath: {
    type: String, // Path to the locally stored PDF
    required: true,
  },
  favourite: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Pdf", PdfSchema);
