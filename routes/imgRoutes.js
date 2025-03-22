const express = require("express");
const router = express.Router();

const {
  uploadImage,
  getImage,
  getImageFile,
  updateImage,
  deleteImage,
  toggleFavoriteImage,
  copyImage,
  renameImage,
  getAllImages,
  getAllFavoriteImages,
  getTotalNumberImages,
  duplicateImage,
} = require("../controllers/imageControllers");
const authProtect = require("../middlewares/auth");

router.post("/upload", authProtect, uploadImage);
router.get("/get/:id", authProtect, getImage);
router.get("/file/:id", authProtect, getImageFile);
router.put("/update/:id", authProtect, updateImage);
router.delete("/delete/:id", authProtect, deleteImage);
router.patch("/toggle-favorite/:id", authProtect, toggleFavoriteImage);
router.post("/copy/:id", authProtect, copyImage);
router.post("/duplicate/:id", authProtect, duplicateImage);

router.patch("/rename/:id", authProtect, renameImage);
router.get("/get-all", authProtect, getAllImages);
router.get("/all/favorites", authProtect, getAllFavoriteImages);
router.get("/total/count", authProtect, getTotalNumberImages);

module.exports = router;
