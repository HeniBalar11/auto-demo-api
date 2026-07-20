// routes/chat.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { upload } = require("../utils/image.upload");
const { uploadChatFiles } = require("../utils/file.upload");
const chatController = require("../controllers/chat.controller");

// 🏠 Start or get a chat room
router.post("/room", auth, chatController.getOrCreateRoom);

// 📬 Get all my chat rooms (inbox)
router.get("/rooms", auth, chatController.getMyChatRooms);

// 💬 Get messages of a room
router.get("/messages/:chatRoomId", auth, chatController.getMessages);

// 📤 Send message (REST fallback)
router.post("/send", auth, upload, chatController.sendMessage);

// 📁 Upload chat media files (Images, PDFs, Audio)
router.post("/upload", auth, uploadChatFiles, chatController.uploadMedia);

module.exports = router;