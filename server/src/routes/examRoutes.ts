import express from 'express';
import {
  createExam,
  getExams,
  getExamByCode,
  updateExam,
  deleteExam,
  startExam,
  submitAnswer,
  submitExam,
  getExamResults,
  getAttempt,
  recordViolation,
  reviewFlaggedAttempt,
  verifyAccess,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/auth.js';
import { bekAuth } from '../middleware/bekAuth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── Teacher Routes ────────────────────────────────────────────────────────────
router.post('/', authorize('teacher'), createExam);
router.put('/:examId', authorize('teacher'), updateExam);
router.delete('/:examId', authorize('teacher'), deleteExam);
router.get('/:examId/results', authorize('teacher'), getExamResults);
router.post('/review-flagged', authorize('teacher'), reviewFlaggedAttempt);

// ─── Student Routes ────────────────────────────────────────────────────────────

// Public verification — just auth (student token), no BEK yet
router.post('/verify-access', authorize('student'), verifyAccess);

// All exam-taking routes require BEK (Browser Exam Key / Lockdown auth)
router.post('/start', authorize('student'), bekAuth, startExam);
router.post('/submit-answer', authorize('student'), bekAuth, submitAnswer);
router.post('/submit', authorize('student'), bekAuth, submitExam);
router.post('/violation', authorize('student'), bekAuth, recordViolation);

// ─── Common Routes ────────────────────────────────────────────────────────────
router.get('/', getExams);
router.get('/code/:code', getExamByCode);
router.get('/:examId/attempt', getAttempt);

export default router;
