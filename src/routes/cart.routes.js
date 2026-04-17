// routes/cart.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const cartController = require("../controllers/cart.controller");

router.post("/add", auth, cartController.addToCart);
router.get("/", auth, cartController.getCart);
router.put("/update", auth, cartController.updateQuantity);
router.delete("/remove/:productId", auth, cartController.removeItem);
router.delete("/clear", auth, cartController.clearCart);

module.exports = router;