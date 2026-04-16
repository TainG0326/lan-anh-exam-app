import express from 'express';
import { verifyAccess } from '../controllers/examController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/exams/public/verify
 * Public endpoint - verifies access_key and returns basic exam info.
 * Does NOT require authentication (used by Desktop App for initial check).
 * Returns limited info: exam_id, title, duration, time window, flags.
 * Does NOT return questions (those require login + BEK).
 */
router.post('/verify', async (req, res) => {
  try {
    const { access_key } = req.body;

    if (!access_key || typeof access_key !== 'string' || access_key.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã truy cập.' });
    }

    // Inline the key parts of verifyAccess without the auth requirement
    const { ExamDB } = await import('../database/Exam.js');

    const exam = await ExamDB.findByAccessKey(access_key.trim());

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Mã truy cập không hợp lệ.' });
    }

    if (exam.status === 'draft') {
      return res.status(403).json({ success: false, message: 'Kỳ thi chưa được kích hoạt.' });
    }

    if (exam.status === 'closed') {
      return res.status(403).json({ success: false, message: 'Kỳ thi đã đóng.' });
    }

    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    if (now < start) {
      const diffMin = Math.ceil((start.getTime() - now.getTime()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Kỳ thi chưa bắt đầu. Vui lòng quay lại sau ${diffMin} phút.`,
      });
    }

    if (now > end) {
      return res.status(403).json({ success: false, message: 'Kỳ thi đã kết thúc.' });
    }

    res.json({
      success: true,
      data: {
        exam_id: exam.id,
        title: exam.title,
        description: exam.description,
        start_time: exam.start_time,
        end_time: exam.end_time,
        duration: exam.duration,
        is_lockdown_required: exam.is_lockdown_required || false,
        require_webcam: exam.require_webcam || false,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
});

export default router;
