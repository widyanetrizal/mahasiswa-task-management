const express = require("express");
const router = express.Router();
const controller = require ("../controllers/loggingController");
const { authMiddleware } = require("../middleware/auth");

const { getHealthStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);

router.get("/", authMiddleware, controller.getAllLogging);
router.delete("/:id", authMiddleware, controller.deleteLogging);

module.exports = router;
