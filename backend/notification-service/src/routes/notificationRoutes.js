const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationController");

const { getHealthStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);

router.get("/", controller.getAllNotifications);
router.get("/:userId", controller.getNotificationsByUser);
router.get("/latest/:userId", controller.getLatestNotificationByUser);
router.put("/:id/read", controller.markAsRead);
router.delete("/:id/:userId", controller.deleteNotificationByUser);

module.exports = router;
