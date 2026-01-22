import express from 'express';
import { createClass, getClasses, getClassById, addStudentToClass, joinClassByCode, getClassByCode, getMyClass } from '../controllers/classController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Teacher routes
router.post('/', authorize('teacher'), createClass);
router.get('/', authorize('teacher'), getClasses);
router.get('/:id', authorize('teacher'), getClassById);
router.post('/:classId/students', authorize('teacher'), addStudentToClass);

// Student routes
router.post('/join', authorize('student'), joinClassByCode);
router.get('/my', authorize('student'), getMyClass);
router.get('/code/:code', getClassByCode);

export default router;

