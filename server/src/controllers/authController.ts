import { Request, Response } from 'express';
import { UserDB } from '../database/User.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import { AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { avatarUploadMiddleware } from '../utils/avatarUpload.js';
import { uploadAvatarToSupabase, deleteAvatarFromSupabase, getAvatarUrl } from '../utils/supabaseStorage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
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
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict' as const,
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
