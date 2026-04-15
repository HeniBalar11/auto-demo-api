// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth.middleware");
const { upload } = require("../utils/image.upload");

// 🔓 Public routes (no token needed)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// 🔒 Protected routes (token required)
router.post("/change-password", auth, authController.changePassword);
router.put("/update-profile", auth, upload, authController.updateProfile);
router.get("/me", auth, authController.getMe);

module.exports = router;