const Category = require("../models/Category.model");
const SubCategory = require("../models/SubCategory.model");

/**
 * Create Category
 */
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const image = req.files?.media?.length ? req.files.media[0].path : null;

    const category = await Category.create({
      name,
      image,
    });

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Create SubCategory
 */
exports.createSubCategory = async (req, res) => {
  try {
    const { categoryId, name } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    const existing = await SubCategory.findOne({ categoryId, name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "SubCategory already exists",
      });
    }

    const subCategory = await SubCategory.create({
      categoryId,
      name,
    });

    return res.status(200).json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get All Categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get SubCategories By Category
 */
exports.getSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find({
      categoryId: req.params.categoryId,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getCategoriesWithSubCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $match: { isActive: true }, // ✅ Only active categories
      },
      {
        $lookup: {
          from: "subcategories",
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$categoryId", "$$categoryId"] },
                isActive: true, // ✅ Only active subcategories
              },
            },
            {
              $project: { name: 1, _id: 0 },
            },
          ],
          as: "subCategoriesData",
        },
      },
      {
        $project: {
          image: 1,
          category: "$name",
          subCategories: "$subCategoriesData.name",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * 🔥 GET ATTRIBUTES SCHEMA FOR A SUBCATEGORY
 * GET /api/categories/subcategory/:subCategoryId/attributes
 * Flutter uses this to dynamically build the product-add form
 */
exports.getSubCategoryAttributes = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.subCategoryId);

    if (!subCategory) {
      return res.status(404).json({ success: false, message: "SubCategory not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        category: subCategory.name,
        personalisationAllowed: subCategory.personalisationAllowed,
        details: subCategory.attributeSchema,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};