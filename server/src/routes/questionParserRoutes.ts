import express from 'express';
import { parseFile, uploadMiddleware } from '../controllers/questionParserController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('teacher')); // Only teachers can parse questions

router.post('/parse', uploadMiddleware, parseFile);

export default router;






