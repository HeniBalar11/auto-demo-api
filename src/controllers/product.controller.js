const Product = require("../models/Product.model");
const { getMediaType } = require("../utils/image.upload");
/**
 * MAKER ➜ Add Product
 */
exports.createProduct = async (req, res) => {
  try {
    console.log("req.body:", req.body);

    // const files = req?.files?.length > 0;
    const { name, details, price, category, material, media } = req.body;

    if (!name || !details || !price) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // const media = req.files.map((file) => ({
    //   url: file.path,
    //   type: getMediaType(file.path),
    // }));

    // console.log("Media:", media);
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
    const products = await Product.find().populate(
      "createdBy",
      "name email phoneNumber",
    );

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
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not authorized",
      });
    }

    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map((file) => ({
        url: file.path,
        type: getMediaType(file.path),
      }));
      product.media.push(...newMedia);
    }

    Object.assign(product, req.body);
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
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
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not authorized",
      });
    }

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
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not authorized",
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
