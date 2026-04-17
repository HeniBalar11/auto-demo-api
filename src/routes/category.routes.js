const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { upload } = require("../utils/image.upload");

const categoryController = require("../controllers/category.controller");

// Create category
router.post("/", auth, upload, categoryController.createCategory);

// Create subcategory
router.post("/sub", auth, categoryController.createSubCategory);

// Get all categories
router.get("/", categoryController.getAllCategories);

// Get subcategories by category
router.get("/:categoryId/subcategories", categoryController.getSubCategories);

router.get("/with-sub", categoryController.getCategoriesWithSubCategories);

module.exports = router;

// 🔥 Get attribute schema for a subcategory (for Flutter product-add form)
router.get("/subcategory/:subCategoryId/attributes", categoryController.getSubCategoryAttributes);