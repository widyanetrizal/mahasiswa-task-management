const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authMiddleware } = require("../middleware/auth");

const { getHealthStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);

router.get('/count', authMiddleware, classController.getClassCount);

router.post('/', authMiddleware, classController.createClass);
router.post('/:classId/students', authMiddleware, classController.addStudentsToClass);
router.get('/', authMiddleware, classController.getMyClasses );
router.get('/:classId', authMiddleware, classController.getClassInfo);
router.get('/:id/members', authMiddleware, classController.getClassMembers);

router.put('/:classId', authMiddleware, classController.updateClass);
router.delete('/:classId/students/:studentId', authMiddleware, classController.removeStudentFromClass);
router.delete('/:classId', authMiddleware, classController.deleteClass);


module.exports = router;
