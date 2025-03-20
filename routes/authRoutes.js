const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  updateAccount,
  deleteAccount,
} = require("../controllers/authControllers");
const authProtect = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/logout", logout);
// Protected routes (require authentication)
router.put("/update-account", authProtect, updateAccount);
router.delete("/delete-account", authProtect, deleteAccount);
module.exports = router;
