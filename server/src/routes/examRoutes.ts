import express from 'express';
import {
  createExam,
  getExams,
  getExamByCode,
  startExam,
  submitAnswer,
  submitExam,
  getExamResults,
  getAttempt,
  recordViolation,
  reviewFlaggedAttempt,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/auth.js';
import { bekAuth } from '../middleware/bekAuth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Teacher routes
router.post('/', authorize('teacher'), createExam);
router.get('/:examId/results', authorize('teacher'), getExamResults);
router.post('/review-flagged', authorize('teacher'), reviewFlaggedAttempt);

// Student routes - Protected with BEK (Browser Exam Key)
router.post('/start', authorize('student'), bekAuth, startExam);
router.post('/submit-answer', authorize('student'), bekAuth, submitAnswer);
router.post('/submit', authorize('student'), bekAuth, submitExam);
router.post('/violation', authorize('student'), bekAuth, recordViolation);

// Common routes (both teacher and student)
router.get('/', getExams);
router.get('/code/:code', getExamByCode);
router.get('/:examId/attempt', getAttempt);

export default router;
