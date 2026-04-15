import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ExamDB, Exam } from '../database/Exam.js';
import { ExamAttemptDB } from '../database/ExamAttempt.js';
import { generateExamCode } from '../utils/generateExamCode.js';

// Get all exams
export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const { role, id, class_id } = req.user!;

    let exams;

    if (role === 'teacher') {
      // Teacher: get exams they created
      exams = await ExamDB.findByTeacherId(id);
    } else {
      // Student: get exams from their class
      if (!class_id) {
        return res.json({
          success: true,
          data: [],
        });
      }
      exams = await ExamDB.findByClassId(class_id);
    }

    res.json({
      success: true,
      data: exams,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get exams',
    });
  }
};

// Get exam by code
export const getExamByCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const exam = await ExamDB.findByCode(code);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    res.json({
      success: true,
      data: exam,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get exam',
    });
  }
};

// Create exam (teacher)
export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId || req.user?.role !== 'teacher') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Only teachers can create exams.',
      });
    }

    const { title, description, class_id, questions, start_time, end_time, duration, shuffle_questions, shuffle_options, require_webcam, auto_submit } = req.body;

    // Generate unique exam code
    let examCode = '';
    let isUnique = false;
    while (!isUnique) {
      examCode = generateExamCode();
      const existing = await ExamDB.findByCode(examCode);
      if (!existing) isUnique = true;
    }

    // Calculate total points
    const total_points = questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);

    const exam = await ExamDB.create({
      title,
      description,
      exam_code: examCode,
      class_id,
      teacher_id: teacherId,
      questions,
      start_time,
      end_time,
      duration,
      total_points,
      shuffle_questions,
      shuffle_options,
      require_webcam,
      auto_submit,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: exam,
      message: 'Exam created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create exam',
    });
  }
};

// Start exam (student)
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
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Check if exam is active
    if (exam.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Exam is not active',
      });
    }

    // Check if exam has started
    const now = new Date();
    const startTime = new Date(exam.start_time);
    if (now < startTime) {
      return res.status(400).json({
        success: false,
        message: 'Exam has not started yet',
        start_time: exam.start_time,
      });
    }

    // Check if exam has ended
    const endTime = new Date(exam.end_time);
    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: 'Exam has ended',
      });
    }

    // Check if student already has an attempt
    const existingAttempt = await ExamAttemptDB.findByExamAndStudent(examId, studentId);
    if (existingAttempt) {
      if (existingAttempt.submitted_at) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this exam',
        });
      }
      // Return existing attempt
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
        },
      });
    }

    // Create new attempt
    const attempt = await ExamAttemptDB.create({
      examId,
      studentId,
      startedAt: new Date().toISOString(),
    });

    // Return exam info (without correct answers)
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
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start exam',
    });
  }
};

// Submit answer (student)
export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || req.user?.role !== 'student') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const { attemptId, questionIndex, answer } = req.body;

    const attempt = await ExamAttemptDB.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found',
      });
    }

    if (attempt.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Not your attempt',
      });
    }

    if (attempt.submitted_at) {
      return res.status(400).json({
        success: false,
        message: 'Exam already submitted',
      });
    }

    // Get exam to validate question index
    const exam = await ExamDB.findById(attempt.exam_id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    if (questionIndex < 0 || questionIndex >= exam.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index',
      });
    }

    // Update answers
    const answers = { ...attempt.answers };
    answers[questionIndex] = answer;
    await ExamAttemptDB.updateAnswers(attemptId, answers);

    res.json({
      success: true,
      message: 'Answer saved',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit answer',
    });
  }
};

// Submit exam (student)
export const submitExam = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId || req.user?.role !== 'student') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const { attemptId } = req.body;

    const attempt = await ExamAttemptDB.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found',
      });
    }

    if (attempt.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Not your attempt',
      });
    }

    if (attempt.submitted_at) {
      return res.status(400).json({
        success: false,
        message: 'Exam already submitted',
      });
    }

    const exam = await ExamDB.findById(attempt.exam_id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Calculate score
    let score = 0;
    const results: any[] = [];

    for (let i = 0; i < exam.questions.length; i++) {
      const question = exam.questions[i];
      const studentAnswer = attempt.answers[i];
      let isCorrect = false;

      if (question.type === 'multiple-choice') {
        isCorrect = String(studentAnswer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
      } else if (question.type === 'fill-blank') {
        const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
        isCorrect = correctAnswers.some((ans: string) => 
          String(studentAnswer).toLowerCase().trim() === String(ans).toLowerCase().trim()
        );
      }

      if (isCorrect) {
        score += question.points;
      }

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

    // Submit attempt
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit exam',
    });
  }
};

// Get exam results (teacher)
export const getExamResults = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId || req.user?.role !== 'teacher') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const { examId } = req.params;

    const exam = await ExamDB.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    if (exam.teacher_id !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Not your exam',
      });
    }

    const attempts = await ExamAttemptDB.findByExamId(examId);

    res.json({
      success: true,
      data: {
        exam,
        attempts,
        statistics: {
          totalAttempts: attempts.length,
          submittedAttempts: attempts.filter(a => a.submitted_at).length,
          averageScore: attempts.filter(a => a.score !== undefined).length > 0
            ? attempts.filter(a => a.score !== undefined).reduce((sum, a) => sum + (a.score || 0), 0) / attempts.filter(a => a.score !== undefined).length
            : 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get exam results',
    });
  }
};

// Get attempt (student/teacher)
export const getAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId } = req.params;

    const attempt = await ExamAttemptDB.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found',
      });
    }

    const exam = await ExamDB.findById(attempt.exam_id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Students can only view their own attempts
    if (req.user?.role === 'student' && attempt.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not your attempt',
      });
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get attempt',
    });
  }
};

// Record violation (Flag & Review instead of Force Submit)
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
      return res.status(404).json({
        success: false,
        message: 'Exam attempt not found.',
      });
    }

    if (attempt.submitted_at) {
      return res.status(400).json({
        success: false,
        message: 'Exam already submitted.',
      });
    }

    // Add violation with timestamp
    await ExamAttemptDB.addViolation(attempt.id, {
      ...violation,
      timestamp: new Date().toISOString(),
    });

    // Get updated attempt to check if flagged
    const updatedAttempt = await ExamAttemptDB.findById(attempt.id);

    res.json({
      success: true,
      message: 'Violation recorded.',
      flagged: updatedAttempt?.flagged || false,
      flaggedReason: updatedAttempt?.flagged_reason || null,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record violation.',
    });
  }
};

// Review flagged attempt (Teacher only)
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
      return res.status(404).json({
        success: false,
        message: 'Attempt not found.',
      });
    }

    // Mark as reviewed
    await ExamAttemptDB.markAsReviewed(attempt.id);

    res.json({
      success: true,
      message: 'Attempt reviewed successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to review attempt.',
    });
  }
};
