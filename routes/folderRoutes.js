const express = require("express");
const {
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,

  toggleFavorite,
  copyFolder,
  renameFolder,
  duplicateFolder,
  getFolderStorageUsage,
  getAllFolders,

  getAllFavoriteFolders,
  getTotalNumberFolders,
  getFoldersByDate,
} = require("../controllers/folderControllers");

const authProtect = require("../middlewares/auth");

const router = express.Router();
router.post("/", authProtect, createFolder);
router.get("/get/:id", authProtect, getFolder);
router.put("/put/:id", authProtect, updateFolder);
router.delete("/delete/:id", authProtect, deleteFolder);

router.put("/favorite/:id", authProtect, toggleFavorite);
router.get("/favorites", authProtect, getAllFavoriteFolders);
router.post("/copy/:id", authProtect, copyFolder);
router.put("/rename/:id", authProtect, renameFolder);
router.post("/duplicate/:id", authProtect, duplicateFolder);
router.get("/all", authProtect, getAllFolders);
router.get("/total", authProtect, getTotalNumberFolders);
router.get("/date/:date", authProtect, getFoldersByDate);

router.get("/storage/:id", authProtect, getFolderStorageUsage);

module.exports = router;
