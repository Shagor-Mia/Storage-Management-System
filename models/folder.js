const mongoose = require("mongoose");
const FolderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },

  favorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Folder", FolderSchema);
