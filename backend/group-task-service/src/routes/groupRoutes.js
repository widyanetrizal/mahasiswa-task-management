const express = require("express");
const router = express.Router();
const controller = require("../controllers/groupController");
const { authMiddleware } = require("../middleware/auth");

const { getHealthStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);

router.post("/", authMiddleware, controller.createGroup);
router.get("/", authMiddleware, controller.getAllGroups);
router.get("/my-groups", authMiddleware, controller.getMyGroups);
router.get("/no-class", authMiddleware, controller.getGroupsWithoutClass);
router.get("/class/:classId", authMiddleware, controller.getGroupsByClass);

router.post("/:classId", authMiddleware, controller.createGroup);
router.post("/:groupId/addMember", authMiddleware, controller.addMember);
router.get("/:groupId/members", authMiddleware, controller.getGroupMembers);
router.get("/:groupId/tasks/:taskId", authMiddleware, controller. getTaskByGroupAndId);
router.get("/:groupId/details", authMiddleware, controller. getGroupDetails);
router.get("/:groupId/members/:userId", authMiddleware, controller. checkMembership);
router.get("/:id/tasks", authMiddleware, controller.getGroupTasks);
router.put("/:groupId", authMiddleware, controller.updateGroupName);
router.put("/:groupId/tasks/:taskId", authMiddleware, controller.updateGroupTask);

router.delete("/:taskId/task", authMiddleware, controller.deleteGroupTask);
router.delete("/:groupId/group", authMiddleware, controller.deleteGroup);
router.post("/tasks/:groupId", authMiddleware, controller.addGroupTask);


router.get("/:id", authMiddleware, controller.getGroupById);

module.exports = router;
