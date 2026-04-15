import { Request, Response } from 'express';
import { GradeService } from '../services/gradeService.js';

export const getGradesByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
      });
    }

    const grades = await GradeService.getGradesByClass(classId);

    res.json({
      success: true,
      data: grades,
    });
  } catch (error: any) {
    console.error('[Grade] Get grades error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get grades',
    });
  }
};

export const getClassStatistics = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: 'Class ID is required',
      });
    }

    const stats = await GradeService.getClassStatistics(classId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[Grade] Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get statistics',
    });
  }
};

export const updateExamScore = async (req: Request, res: Response) => {
  try {
    const { attemptId, score } = req.body;

    if (!attemptId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Attempt ID and score are required',
      });
    }

    const result = await GradeService.updateExamScore(attemptId, score);

    res.json({
      success: true,
      data: result,
      message: 'Exam score updated successfully',
    });
  } catch (error: any) {
    console.error('[Grade] Update exam score error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update exam score',
    });
  }
};

export const updateAssignmentScore = async (req: Request, res: Response) => {
  try {
    const { submissionId, score, feedback } = req.body;

    if (!submissionId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID and score are required',
      });
    }

    const result = await GradeService.updateAssignmentScore(submissionId, score, feedback || '');

    res.json({
      success: true,
      data: result,
      message: 'Assignment score updated successfully',
    });
  } catch (error: any) {
    console.error('[Grade] Update assignment score error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update assignment score',
    });
  }
};
