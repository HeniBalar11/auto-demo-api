const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { isMaker } = require("../middlewares/role.middleware");

const bidController = require("../controllers/bid.controller");

// MAKER ➜ Place bid
router.post("/", auth, isMaker, bidController.placeBid);

// CUSTOMER ➜ View bids on own request
router.get("/request/:requestId", auth, bidController.getBidsByRequest);

// CUSTOMER ➜ Accept bid
router.post("/:bidId/accept", auth, bidController.acceptBid);

module.exports = router;
