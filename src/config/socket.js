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

  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.user.id}`);

    // ─────────────────────────────────────────
    // 📥 JOIN A CHAT ROOM
    // Client emits: joinRoom with { chatRoomId }
    // ─────────────────────────────────────────
    socket.on("joinRoom", ({ chatRoomId }) => {
      socket.join(chatRoomId);
      console.log(`👤 User ${socket.user.id} joined room: ${chatRoomId}`);
    });

    // ─────────────────────────────────────────
    // 📤 SEND MESSAGE
    // Client emits: sendMessage with { chatRoomId, receiverId, message, image }
    // ─────────────────────────────────────────
    socket.on("sendMessage", async (data) => {
      try {
        const { chatRoomId, receiverId, message, image } = data;

        if (!chatRoomId || !receiverId || !message) {
          socket.emit("error", { message: "chatRoomId, receiverId and message are required" });
          return;
        }

        // Save message to DB
        const newMessage = await Message.create({
          chatRoomId,
          senderId: socket.user.id,
          receiverId,
          message,
          image: image || null,
        });

        // Update room's last message
        await ChatRoom.findOneAndUpdate(
          { chatRoomId },
          { lastMessage: message, lastMessageAt: new Date() }
        );

        const populated = await newMessage.populate("senderId", "name profileImage");

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