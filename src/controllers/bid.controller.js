const Bid = require("../models/Bid.model");
const CustomRequest = require("../models/CustomProductRequest.model");

/**
 * MAKER ➜ Place Bid
 */
exports.placeBid = async (req, res) => {
  try {
    const { requestId, price, deliveryDays, message } = req.body;

    const request = await CustomRequest.findById(requestId);

    if (!request || request.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "Request not available for bidding",
      });
    }

    // Prevent maker bidding twice
    const existingBid = await Bid.findOne({
      requestId,
      makerId: req.user.id,
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: "You already placed a bid",
      });
    }

    const bid = await Bid.create({
      requestId,
      makerId: req.user.id,
      price,
      deliveryDays,
      message,
    });

    return res.status(200).json({
      success: true,
      message: "Bid placed successfully",
      data: bid,
    });
  } catch (error) {
    console.error("Place bid error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * CUSTOMER ➜ View bids on own request
 */
exports.getBidsByRequest = async (req, res) => {
  try {
    const request = await CustomRequest.findById(req.params.requestId);

    if (!request || request.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const bids = await Bid.find({ requestId: req.params.requestId })
      .populate("makerId", " _id name email rating")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        bidsData: bids,
        requestData: request,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * CUSTOMER ➜ Accept Bid
 */
exports.acceptBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    const request = await CustomRequest.findById(bid.requestId);

    if (request.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Update request
    request.status = "in_progress";
    request.selectedMakerId = bid.makerId;
    await request.save();

    // Accept selected bid
    bid.status = "accepted";
    await bid.save();

    // Reject other bids
    await Bid.updateMany(
      { requestId: request._id, _id: { $ne: bid._id } },
      { status: "rejected" },
    );

    return res.status(200).json({
      success: true,
      message: "Bid accepted successfully",
    });
  } catch (error) {
    console.error("Accept bid error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
