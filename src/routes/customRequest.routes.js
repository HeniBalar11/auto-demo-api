const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const { upload } = require("../utils/image.upload");

const customRequestController = require("../controllers/customRequest.controller");

// CUSTOMER ➜ Create request
router.post("/", auth, upload, customRequestController.createRequest);
router.get("/:id", auth, customRequestController.getRequestById);
router.put("/:id", auth, upload, customRequestController.updateRequest);
router.delete("/:id", auth, customRequestController.deleteRequest);

// MAKER ➜ View all open requests
router.get("/", auth, customRequestController.getAllOpenRequests);

// CUSTOMER -> View own requests
router.get("/my", auth, customRequestController.getMyRequests);

module.exports = router;
