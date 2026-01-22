// ... existing code ...

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
      // Note: We don't force submit anymore - teacher will review
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
    const { attemptId, action } = req.body; // action: 'approve' | 'reject'

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

    // If action is 'reject', you can add additional logic here
    // (e.g., invalidate the attempt, require retake, etc.)

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
