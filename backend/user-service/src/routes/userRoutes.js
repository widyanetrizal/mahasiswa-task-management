const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
// const { authorizeRoles } = require("../middleware/authMiddleware");

const { getHealthStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/profile", authenticateToken, controller.getProfile);
router.get("/count-by-role", authenticateToken, controller.getUserCountByRole);

router.get("/", authenticateToken, controller.getUsers);

router.get("/email/:email", authenticateToken, controller.getUserByEmail);
router.get("/:id", authenticateToken, controller.getUserById);
router.put("/update", authenticateToken, controller.updateProfile);
router.delete("/:id", authenticateToken, controller.deleteAccount);

module.exports = router;
