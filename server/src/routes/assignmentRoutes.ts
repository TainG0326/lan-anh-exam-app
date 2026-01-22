import express from 'express';
import {
  createAssignment,
  getAssignments,
  submitAssignment,
  gradeSubmission,
  getSubmissions,
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('teacher'), createAssignment);
router.get('/', getAssignments);
router.post('/submit', authorize('student'), submitAssignment);
router.post('/grade', authorize('teacher'), gradeSubmission);
router.get('/:assignmentId/submissions', authorize('teacher'), getSubmissions);

export default router;






