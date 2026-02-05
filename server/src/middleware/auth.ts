import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserDB, User } from '../database/User.js';
import { generateToken } from '../utils/generateToken.js';

// Extended Request interface with user and file (for multer)
export interface AuthRequest extends Request {
  user?: User;
  file?: any;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Priority 1: Check HttpOnly Cookie (preferred for security)
    if ((req as any).cookies && (req as any).cookies.accessToken) {
      token = (req as any).cookies.accessToken;
    }
    // Priority 2: Check Authorization header (for backward compatibility)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No access permission. Please login.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as { id: string };

    const user = await UserDB.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User does not exist.',
      });
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword as User;
    next();
  } catch (error: any) {
    // If token expired, try refresh token
    if (error.name === 'TokenExpiredError' && (req as any).cookies?.refreshToken) {
      try {
        const refreshToken = (req as any).cookies.refreshToken;
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'secret'
        ) as { id: string };

        const user = await UserDB.findById(decoded.id);
        if (user) {
          // Generate new access token
          const newAccessToken = generateToken(user.id);
          
          // Set new access token cookie
          res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          const { password, ...userWithoutPassword } = user;
          req.user = userWithoutPassword as User;
          return next();
        }
      } catch (refreshError) {
        // Refresh token also invalid
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện hành động này.',
      });
    }

    next();
  };
};
