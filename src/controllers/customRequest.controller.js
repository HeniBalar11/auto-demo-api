const CustomRequest = require("../models/CustomProductRequest.model");

/**
 * CUSTOMER ➜ Create Custom Request
 */
exports.createRequest = async (req, res) => {
  try {
    const { title, description, budgetMin, budgetMax, deadline } = req.body;

    if (!title || !description || !budgetMin || !budgetMax) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    if (Number(budgetMin) > Number(budgetMax)) {
      return res.status(400).json({
        success: false,
        message: "Minimum budget cannot be greater than maximum budget",
      });
    }

    // Handle image uploads
    const referenceImages =
      req.files?.media?.length > 0
        ? req.files.media.map((file) => file.path)
        : [];

    const newRequest = await CustomRequest.create({
      customerId: req.user.id,
      title,
      description,
      budgetMin,
      budgetMax,
      deadline,
      referenceImages,
    });

    return res.status(201).json({
      success: true,
      message: "Custom request created successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("Create Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * MAKER ➜ Get all open requests
 */
exports.getAllOpenRequests = async (req, res) => {
  try {
    const requests = await CustomRequest.find({ status: "open" })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await CustomRequest.find({
      customerId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.log("Get My Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
