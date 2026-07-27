// config/socket.js
const jwt = require("jsonwebtoken");
const { Message, ChatRoom } = require("../models/Chat.model");

const isParticipant = (room, userId) =>
  room.participants.map((p) => p.toString()).includes(userId.toString());

const leaveOtherChatRooms = (socket) => {
  for (const room of socket.rooms) {
    if (room !== socket.id && !room.startsWith("user_")) {
      socket.leave(room);
    }
  }
};

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

    // Personal inbox room only — do NOT auto-join all chat rooms
    // (that caused newMessage to arrive for every conversation at once)
    socket.join(`user_${socket.user.id}`);

    // ─────────────────────────────────────────
    // 📥 JOIN A CHAT ROOM
    // Client emits: joinRoom with { chatRoomId }
    // Call this when opening a specific chat screen
    // ─────────────────────────────────────────
    socket.on("joinRoom", async ({ chatRoomId }) => {
      try {
        if (!chatRoomId) return;

        const room = await ChatRoom.findOne({ chatRoomId });
        if (!room) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        if (!isParticipant(room, socket.user.id)) {
          socket.emit("error", { message: "Not authorized for this room" });
          return;
        }

        // Only stay in one chat room at a time
        leaveOtherChatRooms(socket);
        socket.join(chatRoomId);
        console.log(`👤 User ${socket.user.id} joined room: ${chatRoomId}`);
      } catch (err) {
        console.error("joinRoom error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ─────────────────────────────────────────
    // 📤 LEAVE A CHAT ROOM
    // Client emits: leaveRoom with { chatRoomId }
    // Call this when leaving a chat screen
    // ─────────────────────────────────────────
    socket.on("leaveRoom", ({ chatRoomId }) => {
      if (!chatRoomId) return;
      socket.leave(chatRoomId);
      console.log(`👤 User ${socket.user.id} left room: ${chatRoomId}`);
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

        const room = await ChatRoom.findOne({ chatRoomId });
        if (!room) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        if (!isParticipant(room, socket.user.id)) {
          socket.emit("error", { message: "Not authorized for this room" });
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

        // 📡 Only sockets currently in THIS chatRoomId get the full message
        io.to(chatRoomId).emit("newMessage", {
          success: true,
          data: populated,
        });

        // Inbox preview for both users (list screen), not thread dump
        const chatUpdated = {
          chatRoomId,
          lastMessage: msgContent,
          lastMessageAt: new Date(),
        };
        io.to(`user_${socket.user.id}`).emit("chatUpdated", chatUpdated);
        io.to(`user_${receiverId}`).emit("chatUpdated", chatUpdated);
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
      if (!chatRoomId) return;
      // Broadcast to others in the room (not the sender)
      socket.to(chatRoomId).emit("userTyping", {
        userId: socket.user.id,
        chatRoomId,
      });
    });

    // ─────────────────────────────────────────
    // ✋ STOP TYPING
    // Client emits: stopTyping with { chatRoomId }
    // ─────────────────────────────────────────
    socket.on("stopTyping", ({ chatRoomId }) => {
      if (!chatRoomId) return;
      socket.to(chatRoomId).emit("userStoppedTyping", {
        userId: socket.user.id,
        chatRoomId,
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
