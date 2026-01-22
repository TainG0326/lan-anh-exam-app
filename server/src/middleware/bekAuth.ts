import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const EXAM_SECRET_KEY = process.env.EXAM_SECRET_KEY || 'your-secret-key-change-in-production';

export interface BekRequest extends Request {
  examId?: string;
  bekHash?: string;
}

/**
 * Browser Exam Key (BEK) Middleware
 * Validates that requests come from Electron Lockdown Browser
 * Hash = SHA256(URL + SECRET_KEY + Exam_ID)
 */
export const bekAuth = (req: BekRequest, res: Response, next: NextFunction) => {
  // Skip BEK validation for non-exam routes
  const examRoutes = ['/api/exams/start', '/api/exams/submit-answer', '/api/exams/submit', '/api/exams/violation'];
  const isExamRoute = examRoutes.some(route => req.path.startsWith(route));
  
  if (!isExamRoute) {
    return next();
  }

  // Get exam ID from request body or params
  const examId = req.body?.examId || req.params?.examId || req.query?.examId;
  
  if (!examId) {
    return res.status(400).json({
      success: false,
      message: 'Exam ID is required',
    });
  }

  // Get BEK hash from header
  const clientHash = req.headers['x-lockdown-hash'] as string;
  const clientType = req.headers['x-lockdown-client'] as string;

  // If no hash provided, check if it's a regular browser
  if (!clientHash) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: This exam requires Lockdown Browser. Please use the Exam Lockdown App.',
      code: 'BEK_REQUIRED',
    });
  }

  // Generate expected hash
  const url = req.originalUrl || req.url;
  const hashInput = `${url}${EXAM_SECRET_KEY}${examId}`;
  const expectedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

  // Compare hashes
  if (clientHash !== expectedHash) {
    console.warn('BEK validation failed:', {
      url,
      examId,
      clientHash: clientHash.substring(0, 10) + '...',
      expectedHash: expectedHash.substring(0, 10) + '...',
      clientType,
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied: Invalid Browser Exam Key. Please use the Exam Lockdown App.',
      code: 'BEK_INVALID',
    });
  }

  // Store exam ID and hash in request for later use
  req.examId = examId;
  req.bekHash = clientHash;

  next();
};

/**
 * Optional: Generate BEK hash for testing
 */
export const generateBEKHash = (url: string, examId: string): string => {
  const hashInput = `${url}${EXAM_SECRET_KEY}${examId}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
};



