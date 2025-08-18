const express = require("express");
const router = express.Router();
const controller = require("../controllers/progressController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const { getHealthStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);

router.put("/:id", authenticateToken,  upload.single('file'), controller.updateProgress);
router.get("/task/individual/:taskId", authenticateToken, controller.getByTaskIndividualId);
router.get("/task/group/:taskId", authenticateToken, controller.getByTaskGroupId);
router.put("/:id/comment", authenticateToken, upload.single('file'),  controller.addCommentByDosen);
router.get(
  "/statistik/:userId", authenticateToken,
  controller.getStatistikByUser
);
router.get("/user/:userId", authenticateToken, controller.getByUserId);

router.delete("/task/individual/:taskId", authenticateToken, controller.deleteByTaskIndividualId);
router.delete("/task/group/:taskId", authenticateToken, controller.deleteByTaskGroupId,
);

// router.get("/task/:taskId/progresses", authenticateToken, controller.getProgressByTaskId);
// router.get(
//   "/user/:userId", authenticateToken,
//   controller.getProgressByUserId
// );
// router.get(
//   "/creator/:createdBy", authenticateToken,
//   controller.getProgressByCreator
// );

module.exports = router;
