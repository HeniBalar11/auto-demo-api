// controllers/cart.controller.js
const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");

// ─────────────────────────────────────────────
// 1️⃣ ADD TO CART
// POST /api/cart/add
// Body: { productId, quantity, selectedVariation }
// 🔒 Protected
// ─────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedVariation } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    // Check product exists
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check stock
    if (product.inventory.quantity < quantity) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      // Create new cart
      cart = await Cart.create({
        userId: req.user.id,
        items: [{ productId, quantity, selectedVariation: selectedVariation || {} }],
      });
    } else {
      // Check if product already in cart
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += Number(quantity);
      } else {
        cart.items.push({ productId, quantity, selectedVariation: selectedVariation || {} });
      }

      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Added to cart",
      data: cart,
    });
  } catch (error) {
    console.error("addToCart error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 2️⃣ GET CART
// GET /api/cart
// 🔒 Protected
// ─────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate({
      path: "items.productId",
      select: "about.title about.media pricing inventory settings.status",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        data: { items: [], totalItems: 0, totalPrice: 0 },
      });
    }

    // Calculate totals
    let totalPrice = 0;
    let totalItems = 0;

    const items = cart.items
      .filter((item) => item.productId) // skip if product deleted
      .map((item) => {
        const price = item.productId?.pricing?.base || 0;
        const qty = item.quantity;
        totalPrice += price * qty;
        totalItems += qty;
        return {
          _id: item._id,
          productId: item.productId,
          quantity: qty,
          selectedVariation: item.selectedVariation,
          itemTotal: price * qty,
        };
      });

    return res.status(200).json({
      success: true,
      data: { items, totalItems, totalPrice },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 3️⃣ UPDATE QUANTITY
// PUT /api/cart/update
// Body: { productId, quantity }
// 🔒 Protected
// ─────────────────────────────────────────────
exports.updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: "productId and quantity required" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    item.quantity = Number(quantity);
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 4️⃣ REMOVE ITEM
// DELETE /api/cart/remove/:productId
// 🔒 Protected
// ─────────────────────────────────────────────
exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== req.params.productId
    );
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 5️⃣ CLEAR CART
// DELETE /api/cart/clear
// 🔒 Protected
// ─────────────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: [] }
    );

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};