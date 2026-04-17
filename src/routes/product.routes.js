// routes/product.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { isMaker } = require("../middlewares/role.middleware");
const { upload } = require("../utils/image.upload");
const productController = require("../controllers/product.controller");

// 🔓 Public
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getByIdProduct);

// 🔒 Maker only
router.get("/my/listings", auth, isMaker, productController.getMyProducts);
router.post("/", upload, auth, isMaker, productController.createProduct);
router.put("/:id", upload, auth, isMaker, productController.updateProduct);
router.delete("/:id", auth, isMaker, productController.deleteProduct);

module.exports = router;