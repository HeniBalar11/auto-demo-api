// controllers/wishlist.controller.js
const Wishlist = require("../models/Wishlist.model");
const Product = require("../models/Product.model");

// ─────────────────────────────────────────────
// 1️⃣ TOGGLE WISHLIST (add if not there, remove if already there)
// POST /api/wishlist/toggle
// Body: { productId }
// 🔒 Protected
// ─────────────────────────────────────────────
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    // Check product exists
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      // Create wishlist and add item
      wishlist = await Wishlist.create({
        userId: req.user.id,
        items: [productId],
      });
      return res.status(200).json({
        success: true,
        message: "Added to wishlist",
        isWishlisted: true,
      });
    }

    const isAlreadyWishlisted = wishlist.items
      .map((id) => id.toString())
      .includes(productId);

    if (isAlreadyWishlisted) {
      // Remove from wishlist
      wishlist.items = wishlist.items.filter((id) => id.toString() !== productId);
      await wishlist.save();
      return res.status(200).json({
        success: true,
        message: "Removed from wishlist",
        isWishlisted: false,
      });
    } else {
      // Add to wishlist
      wishlist.items.push(productId);
      await wishlist.save();
      return res.status(200).json({
        success: true,
        message: "Added to wishlist",
        isWishlisted: true,
      });
    }
  } catch (error) {
    console.error("toggleWishlist error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 2️⃣ GET WISHLIST
// GET /api/wishlist
// 🔒 Protected
// ─────────────────────────────────────────────
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate({
      path: "items",
      match: { isDeleted: false },
      select: "about.title about.media pricing ratingAvg totalReviews",
    });

    if (!wishlist) {
      return res.status(200).json({ success: true, data: { items: [] } });
    }

    return res.status(200).json({
      success: true,
      data: { items: wishlist.items },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 3️⃣ REMOVE FROM WISHLIST
// DELETE /api/wishlist/remove/:productId
// 🔒 Protected
// ─────────────────────────────────────────────
exports.removeFromWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    wishlist.items = wishlist.items.filter(
      (id) => id.toString() !== req.params.productId
    );
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};