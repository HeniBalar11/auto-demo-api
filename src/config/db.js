// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
    });

    // const conn = await mongoose.connect("mongodb+srv://henibalar:Ajglh54UNdBMVr5N@cluster0.z0yc2ug.mongodb.net/auto-system", {
    //   autoIndex: true,
    // });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
