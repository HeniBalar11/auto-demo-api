const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { upload } = require("../utils/image.upload");

const customRequestController = require("../controllers/customRequest.controller");

// CUSTOMER ➜ Create request
router.post("/", auth, upload, customRequestController.createRequest);

// MAKER ➜ View all open requests
router.get("/", auth, customRequestController.getAllOpenRequests);

// CUSTOMER -> View own requests
router.get("/my", auth, customRequestController.getMyRequests);

module.exports = router;
