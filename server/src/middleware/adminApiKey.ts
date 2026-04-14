import { Request, Response, NextFunction } from 'express';

/**
 * Admin API Key Authentication Middleware
 * Allows admin dashboard to call server API endpoints with API key.
 * Set ADMIN_API_KEY in server .env file.
 * Admin dashboard should send: X-Admin-Api-Key: <key>
 */
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

export const adminApiKeyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip if no admin API key is configured
  if (!ADMIN_API_KEY) {
    return res.status(500).json({
      success: false,
      message: 'Admin API key not configured on server. Please set ADMIN_API_KEY in .env',
    });
  }

  const apiKey = req.headers['x-admin-api-key'];

  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing admin API key.',
    });
  }

  // Mark request as admin-authenticated
  (req as any).isAdminApiKeyAuth = true;
  next();
};
