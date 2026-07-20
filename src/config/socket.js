// config/socket.js
const jwt = require("jsonwebtoken");
const { Message, ChatRoom } = require("../models/Chat.model");

const setupSocket = (io) => {
  // 🔒 Authenticate socket connection using JWT token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: No token"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // attach user to socket
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`✅ Socket connected: ${socket.user.id}`);

    // Auto-join all rooms so user gets live messages in inbox
    try {
      const rooms = await ChatRoom.find({ participants: socket.user.id });
      rooms.forEach((room) => socket.join(room.chatRoomId));
      console.log(`👤 User ${socket.user.id} joined ${rooms.length} room(s)`);
    } catch (err) {
      console.error("Auto-join rooms error:", err);
    }

    // ─────────────────────────────────────────
    // 📥 JOIN A CHAT ROOM (optional — for new rooms)
    // Client emits: joinRoom with { chatRoomId }
    // ─────────────────────────────────────────
    socket.on("joinRoom", ({ chatRoomId }) => {
      if (!chatRoomId) return;
      socket.join(chatRoomId);
      console.log(`👤 User ${socket.user.id} joined room: ${chatRoomId}`);
    });

    // ─────────────────────────────────────────
    // 📤 SEND MESSAGE
    // Client emits: sendMessage with { chatRoomId, receiverId, message, mediaType, attachments }
    // ─────────────────────────────────────────
    socket.on("sendMessage", async (data) => {
      try {
        const { chatRoomId, receiverId, message, image, mediaType, attachments } = data;

        if (!chatRoomId || !receiverId) {
          socket.emit("error", {
            message: "chatRoomId and receiverId are required",
          });
          return;
        }

        const msgContent = message || (mediaType ? `[${mediaType.toUpperCase()}]` : "");

        // Save message to DB
        const newMessage = await Message.create({
          chatRoomId,
          senderId: socket.user.id,
          receiverId,
          message: msgContent,
          image: image || null,
          mediaType: mediaType || "text",
          attachments: attachments || [],
        });

        // Update room's last message
        await ChatRoom.findOneAndUpdate(
          { chatRoomId },
          { lastMessage: msgContent, lastMessageAt: new Date() },
        );

        const populated = await newMessage.populate(
          "senderId",
          "name profileImage",
        );

        // 📡 Broadcast to everyone in the room (including sender)
        io.to(chatRoomId).emit("newMessage", {
          success: true,
          data: populated,
        });
      } catch (error) {
        console.error("Socket sendMessage error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ─────────────────────────────────────────
    // ✍️ TYPING INDICATOR
    // Client emits: typing with { chatRoomId }
    // ─────────────────────────────────────────
    socket.on("typing", ({ chatRoomId }) => {
      // Broadcast to others in the room (not the sender)
      socket.to(chatRoomId).emit("userTyping", {
        userId: socket.user.id,
      });
    });

    // ─────────────────────────────────────────
    // ✋ STOP TYPING
    // Client emits: stopTyping with { chatRoomId }
    // ─────────────────────────────────────────
    socket.on("stopTyping", ({ chatRoomId }) => {
      socket.to(chatRoomId).emit("userStoppedTyping", {
        userId: socket.user.id,
      });
    });

    // ─────────────────────────────────────────
    // 🔴 DISCONNECT
    // ─────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.user.id}`);
    });
  });
};

module.exports = setupSocket;
