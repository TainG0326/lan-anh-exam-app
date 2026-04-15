import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ExamDB, Exam, ExamStatus } from '../database/Exam.js';
import { ExamAttemptDB } from '../database/ExamAttempt.js';
import { generateExamCode } from '../utils/generateExamCode.js';
import { generateAccessKey } from '../utils/generateAccessKey.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

function isWithinTimeWindow(startTime: string, endTime: string): { ok: boolean; message?: string } {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    const diffMs = start.getTime() - now.getTime();
    const diffMin = Math.ceil(diffMs / 60000);
    return {
      ok: false,
      message: `Kỳ thi chưa bắt đầu. Vui lòng quay lại sau ${diffMin} phút.`,
    };
  }

  if (now > end) {
    return {
      ok: false,
      message: 'Kỳ thi đã kết thúc.',
    };
  }

  return { ok: true };
}

function getRemainingSeconds(endTime: string): number {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

async function generateUniqueExamCode(): Promise<string> {
  let code = '';
  let isUnique = false;
  while (!isUnique) {
    code = generateExamCode();
    const existing = await ExamDB.findByCode(code);
    if (!existing) isUnique = true;
  }
  return code;
}

async function generateUniqueAccessKey(): Promise<string> {
  let key = '';
  let isUnique = false;
  while (!isUnique) {
    key = generateAccessKey();
    const existing = await ExamDB.findByAccessKey(key);
    if (!existing) isUnique = true;
  }
  return key;
}

// ─── Teacher Routes ───────────────────────────────────────────────────────────

// GET /api/exams — Get all exams (teacher sees all they created, student sees their class exams)
export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id, class_id } = req.user!;

    let exams;

    if (role === 'teacher') {
      exams = await ExamDB.findByTeacherId(id);
    } else {
      if (!class_id) {
        return res.json({ success: true, data: [] });
      }
      exams = await ExamDB.findByClassId(class_id);
    }

    const sanitized = exams.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      exam_code: e.exam_code,
      access_key: e.access_key,
      class_id: e.class_id,
      allowed_class_id: e.allowed_class_id,
      start_time: e.start_time,
      end_time: e.end_time,
      duration: e.duration,
      total_points: e.total_points,
      status: e.status,
      is_lockdown_required: e.is_lockdown_required,
      require_webcam: e.require_webcam,
      auto_submit: e.auto_submit,
      shuffle_questions: e.shuffle_questions,
      shuffle_options: e.shuffle_options,
      class: e.classes || e.class,
      created_at: e.created_at,
    }));

    res.json({ success: true, data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get exams' });
  }
};

// GET /api/exams/code/:code — Get exam by exam_code (public, no auth needed for listing)
export const getExamByCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const exam = await ExamDB.findByCode(code);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get exam' });
  }
};

// POST /api/exams — Create a new exam (teacher only)
export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId || req.user?.role !== 'teacher') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Only teachers can create exams.',
      });
    }

    const {
      title,
      description,
      class_id,
      allowed_class_id,
      questions,
      start_time,
      end_time,
      duration,
      shuffle_questions,
      shuffle_options,
      require_webcam,
      auto_submit,
      is_lockdown_required,
      access_key,
    } = req.body;

    if (!title || !class_id || !start_time || !end_time || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, class_id, start_time, end_time, duration',
      });
    }

    const examCode = await generateUniqueExamCode();
    const examAccessKey = access_key || await generateUniqueAccessKey();
    const total_points = (questions || []).reduce(
      (sum: number, q: any) => sum + (q.points || 0),
      0
    );

    const exam = await ExamDB.create({
      title,
      description,
      exam_code: examCode,
      access_key: examAccessKey,
      class_id,
      allowed_class_id: allowed_class_id || class_id,
      teacher_id: teacherId,
      questions: questions || [],
      start_time,
      end_time,
      duration,
      total_points,
      shuffle_questions: shuffle_questions || false,
      shuffle_options: shuffle_options || false,
      require_webcam: require_webcam || false,
      auto_submit: auto_submit !== false,
      is_lockdown_required: is_lockdown_required || false,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: exam,
      message: 'Exam created successfully. Add questions and activate when ready.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create exam' });
  }
};

// PUT /api/exams/:examId — Update exam (teacher only)
export const updateExam = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId || req.user?.role !== 'teacher') {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { examId } = req.params;
    const exam = await ExamDB.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not your exam' });
    }

    const updates = req.body;

    if (updates.status === 'active' && exam.status === 'draft') {
      if (!exam.questions || exam.questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot activate exam without questions.',
        });
      }
    }

    const updated = await ExamDB.update(examId, updates);

    res.json({ success: true, data: updated, message: 'Exam updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update exam' });
  }
};

// DELETE /api/exams/:examId — Delete exam (teacher only)
export const deleteExam = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId || req.user?.role !== 'teacher') {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { examId } = req.params;
    const exam = await ExamDB.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not your exam' });
    }

    if (exam.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active exam. Close it first.',
      });
    }

    await ExamDB.delete(examId);

    res.json({ success: true, message: 'Exam deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete exam' });
  }
};

// ─── Student Routes ────────────────────────────────────────────────────────────

// POST /api/exams/verify-access — Verify access_key + class enrollment + time window
export const verifyAccess = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || req.user?.role !== 'student') {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { access_key } = req.body;

    if (!access_key || typeof access_key !== 'string' || access_key.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã truy cập.' });
    }

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

    // Check if student is enrolled in the allowed class
    const isEnrolled = await ExamDB.isStudentEnrolledInClass(studentId, exam.allowed_class_id);
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tham gia kỳ thi này. Liên hệ giáo viên để được thêm vào lớp.',
      });
    }

    // Check time window
    const timeCheck = isWithinTimeWindow(exam.start_time, exam.end_time);
    if (!timeCheck.ok) {
      return res.status(403).json({ success: false, message: timeCheck.message });
    }

    // Check if student already has an attempt
    const existingAttempt = await ExamAttemptDB.findByExamAndStudent(exam.id, studentId);
    const alreadySubmitted = existingAttempt?.submitted_at != null;

    res.json({
      success: true,
      data: {
        exam_id: exam.id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        start_time: exam.start_time,
        end_time: exam.end_time,
        remaining_seconds: getRemainingSeconds(exam.end_time),
        is_lockdown_required: exam.is_lockdown_required,
        require_webcam: exam.require_webcam,
        already_submitted: alreadySubmitted,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
};

// POST /api/exams/start — Start an exam (student only, requires BEK)
export const startExam = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || req.user?.role !== 'student') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Only students can start exams.',
      });
    }

    const { examId } = req.body;

    const exam = await ExamDB.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Exam is not active' });
    }

    // Verify student is enrolled in allowed class
    const isEnrolled = await ExamDB.isStudentEnrolledInClass(studentId, exam.allowed_class_id);
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tham gia kỳ thi này.',
      });
    }

    // Time window check
    const timeCheck = isWithinTimeWindow(exam.start_time, exam.end_time);
    if (!timeCheck.ok) {
      return res.status(403).json({ success: false, message: timeCheck.message });
    }

    const existingAttempt = await ExamAttemptDB.findByExamAndStudent(examId, studentId);
    if (existingAttempt) {
      if (existingAttempt.submitted_at) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this exam',
        });
      }
      return res.json({
        success: true,
        data: {
          attemptId: existingAttempt.id,
          exam: {
            id: exam.id,
            title: exam.title,
            description: exam.description,
            duration: exam.duration,
            questions: exam.questions,
            shuffle_questions: exam.shuffle_questions,
            shuffle_options: exam.shuffle_options,
          },
          started_at: existingAttempt.started_at,
          remaining_seconds: getRemainingSeconds(exam.end_time),
        },
      });
    }

    const attempt = await ExamAttemptDB.create({
      examId,
      studentId,
      startedAt: new Date().toISOString(),
    });

    const examForStudent = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      questions: exam.questions.map((q: any) => ({
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
      })),
      shuffle_questions: exam.shuffle_questions,
      shuffle_options: exam.shuffle_options,
    };

    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        exam: examForStudent,
        started_at: attempt.started_at,
        remaining_seconds: getRemainingSeconds(exam.end_time),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to start exam' });
  }
};

// POST /api/exams/submit-answer — Save an answer (student, BEK required)
export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || req.user?.role !== 'student') {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { attemptId, questionIndex, answer } = req.body;

    const attempt = await ExamAttemptDB.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.student_id !== studentId) {
      return res.status(403).json({ success: false, message: 'Not your attempt' });
    }

    if (attempt.submitted_at) {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }

    const exam = await ExamDB.findById(attempt.exam_id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (questionIndex < 0 || questionIndex >= exam.questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    const answers = { ...attempt.answers };
    answers[questionIndex] = answer;
    await ExamAttemptDB.updateAnswers(attemptId, answers);

    res.json({ success: true, message: 'Answer saved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to submit answer' });
  }
};

// POST /api/exams/submit — Submit exam (student, BEK required)
export const submitExam = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || req.user?.role !== 'student') {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { attemptId } = req.body;

    const attempt = await ExamAttemptDB.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    if (attempt.student_id !== studentId) {
      return res.status(403).json({ success: false, message: 'Not your attempt' });
    }

    if (attempt.submitted_at) {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }

    const exam = await ExamDB.findById(attempt.exam_id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    let score = 0;
    const results: any[] = [];

    for (let i = 0; i < exam.questions.length; i++) {
      const question = exam.questions[i];
      const studentAnswer = attempt.answers[i];
      let isCorrect = false;

      if (question.type === 'multiple-choice') {
        isCorrect =
          String(studentAnswer).toLowerCase().trim() ===
          String(question.correctAnswer).toLowerCase().trim();
      } else if (question.type === 'fill-blank') {
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];
        isCorrect = correctAnswers.some(
          (ans: string) =>
            String(studentAnswer).toLowerCase().trim() === String(ans).toLowerCase().trim()
        );
      }

      if (isCorrect) score += question.points;

      results.push({
        questionIndex: i,
        question: question.question,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: question.points,
        earnedPoints: isCorrect ? question.points : 0,
        explanation: question.explanation,
      });
    }

    await ExamAttemptDB.submit(attemptId, new Date().toISOString(), score);

    res.json({
      success: true,
      data: {
        score,
        totalPoints: exam.total_points,
        results,
      },
      message: 'Exam submitted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to submit exam' });
  }
};

// GET /api/exams/:examId/results — Get exam results (teacher only)
export const getExamResults = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId || req.user?.role !== 'teacher') {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { examId } = req.params;
    const exam = await ExamDB.findById(examId);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (exam.teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not your exam' });
    }

    const attempts = await ExamAttemptDB.findByExamId(examId);

    const submittedAttempts = attempts.filter((a) => a.submitted_at);
    const scoredAttempts = submittedAttempts.filter((a) => a.score !== undefined && a.score !== null);
    const averageScore =
      scoredAttempts.length > 0
        ? scoredAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / scoredAttempts.length
        : 0;

    res.json({
      success: true,
      data: {
        exam,
        attempts,
        statistics: {
          totalAttempts: attempts.length,
          submittedAttempts: submittedAttempts.length,
          averageScore: Math.round(averageScore * 100) / 100,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get exam results' });
  }
};

// GET /api/exams/:examId/attempt — Get attempt details (student/teacher)
export const getAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;

    const attempt = await ExamAttemptDB.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    const exam = await ExamDB.findById(attempt.exam_id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user?.role === 'student' && attempt.student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your attempt' });
    }

    res.json({
      success: true,
      data: {
        attempt,
        exam: {
          id: exam.id,
          title: exam.title,
          questions: exam.questions,
          total_points: exam.total_points,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get attempt' });
  }
};

// POST /api/exams/violation — Record a proctoring violation (student, BEK required)
export const recordViolation = async (req: AuthRequest, res: Response) => {
  try {
    const { examId, violation } = req.body;

    if (!examId || !violation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide exam ID and violation details.',
      });
    }

    const attempt = await ExamAttemptDB.findByExamAndStudent(examId, req.user!.id);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Exam attempt not found.' });
    }

    if (attempt.submitted_at) {
      return res.status(400).json({ success: false, message: 'Exam already submitted.' });
    }

    await ExamAttemptDB.addViolation(attempt.id, {
      ...violation,
      timestamp: new Date().toISOString(),
    });

    const updatedAttempt = await ExamAttemptDB.findById(attempt.id);

    res.json({
      success: true,
      message: 'Violation recorded.',
      flagged: updatedAttempt?.flagged || false,
      flaggedReason: updatedAttempt?.flagged_reason || null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to record violation.' });
  }
};

// POST /api/exams/review-flagged — Mark flagged attempt as reviewed (teacher only)
export const reviewFlaggedAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId, action } = req.body;

    if (!attemptId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attempt ID and action.',
      });
    }

    const attempt = await ExamAttemptDB.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    await ExamAttemptDB.markAsReviewed(attempt.id);

    res.json({ success: true, message: 'Attempt reviewed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to review attempt.' });
  }
};
