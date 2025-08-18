const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { authMiddleware } = require("../middleware/auth");

const { getHealthStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);

router.get("/status", authMiddleware, taskController.getTasksByStatus);

router.post("/", authMiddleware, taskController.createTask);
router.post("/:classId", authMiddleware, taskController.createTask);
router.get("/master/:masterTaskId", authMiddleware, taskController.getAssignedTasksByMasterTaskId);
router.get("/", authMiddleware, taskController.getTasks);
router.get("/class-connected", authMiddleware, taskController.getAllTasksConnectedToClass);
router.get("/no-class", authMiddleware, taskController.getAllTasksWithoutClass);
router.get("/count/connected", authMiddleware, taskController.getTaskCountConnectedToClass);
router.get("/count/not-connected", authMiddleware, taskController.getTaskCountWithoutClass);

router.get("/:id", authMiddleware, taskController.getTaskById);
router.get("/class/:classId", authMiddleware, taskController.getTasksByClassId);
router.put("/:id", authMiddleware, taskController.updateTask);
router.put("/master/:masterTaskId", authMiddleware, taskController.updateTasksByMasterTaskId);
router.delete("/:id", authMiddleware, taskController.deleteTaskById);
router.delete("/master/:masterTaskId", authMiddleware, taskController.deleteTaskByMasterTaskId,
);

module.exports = router;
