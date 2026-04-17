// routes/wishlist.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const wishlistController = require("../controllers/wishlist.controller");

router.post("/toggle", auth, wishlistController.toggleWishlist);
router.get("/", auth, wishlistController.getWishlist);
router.delete("/remove/:productId", auth, wishlistController.removeFromWishlist);

module.exports = router;