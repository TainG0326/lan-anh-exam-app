import { Response } from 'express';
import { AssignmentDB } from '../database/Assignment.js';
import { SubmissionDB } from '../database/Submission.js';
import { AuthRequest } from '../middleware/auth.js';

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, courseId, classId, questions, dueDate } = req.body;

    const totalPoints = questions.reduce(
      (sum: number, q: any) => sum + (q.points || 1),
      0
    );

    const assignment = await AssignmentDB.create({
      title,
      description,
      course_id: courseId,
      class_id: classId,
      teacher_id: req.user!.id,
      questions,
      due_date: new Date(dueDate).toISOString(),
      total_points: totalPoints,
    });

    res.status(201).json({
      success: true,
      assignment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo bài tập.',
    });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.user!;
    let assignments;

    if (role === 'teacher') {
      assignments = await AssignmentDB.findByTeacherId(req.user!.id);
    } else {
      // Student without a class has no assignments to fetch
      if (!req.user!.class_id) {
        return res.json({
          success: true,
          assignments: [],
        });
      }
      assignments = await AssignmentDB.findByClassId(req.user!.class_id);
    }

    res.json({
      success: true,
      assignments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách bài tập.',
    });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId, answers } = req.body;

    const assignment = await AssignmentDB.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập.',
      });
    }

    let submission = await SubmissionDB.findByAssignmentAndStudent(assignmentId, req.user!.id);

    if (submission) {
      submission = await SubmissionDB.update(assignmentId, req.user!.id, answers);
    } else {
      submission = await SubmissionDB.create({
        assignmentId,
        studentId: req.user!.id,
        answers,
      });
    }

    res.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi nộp bài.',
    });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId, score, feedback } = req.body;

    await SubmissionDB.grade(submissionId, score, feedback);

    const submission = await SubmissionDB.findByAssignmentAndStudent('', ''); // Need to fix this

    res.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi chấm bài.',
    });
  }
};

export const getSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await AssignmentDB.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập.',
      });
    }

    if (assignment.teacher_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập.',
      });
    }

    const submissions = await SubmissionDB.findByAssignmentId(assignmentId);

    res.json({
      success: true,
      submissions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách bài nộp.',
    });
  }
};
