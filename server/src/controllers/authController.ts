import { Request, Response } from 'express';
import { UserDB } from '../database/User.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import { AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { avatarUploadMiddleware } from '../utils/avatarUpload.js';
import { uploadAvatarToSupabase, deleteAvatarFromSupabase } from '../utils/supabaseStorage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, studentId, classId } = req.body;

    const existingUser = await UserDB.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use.',
      });
    }

    const user = await UserDB.create({
      email,
      password,
      name,
      role,
      studentId: role === 'student' ? studentId : undefined,
      classId: role === 'student' ? classId : undefined,
    });

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Set HttpOnly cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'none' : 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      token: accessToken, // For backward compatibility
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed.',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserDB.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isPasswordValid = await UserDB.comparePassword(user.password!, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Set HttpOnly cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'none' : 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Also return token in response for backward compatibility (Electron can use it)
    res.json({
      success: true,
      token: accessToken, // For backward compatibility
      refreshToken, // For manual refresh if needed
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        classId: user.class_id,
        avatarUrl: user.avatar_url || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed.',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserDB.findById(req.user?.id || '');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        classId: user.class_id,
        studentId: (user as any).student_id,
        avatarUrl: user.avatar_url || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user information.',
    });
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
      });
    }

    const user = await UserDB.findById(userId);
    if (!user) {
      // Delete uploaded file if user not found
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Delete old avatar from Supabase if exists
    if (user.avatar_url) {
      await deleteAvatarFromSupabase(user.avatar_url);
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(req.file.path);
    const mimeType = req.file.mimetype;

    // Upload to Supabase Storage
    const avatarUrl = await uploadAvatarToSupabase(
      userId,
      fileBuffer,
      req.file.filename,
      mimeType
    );

    // Delete local file after upload
    await fs.unlink(req.file.path).catch(() => {});

    // Update user with new avatar URL
    const updatedUser = await UserDB.update(userId, { avatar_url: avatarUrl });

    res.json({
      success: true,
      avatarUrl: updatedUser.avatar_url,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        classId: updatedUser.class_id,
        studentId: (updatedUser as any).student_id,
        avatarUrl: updatedUser.avatar_url || null,
      },
    });
  } catch (error: any) {
    // Delete uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload avatar.',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, currentPassword, avatar_url } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const user = await UserDB.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // If changing password, verify current password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password.',
        });
      }

      const isPasswordValid = await UserDB.comparePassword(user.password!, currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
    }

    // Check if email is already in use by another user
    if (email && email !== user.email) {
      const existingUser = await UserDB.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use.',
        });
      }
    }

    // Update user
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    if (avatar_url !== undefined) {
      // If removing avatar, delete from Supabase Storage
      if (avatar_url === null && user.avatar_url) {
        await deleteAvatarFromSupabase(user.avatar_url);
      }
      updateData.avatar_url = avatar_url;
    }

    const updatedUser = await UserDB.update(userId, updateData);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        classId: updatedUser.class_id,
        studentId: (updatedUser as any).student_id,
        avatarUrl: updatedUser.avatar_url || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile.',
    });
  }
};

// Store OTPs temporarily (in production, use Redis or database)
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

// Generate random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email using Resend
const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'English Exam <onboarding@resend.dev>',
      to: email,
      subject: 'Mã xác nhận đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5F8D78;">English Exam System</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Dưới đây là mã xác nhận của bạn:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>Mã này có hiệu lực trong <strong>5 phút</strong>.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">English Exam System - Hệ thống học tập và thi online</p>
        </div>
      `,
    });

    console.log(`[OTP] Email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[OTP] Failed to send email:', error);
    return false;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await UserDB.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account exists with this email, an OTP will be sent.',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(email, { otp, expiresAt });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: 'If an account exists with this email, an OTP will be sent.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process forgot password request.',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    // Check OTP
    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired.',
      });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.',
      });
    }

    // Verify user exists
    const user = await UserDB.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await UserDB.update(user.id, { password: hashedPassword });

    // Clear OTP
    otpStore.delete(email);

    res.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password.',
    });
  }
};
