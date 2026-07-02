// controllers/chat.controller.js
const { Message, ChatRoom } = require("../models/Chat.model");

// 🔑 Generate a consistent room ID from two user IDs
// (same room no matter who calls it first)
const generateRoomId = (userId1, userId2) => {
  return [userId1.toString(), userId2.toString()].sort().join("_");
};

// ─────────────────────────────────────────────
// 1️⃣ START OR GET A CHAT ROOM
// POST /api/chat/room
// Body: { receiverId, requestId (optional) }
// 🔒 Protected
// ─────────────────────────────────────────────
exports.getOrCreateRoom = async (req, res) => {
  try {
    const { receiverId, requestId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "receiverId is required",
      });
    }

    const chatRoomId = generateRoomId(senderId, receiverId);

    // Find or create the room
    let room = await ChatRoom.findOne({ chatRoomId });

    if (!room) {
      room = await ChatRoom.create({
        chatRoomId,
        participants: [senderId, receiverId],
        requestId: requestId || null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat room ready",
      data: room,
    });
  } catch (error) {
    console.error("getOrCreateRoom error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 2️⃣ GET ALL MY CHAT ROOMS (inbox)
// GET /api/chat/rooms
// 🔒 Protected
// ─────────────────────────────────────────────
exports.getMyChatRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user.id,
    })
      .populate("participants", "name email profileImage role")
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 3️⃣ GET MESSAGES OF A ROOM
// GET /api/chat/messages/:chatRoomId
// 🔒 Protected
// ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    // Make sure user is part of this room
    const room = await ChatRoom.findOne({ chatRoomId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Chat room not found" });
    }

    const isParticipant = room.participants
      .map((p) => p.toString())
      .includes(req.user.id);

    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Get messages (latest 50)
    const messages = await Message.find({ chatRoomId })
      .populate("senderId", "name profileImage")
      .sort({ createdAt: 1 })
      .limit(50);

    // Mark all unread messages as read
    await Message.updateMany(
      { chatRoomId, receiverId: req.user.id, isRead: false },
      { isRead: true },
    );

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 4️⃣ SEND MESSAGE (REST fallback — main is Socket)
// POST /api/chat/send
// Body: { chatRoomId, receiverId, message, image (optional) }
// 🔒 Protected
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { chatRoomId, receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!chatRoomId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: "chatRoomId, receiverId and message are required",
      });
    }

    // Handle optional image upload
    const image = req.files?.media?.length ? req.files.media[0].path : null;

    const newMessage = await Message.create({
      chatRoomId,
      senderId,
      receiverId,
      message,
      image,
    });

    // Update room's last message
    await ChatRoom.findOneAndUpdate(
      { chatRoomId },
      { lastMessage: message, lastMessageAt: new Date() },
    );

    const populated = await newMessage.populate(
      "senderId",
      "name profileImage",
    );

    const io = req.app.get("io");
    if (io) {
      io.to(chatRoomId).emit("newMessage", {
        success: true,
        data: populated,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message sent",
      data: populated,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export generateRoomId so socket can use it too
exports.generateRoomId = generateRoomId;
