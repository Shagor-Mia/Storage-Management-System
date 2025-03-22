// models/Image.js
const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
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
    type: String, // e.g., 'image/jpeg', 'image/png'
    required: true,
  },
  filePath: {
    // Add filePath for local storage
    type: String,
    required: true,
  },
  favorite: {
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

module.exports = mongoose.model("Image", ImageSchema);
