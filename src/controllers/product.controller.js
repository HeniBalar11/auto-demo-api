// controllers/product.controller.js
const Product = require("../models/Product.model");
const Category = require("../models/Category.model");
const SubCategory = require("../models/SubCategory.model");
const { getMediaType } = require("../utils/image.upload");
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────
// 1️⃣ CREATE PRODUCT (Maker only)
// POST /api/product
// ─────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      // ABOUT
      title, description, categoryId, subCategoryId,
      personalisationEnabled, personalisationMaxChars, shopSection,
      // PRICING
      basePrice, currency, countryPrices,
      // INVENTORY
      quantity, sku,
      // VARIATIONS
      variations,
      // DETAILS
      madeBy, materials, attributes, tags,
      // DELIVERY
      madeToOrder, processingTimeDays,
      domesticPrice, domesticDays, freeShipping,
      internationalPrice, internationalDays, internationalAvailable,
      // SETTINGS
      returnsAccepted, exchangeAccepted, cancellationAllowed, status,
      // PRODUCT INFORMATION (Etsy-style)
      whoCreated, itemType, itemProduced,
    } = req.body;

    // Validate required fields
    if (!title || !description || !categoryId || !basePrice || !quantity) {
      return res.status(400).json({
        success: false,
        message: "title, description, categoryId, basePrice and quantity are required",
      });
    }

    // Check category exists
    const category = await Category.findOne({ _id: categoryId, isActive: true });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Handle media uploads
    const media =
      req.files?.media?.length > 0
        ? req.files.media.map((file) => ({
          url: file.path,
          type: getMediaType(file.path),
        }))
        : [];

    // Parse JSON strings if sent from form-data
    const parsedVariations = variations
      ? typeof variations === "string" ? JSON.parse(variations) : variations
      : [];
    const parsedMaterials = materials
      ? typeof materials === "string" ? JSON.parse(materials) : materials
      : [];
    const parsedTags = tags
      ? typeof tags === "string" ? JSON.parse(tags) : tags
      : [];
    const parsedAttributes = attributes
      ? typeof attributes === "string" ? JSON.parse(attributes) : attributes
      : {};
    const parsedCountryPrices = countryPrices
      ? typeof countryPrices === "string" ? JSON.parse(countryPrices) : countryPrices
      : {};

    const product = await Product.create({
      about: {
        title,
        description,
        categoryId,
        subCategoryId: subCategoryId || null,
        media,
        personalisation: {
          enabled: personalisationEnabled === "true" || personalisationEnabled === true,
          maxChars: Number(personalisationMaxChars) || 0,
        },
        shopSection: shopSection || null,
      },
      pricing: {
        base: Number(basePrice),
        currency: currency || "INR",
        countryPrices: parsedCountryPrices,
      },
      inventory: {
        quantity: Number(quantity),
        sku: sku || null,
      },
      variations: parsedVariations,
      details: {
        madeBy: madeBy || "Handmade",
        materials: parsedMaterials,
        attributes: parsedAttributes,
        tags: parsedTags,
      },
      delivery: {
        madeToOrder: madeToOrder === "true" || madeToOrder === true,
        processingTimeDays: Number(processingTimeDays) || 3,
        shipping: {
          domestic: {
            price: Number(domesticPrice) || 0,
            days: Number(domesticDays) || 3,
            freeShipping: freeShipping === "true" || freeShipping === true,
          },
          international: {
            price: Number(internationalPrice) || 0,
            days: Number(internationalDays) || 7,
            available: internationalAvailable === "true" || internationalAvailable === true,
          },
        },
      },
      settings: {
        returnsAccepted: returnsAccepted !== "false",
        exchangeAccepted: exchangeAccepted === "true" || exchangeAccepted === true,
        cancellationAllowed: cancellationAllowed !== "false",
        status: status || "active",
      },
      productInfo: {
        whoCreated: whoCreated || "I created it",
        itemType: itemType || "Finished product",
        itemProduced: itemProduced || "Made to order",
      },
      createdBy: req.user.id,
    });

    const savedProduct = await Product.findById(product._id).lean();

    return res.status(200).json({
      success: true,
      message: "Product added successfully",
      data: savedProduct,
    });
  } catch (error) {
    console.error("createProduct error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 2️⃣ GET ALL PRODUCTS (with filters)
// GET /api/product?category=&minPrice=&maxPrice=&material=&search=&status=active
// ─────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, material, search, status } = req.query;

    const filter = { isDeleted: false, "settings.status": status || "active" };

    if (category) filter["about.categoryId"] = category;
    if (material) filter["details.attributes.metalType"] = material;
    if (search) filter["about.title"] = { $regex: search, $options: "i" };
    if (minPrice || maxPrice) {
      filter["pricing.base"] = {};
      if (minPrice) filter["pricing.base"].$gte = Number(minPrice);
      if (maxPrice) filter["pricing.base"].$lte = Number(maxPrice);
    }

    const products = await Product.find(filter)
      .populate("createdBy", "name email phoneNumber profileImage")
      .populate("about.categoryId", "name")
      .populate("about.subCategoryId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 3️⃣ GET SINGLE PRODUCT
// GET /api/product/:id
// ─────────────────────────────────────────────
exports.getByIdProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("createdBy", "name email phoneNumber profileImage rating")
      .populate("about.categoryId", "name")
      .populate("about.subCategoryId", "name attributeSchema");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 4️⃣ UPDATE PRODUCT (Maker only)
// PUT /api/product/:id
// ─────────────────────────────────────────────
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

    // Remove media by ID if requested
    if (req.body.removedImg?.length) {
      const removedIds = Array.isArray(req.body.removedImg)
        ? req.body.removedImg
        : JSON.parse(req.body.removedImg);

      product.about.media = product.about.media.filter((media) => {
        if (removedIds.includes(media._id.toString())) {
          const filePath = path.join(process.cwd(), media.url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return false;
        }
        return true;
      });
    }

    // Add new media
    if (req.files?.media?.length > 0) {
      const newMedia = req.files.media.map((file) => ({
        url: file.path,
        type: getMediaType(file.path),
      }));
      if (product.about.media.length + newMedia.length > 11) {
        return res.status(400).json({
          success: false,
          message: "Maximum 11 media files allowed",
        });
      }
      product.about.media.push(...newMedia);
    }

    // Update fields
    const b = req.body;
    if (b.title) product.about.title = b.title;
    if (b.description) product.about.description = b.description;
    if (b.categoryId) product.about.categoryId = b.categoryId;
    if (b.subCategoryId) product.about.subCategoryId = b.subCategoryId;
    if (b.shopSection) product.about.shopSection = b.shopSection;
    if (b.basePrice) product.pricing.base = Number(b.basePrice);
    if (b.currency) product.pricing.currency = b.currency;
    if (b.quantity) product.inventory.quantity = Number(b.quantity);
    if (b.sku) product.inventory.sku = b.sku;
    if (b.variations) product.variations = typeof b.variations === "string" ? JSON.parse(b.variations) : b.variations;
    if (b.madeBy) product.details.madeBy = b.madeBy;
    if (b.materials) product.details.materials = typeof b.materials === "string" ? JSON.parse(b.materials) : b.materials;
    if (b.tags) product.details.tags = typeof b.tags === "string" ? JSON.parse(b.tags) : b.tags;
    if (b.attributes) product.details.attributes = typeof b.attributes === "string" ? JSON.parse(b.attributes) : b.attributes;
    if (b.status) product.settings.status = b.status;
    if (b.returnsAccepted !== undefined) product.settings.returnsAccepted = b.returnsAccepted !== "false";
    // PRODUCT INFORMATION
    if (b.whoCreated) product.productInfo.whoCreated = b.whoCreated;
    if (b.itemType) product.productInfo.itemType = b.itemType;
    if (b.itemProduced) product.productInfo.itemProduced = b.itemProduced;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 5️⃣ DELETE PRODUCT (Maker only)
// DELETE /api/product/:id
// ─────────────────────────────────────────────
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
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// 6️⃣ GET MY PRODUCTS (Maker's own listings)
// GET /api/product/my
// ─────────────────────────────────────────────
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      createdBy: req.user.id,
      isDeleted: false,
    })
      .populate("about.categoryId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};