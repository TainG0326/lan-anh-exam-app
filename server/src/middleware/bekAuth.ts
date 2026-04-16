import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const EXAM_SECRET_KEY = process.env.EXAM_SECRET_KEY || 'exam-lockdown-secret-key';

// Extended Request interface with exam auth
export interface BekRequest extends Request {
  examId?: string;
  bekHash?: string;
}

/**
 * Browser Exam Key (BEK) Middleware
 * Validates that requests come from Electron Lockdown Browser
 * Hash = SHA256(URL + SECRET_KEY + Exam_ID)
 *
 * BEK is REQUIRED for lockdown exams, OPTIONAL for regular exams.
 * The actual lockdown check happens inside the controller based on exam.is_lockdown_required.
 */
export const bekAuth = (req: BekRequest, res: Response, next: NextFunction) => {
  // Only check BEK for specific endpoints
  const bekRequiredRoutes = ['/api/exams/submit-answer', '/api/exams/violation'];
  const isBekRoute = bekRequiredRoutes.some(route => req.originalUrl?.startsWith(route));

  // For start and submit, BEK is optional (handled inside controller)
  if (!isBekRoute) {
    return next();
  }

  // Get exam ID
  const examId = req.body?.examId || req.params?.examId || req.query?.examId;

  if (!examId) {
    return res.status(400).json({
      success: false,
      message: 'Exam ID is required',
    });
  }

  // Get BEK hash from header
  const clientHash = req.headers['x-lockdown-hash'] as string;

  // If no hash, treat as regular browser (not lockdown)
  if (!clientHash) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: This exam requires Lockdown Browser. Please use the Exam Lockdown App.',
      code: 'BEK_REQUIRED',
    });
  }

  // Validate hash
  const url = req.originalUrl || (req as any).url;
  const hashInput = `${url}${EXAM_SECRET_KEY}${examId}`;
  const expectedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

  if (clientHash !== expectedHash) {
    console.warn('BEK validation failed:', {
      url,
      examId,
      clientHash: clientHash.substring(0, 10) + '...',
      expectedHash: expectedHash.substring(0, 10) + '...',
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied: Invalid Browser Exam Key. Please use the Exam Lockdown App.',
      code: 'BEK_INVALID',
    });
  }

  (req as any).examId = examId;
  (req as any).bekHash = clientHash;

  next();
};

/**
 * Optional: Generate BEK hash for testing
 */
export const generateBEKHash = (url: string, examId: string): string => {
  const hashInput = `${url}${EXAM_SECRET_KEY}${examId}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
};
