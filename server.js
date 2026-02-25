// server.js
require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db");

const app = express();

// 🔗 Database connection
connectDB();

// 🧩 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🛣️ Routes
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/product", require("./src/routes/product.routes"));
app.use("/api/custom-request", require("./src/routes/customRequest.routes"));
app.use("/api/bids", require("./src/routes/bid.routes"));
app.use("/api/categories", require("./src/routes/category.routes"));

// 🩺 Health check
app.get("/", (req, res) => {
  res.send("🚀 Auth API running successfully");
});

// ❌ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// 🚀 Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
