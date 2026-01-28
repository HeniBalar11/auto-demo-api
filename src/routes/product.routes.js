const express = require("express");
const router = express.Router();

const authController = require("../middlewares/auth.middleware");
const { isMaker } = require("../middlewares/role.middleware");
const { upload } = require('../utils/image.upload');

const productController = require("../controllers/product.controller");


// CUSTOMER + MAKER
router.get("/", productController.getAllProducts);

// MAKER only
router.post("/", upload, authController, isMaker, productController.createProduct);
router.put("/:id", upload, authController, isMaker, productController.updateProduct);
router.get("/:id", authController, isMaker, productController.getByIdProduct);
router.delete("/:id", authController, isMaker, productController.deleteProduct);

module.exports = router;
