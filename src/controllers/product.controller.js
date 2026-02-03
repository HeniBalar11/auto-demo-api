const Product = require("../models/Product.model");
const { getMediaType } = require("../utils/image.upload");
const path = require("path");
const fs = require("fs");
/**
 * MAKER ➜ Add Product
 */
exports.createProduct = async (req, res) => {
  try {
    console.log("req.body:", req.body);

    // const files = req?.files?.length > 0;
    const { name, details, price, category, material } = req.body;

    if (!name || !details || !price) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const media =
      req.files?.media?.length > 0
        ? req.files.media.map((file) => ({
            url: file.path,
            type: getMediaType(file.path),
          }))
        : [];

    const product = await Product.create({
      name,
      details,
      media,
      price,
      category,
      material,
      createdBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * CUSTOMER & MAKER ➜ Get All Products
 */
exports.getAllProducts = async (_req, res) => {
  try {
    const products = await Product.find({ isDeleted: false })
      .populate("createdBy", "name email phoneNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Products all fetching successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * MAKER ➜ Update own product
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not authorized",
      });
    }

    if (req.body.removedImg?.length) {
      const removedIds = Array.isArray(req.body.removedImg)
        ? req.body.removedImg
        : JSON.parse(req.body.removedImg);

      product.media = product.media.filter((media) => {
        if (removedIds.includes(media._id.toString())) {
          const filePath = path.join(process.cwd(), media.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return false; // remove from array
        }
        return true;
      });
    }

    if (req.files?.media?.length > 0) {
      const newMedia = req.files.media.map((file) => ({
        url: file.path,
        type: getMediaType(file.path),
      }));

      if (product.media.length + newMedia.length > 11) {
        return res.status(400).json({
          success: false,
          message: "Maximum 11 media files allowed per product",
        });
      }

      product.media.push(...newMedia);
    }

    const allowedUpdates = ["name", "details", "price", "category", "material"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/**
 * MAKER ➜ Delete own product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not authorized",
      });
    }

    product.isDeleted = true;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * MAKER ➜ Get by ID own product
 */
exports.getByIdProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product fetching successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
