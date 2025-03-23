const express = require("express");
const authProtect = require("../middlewares/auth");
const {
  createNote,
  getNote,
  getNoteFile,
  updateNote,
  deleteNote,
  getAllNotes,
  getTotalNumberNotes,
  getAllFavouriteNotes,
  toggleFavouriteNote,
  getAllNotesByDate,
  getSizeOfNote,
  renameNote,
  copyNote,
  duplicateNote,
  getTotalSizeOfAllNotes,
} = require("../controllers/notesControllers");

const noteRouter = express.Router();

noteRouter.post("/create", authProtect, createNote);
noteRouter.get("/get/:id", authProtect, getNote);
noteRouter.get("/file/:id", authProtect, getNoteFile);
noteRouter.put("/update/:id", authProtect, updateNote);
noteRouter.delete("/delete/:id", authProtect, deleteNote);
noteRouter.get("/size/:id", authProtect, getSizeOfNote);
noteRouter.put("/rename/:id", authProtect, renameNote);
noteRouter.post("/copy/:id", authProtect, copyNote);
noteRouter.post("/duplicate/:id", authProtect, duplicateNote);
noteRouter.get("/get-all", authProtect, getAllNotes);
noteRouter.get("/total/count", authProtect, getTotalNumberNotes);
noteRouter.get("/total/size", authProtect, getTotalSizeOfAllNotes);

noteRouter.get("/all/favorites", authProtect, getAllFavouriteNotes);
noteRouter.put("/favorite/:id", authProtect, toggleFavouriteNote);
noteRouter.get("/date/:date", authProtect, getAllNotesByDate);

module.exports = noteRouter;
