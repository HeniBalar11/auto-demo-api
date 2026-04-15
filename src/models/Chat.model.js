// models/Chat.model.js
const mongoose = require("mongoose");

// 💬 Individual Message
const messageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: String,
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      default: "",
    },

    image: {
      type: String,  // image URL (optional)
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🏠 Chat Room (tracks who is in a conversation)
const chatRoomSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: String,
      required: true,
      unique: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // linked to a custom request or order
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomProductRequest",
      default: null,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = { Message, ChatRoom };