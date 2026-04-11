import express from 'express';
import {
  getGradesByClass,
  getClassStatistics,
  updateExamScore,
  updateAssignmentScore,
} from '../controllers/gradeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and teacher role
router.use(protect);
router.use(authorize('teacher'));

router.get('/class/:classId', getGradesByClass);
router.get('/class/:classId/statistics', getClassStatistics);
router.put('/exam', updateExamScore);
router.put('/assignment', updateAssignmentScore);

export default router;
