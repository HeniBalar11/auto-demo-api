// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db");
const setupSocket = require("./src/config/socket");

const app = express();

const path = require("path");

// 🔗 Database connection
connectDB();

// 🧩 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🛣️ Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/product", require("./src/routes/product.routes"));
app.use("/api/custom-request", require("./src/routes/customRequest.routes"));
app.use("/api/bids", require("./src/routes/bid.routes"));
app.use("/api/categories", require("./src/routes/category.routes"));
app.use("/api/cart", require("./src/routes/cart.routes"));
app.use("/api/wishlist", require("./src/routes/wishlist.routes"));
app.use("/api/chat", require("./src/routes/chat.routes"));

// 🩺 Health check
app.get("/", (req, res) => {
  console.log("🚀 Auth API running successfully");
  res.send("🚀 Auth API running successfully");
});

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// 🔌 Create HTTP server and attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"],
  },
});

// 🚀 Setup socket events
setupSocket(io);
app.set("io", io);

// 🚀 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
