import { Request, Response } from 'express';
import { UserDB } from '../database/User.js';
import { WhitelistDB, TeacherWhitelistDB, StudentWhitelistDB } from '../database/Whitelist.js';
import { TrustedDeviceDB } from '../database/TrustedDevice.js';
import { OTPService } from '../services/otpService.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import { AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { avatarUploadMiddleware } from '../utils/avatarUpload.js';
import { uploadAvatarToSupabase, deleteAvatarFromSupabase } from '../utils/supabaseStorage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// TRUSTED DEVICE HELPERS
// ============================================================
const TRUSTED_DEVICE_KEY = 'td_token';
const TRUSTED_DEVICE_DAYS = 30;

const getTrustedDeviceTokenFromHeader = (req: Request): string | undefined => {
  return req.headers['x-device-token'] as string | undefined;
};

const getTrustedDeviceToken = (req: Request): string | undefined => {
  // Ưu tiên đọc từ header (cross-origin reliable)
  const headerToken = getTrustedDeviceTokenFromHeader(req);
  if (headerToken) {
    console.log(`[getTrustedDeviceToken] Found in header: ${headerToken.substring(0, 8)}...`);
    return headerToken;
  }
  // Fallback: đọc từ cookie
  const cookieToken = req.cookies?.[TRUSTED_DEVICE_KEY];
  if (cookieToken) {
    console.log(`[getTrustedDeviceToken] Found in cookie: ${cookieToken.substring(0, 8)}...`);
  } else {
    console.log(`[getTrustedDeviceToken] No token found in header or cookie. Header keys: ${Object.keys(req.headers).join(', ')}`);
  }
  return cookieToken;
};

const generateDeviceToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Returns the raw token to be stored client-side (localStorage)
const successfulLoginWithDevice = async (
  res: Response,
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> => {
  const rawToken = generateDeviceToken();
  await TrustedDeviceDB.create({
    userId,
    rawToken,
    userAgent,
    ipAddress,
    daysValid: TRUSTED_DEVICE_DAYS,
  });

  // Set HttpOnly cookie for cross-origin trusted device bypass
  const isProduction = process.env.NODE_ENV === 'production';
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TRUSTED_DEVICE_DAYS);
  res.cookie(TRUSTED_DEVICE_KEY, rawToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: expiresAt,
    path: '/',
  });

  return rawToken; // Return token for client to store
};

const revokeAllTrustedDevices = async (res: Response, userId: string) => {
  await TrustedDeviceDB.revokeAll(userId);
};

const clearTrustedDeviceCookie = (res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(TRUSTED_DEVICE_KEY, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : ('lax' as const),
  });
};

// ============================================================
// WHITELIST CHECK HELPERS
// ============================================================
const checkTeacherWhitelist = async (email: string): Promise<{ allowed: boolean; message?: string }> => {
  const whitelistEnabled = process.env.WHITELIST_ENABLED !== 'false';

  if (!whitelistEnabled) {
    return { allowed: true };
  }

  const isWhitelisted = await TeacherWhitelistDB.isEmailWhitelisted(email);
  if (!isWhitelisted) {
    console.log(`[TEACHER_WHITELIST] Email "${email}" not in whitelist`);
    return {
      allowed: false,
      message: 'Email giáo viên không được phép đăng nhập. Vui lòng liên hệ quản trị viên để được cấp quyền.',
    };
  }

  return { allowed: true };
};

const checkStudentWhitelist = async (email: string): Promise<{ allowed: boolean; message?: string }> => {
  const whitelistEnabled = process.env.STUDENT_WHITELIST_ENABLED !== 'false';

  if (!whitelistEnabled) {
    return { allowed: true }; // Students can register freely if whitelist is disabled
  }

  const isWhitelisted = await StudentWhitelistDB.isEmailWhitelisted(email);
  if (!isWhitelisted) {
    console.log(`[STUDENT_WHITELIST] Email "${email}" not in whitelist`);
    return {
      allowed: false,
      message: 'Email học sinh không được phép đăng nhập. Vui lòng liên hệ quản trị viên để được cấp quyền.',
    };
  }

  return { allowed: true };
};

// Backward compatible function
const checkWhitelist = async (email: string, role: string): Promise<{ allowed: boolean; message?: string }> => {
  if (role === 'student') {
    return checkStudentWhitelist(email);
  }
  return checkTeacherWhitelist(email);
};

// ============================================================
// SEND OTP EMAIL
// ============================================================
const sendOTPEmail = async (email: string, otp: string, purpose: 'login' | 'reset'): Promise<boolean> => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      console.error('[OTP] RESEND_API_KEY is not set!');
      return false;
    }

    const subject = purpose === 'login'
      ? 'Mã xác nhận đăng nhập - Lan Anh English'
      : 'Mã xác nhận đặt lại mật khẩu';

    await resend.emails.send({
      from: 'English Exam <onboarding@resend.dev>',
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5F8D78;">Lan Anh English</h2>
          <p>Xin chào,</p>
          <p>Bạn ${purpose === 'login' ? 'đang đăng nhập' : 'yêu cầu đặt lại mật khẩu'}.
             Dưới đây là mã xác nhận của bạn:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>Mã này có hiệu lực trong <strong>5 phút</strong>.</p>
          <p>Nếu bạn không ${purpose === 'login' ? 'đăng nhập' : 'yêu cầu đặt lại mật khẩu'}, vui lòng bỏ qua email này.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">English Exam System - Hệ thống học tập và thi online</p>
        </div>
      `,
    });

    console.log('[OTP] Email sent successfully');
    return true;
  } catch (error: any) {
    console.error('[OTP] Failed to send email:', error);
    return false;
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, studentId, classId } = req.body;

    // Check whitelist for each role
    if (role === 'teacher') {
      const whitelistCheck = await checkTeacherWhitelist(email);
      if (!whitelistCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: whitelistCheck.message,
        });
      }
    } else if (role === 'student') {
      const whitelistCheck = await checkStudentWhitelist(email);
      if (!whitelistCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: whitelistCheck.message,
        });
      }
    }

    const existingUser = await UserDB.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use.',
      });
    }

    const user = await UserDB.create({
      email: email.toLowerCase(),
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
      secure: isProduction,
      sameSite: isProduction ? 'none' : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    } as const;

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
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
    const { email, password, otp } = req.body;

    const user = await UserDB.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // ===== WHITELIST CHECK: Required for ALL users (teacher and student) =====
    // Both Google login and normal login must check whitelist
    const whitelistCheck = user.role === 'student' 
      ? await checkStudentWhitelist(email)
      : await checkTeacherWhitelist(email);
    
    if (!whitelistCheck.allowed) {
      console.log(`[LOGIN] Whitelist rejected: ${email} (role: ${user.role})`);
      return res.status(403).json({
        success: false,
        message: whitelistCheck.message || 'Email không được phép đăng nhập. Vui lòng liên hệ quản trị viên.',
      });
    }
    // ===== END WHITELIST CHECK =====

    const isPasswordValid = await UserDB.comparePassword(user.password!, password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if 2FA is enabled for this user
    if (user.two_factor_enabled && user.two_factor_verified) {
      // Trusted device check: bypass 2FA if valid token exists
      const deviceToken = getTrustedDeviceToken(req);
      console.log(`[LOGIN] 2FA user: ${user.email}, deviceToken present: ${!!deviceToken}`);
      if (deviceToken) {
        const trustedDevice = await TrustedDeviceDB.findValidDevice(user.id, deviceToken);
        console.log(`[LOGIN] findValidDevice result: ${trustedDevice ? 'FOUND (bypass 2FA)' : 'NOT FOUND (require 2FA)'}`);
        if (trustedDevice) {
          await TrustedDeviceDB.updateLastUsed(trustedDevice.id);
          // Bypass 2FA - trusted device
          const accessToken = generateToken(user.id);
          const refreshToken = generateRefreshToken(user.id);

          const isProduction = process.env.NODE_ENV === 'production';
          const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : ('lax' as const),
            maxAge: 7 * 24 * 60 * 60 * 1000,
          } as const;

          res.cookie('accessToken', accessToken, cookieOptions);
          res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });

          return res.json({
            success: true,
            token: accessToken,
            refreshToken,
            trustedDevice: true,
            deviceToken: deviceToken, // Return the existing token for frontend reference
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              classId: user.class_id,
              avatarUrl: user.avatar_url || null,
              phone: user.phone || null,
              dateOfBirth: user.date_of_birth || null,
              two_factor_enabled: true,
            },
          });
        }
      }

      // No valid trusted device - require TOTP
      if (!otp) {
        return res.json({
          success: false,
          requires2FA: true,
          message: 'Vui lòng nhập mã xác thực từ ứng dụng authenticator (Google Authenticator, Authy...).',
          tempToken: generateToken(user.id, '5m'),
        });
      }

      // Second step: verify TOTP
      const totpResult = await verify({ token: otp, secret: user.two_factor_secret || '' });
      if (!totpResult.valid) {
        return res.status(401).json({
          success: false,
          requires2FA: true,
          message: 'Mã xác thực không đúng. Vui lòng kiểm tra lại ứng dụng TOTP.',
        });
      }
    }

    // Check if first login (2FA not set up yet but enabled for all)
    if (user.role === 'teacher' && process.env.REQUIRE_2FA === 'true' && !user.two_factor_enabled) {
      // Generate TOTP secret for first-time setup
      const secret = generateSecret();
      const otpauthUrl = generateURI({ secret, label: user.email, issuer: 'Lan Anh English' });

      // Generate QR code
      let qrCodeUrl = '';
      try {
        qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }

      // Store temp secret in DB (pending activation until verified)
      await UserDB.update(user.id, { two_factor_secret: secret });

      // Include isSetup flag in tempToken so verifyLoginOTP knows to enable 2FA
      const tempTokenPayload = { id: user.id, isSetup: true };
      const tempToken = jwt.sign(tempTokenPayload, process.env.JWT_SECRET || 'secret', { expiresIn: '10m' });

      return res.json({
        success: false,
        requires2FA: true,
        requiresSetup: true,
        message: 'Vui lòng quét mã QR bằng ứng dụng authenticator để hoàn tất đăng nhập lần đầu.',
        tempToken,
        twoFactorSecret: secret,
        twoFactorQrCode: qrCodeUrl,
      });
    }

    // Generate tokens for successful login
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Set HttpOnly cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    } as const;

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
        two_factor_enabled: user.two_factor_enabled || false,
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
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
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

    // Re-fetch to ensure we have the latest data from DB
    const freshUser = await UserDB.findById(userId);

    // Fallback: if re-fetch fails, use the updated user from the update response
    const userToReturn = freshUser || updatedUser;

    // Debug: Log what was returned after upload
    console.log(`[uploadAvatar] User ${userId} after avatar update:`, {
      avatar_url: userToReturn.avatar_url,
      phone: userToReturn.phone,
      date_of_birth: userToReturn.date_of_birth,
    });

    res.json({
      success: true,
      avatarUrl: userToReturn.avatar_url || null,
      user: {
        id: userToReturn.id,
        email: userToReturn.email,
        name: userToReturn.name,
        role: userToReturn.role,
        classId: userToReturn.class_id,
        studentId: (userToReturn as any).student_id,
        avatarUrl: userToReturn.avatar_url || null,
        phone: userToReturn.phone || null,
        dateOfBirth: userToReturn.date_of_birth || null,
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
    const { name, email, password, currentPassword, avatar_url, phone, date_of_birth } = req.body;
    const userId = req.user?.id;

    console.log(`[updateProfile] Request body:`, JSON.stringify({ name, email, avatar_url: !!avatar_url, phone: !!phone, date_of_birth: !!date_of_birth }));
    console.log(`[updateProfile] userId from token:`, userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    let user: any;
    try {
      user = await UserDB.findById(userId);
    } catch (findErr: any) {
      console.error(`[updateProfile] UserDB.findById(userId) FAILED:`, findErr.message);
      return res.status(500).json({ success: false, message: 'Database error: ' + findErr.message });
    }
    console.log(`[updateProfile] User from DB:`, user ? { id: user.id, email: user.email } : 'NOT FOUND');
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

      try {
        const isPasswordValid = await UserDB.comparePassword(user.password || '', currentPassword);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Current password is incorrect.',
          });
        }
      } catch (pwdErr: any) {
        console.error(`[updateProfile] comparePassword FAILED:`, pwdErr.message);
        return res.status(500).json({ success: false, message: 'Password check error: ' + pwdErr.message });
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
    if (phone !== undefined) {
      // Ensure phone is a string, not boolean, and truncate to 20 chars
      const phoneStr = String(phone || '').trim();
      updateData.phone = phoneStr || null;
    }
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;

    console.log(`[updateProfile] updateData:`, JSON.stringify(updateData));
    console.log(`[updateProfile] updateData fields:`, Object.keys(updateData));
    console.log(`[updateProfile] phone value:`, JSON.stringify(phone), 'type:', typeof phone);

    let updatedUser: any;
    try {
      updatedUser = await UserDB.update(userId, updateData);
      console.log(`[updateProfile] UserDB.update result:`, { id: updatedUser.id, avatar_url: updatedUser.avatar_url, phone: updatedUser.phone });
    } catch (updateError: any) {
      console.error(`[updateProfile] UserDB.update FAILED:`, updateError.message);
      throw updateError;
    }

    // Re-fetch from DB to ensure fresh data is returned
    let freshUser: any;
    try {
      freshUser = await UserDB.findById(userId);
      console.log(`[updateProfile] UserDB.findById result:`, { id: freshUser?.id, avatar_url: freshUser?.avatar_url, phone: freshUser?.phone });
    } catch (findError: any) {
      console.error(`[updateProfile] UserDB.findById FAILED:`, findError.message);
      // If re-fetch fails, use the update result
      freshUser = null;
    }

    // Fallback: if re-fetch fails, use the updated user from the update response
    const userToReturn = freshUser || updatedUser;

    res.json({
      success: true,
      user: {
        id: userToReturn.id,
        email: userToReturn.email,
        name: userToReturn.name,
        role: userToReturn.role,
        classId: userToReturn.class_id,
        studentId: (userToReturn as any).student_id,
        avatarUrl: userToReturn.avatar_url || null,
        phone: userToReturn.phone || null,
        dateOfBirth: userToReturn.date_of_birth || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile.',
    });
  }
};

// ============================================================
// FORGOT PASSWORD (using new OTPService)
// ============================================================
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

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, an OTP will be sent.',
      });
    }

    // Create OTP for password reset
    const otp = await OTPService.createResetOTP(user.id, email);

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, 'reset');

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check if email service is configured.',
      });
    }

    res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn!',
    });
  } catch (error: any) {
    console.error('[OTP] Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process forgot password request.',
    });
  }
};

// ============================================================
// RESET PASSWORD (verify OTP)
// ============================================================
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    // Verify OTP
    const otpResult = await OTPService.verifyOTP(email, otp, 'reset');
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.error,
      });
    }

    // Find user and update password
    const user = await UserDB.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await UserDB.update(user.id, { password: hashedPassword });

    // Clear OTP
    OTPService.clearOTP(email);

    res.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error: any) {
    console.error('[OTP] Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password.',
    });
  }
};

// ============================================================
// VERIFY LOGIN TOTP (2FA verification step)
// ============================================================
export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, tempToken, rememberDevice } = req.body;

    if (!email || !otp || !tempToken) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and tempToken are required.',
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        requires2FA: true,
        message: 'OTP must be exactly 6 digits.',
      });
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    // Get user
    const user = await UserDB.findById((decoded as any).id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    // TOTP secret must exist
    if (!user.two_factor_secret) {
      console.error('[2FA] verifyLoginOTP: no two_factor_secret for user', user.id);
      return res.status(400).json({
        success: false,
        requires2FA: true,
        message: '2FA is not configured. Please login again to set it up.',
      });
    }

    // Verify TOTP — must pass this gate before any success response
    try {
      const result = await verify({ token: otp, secret: user.two_factor_secret });
      if (!result.valid) {
        return res.status(401).json({
          success: false,
          requires2FA: true,
          message: 'Invalid code. Please check your authenticator app.',
        });
      }
    } catch (verifyErr: any) {
      console.error('[2FA] TOTP verify threw:', verifyErr.message);
      return res.status(401).json({
        success: false,
        requires2FA: true,
        message: 'Verification error. Please try again.',
      });
    }

    // TOTP verified — check if first-time setup, enable 2FA
    const isSetupFlow = (decoded as any).isSetup || false;
    if (isSetupFlow && user.role === 'teacher') {
      await UserDB.update(user.id, {
        two_factor_enabled: true,
        two_factor_verified: true,
      });
      user.two_factor_enabled = true;
      user.two_factor_verified = true;
    }

    // Generate full tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Set HttpOnly cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    } as const;

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Set trusted device cookie if user checked "Remember this device"
    let deviceToken: string | null = null;
    const trustedDevice = !!rememberDevice;
    if (trustedDevice) {
      const ipAddress = req.ip || req.socket?.remoteAddress || undefined;
      deviceToken = await successfulLoginWithDevice(res, user.id, req.headers['user-agent'], ipAddress);
    }

    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      trustedDevice,
      deviceToken, // Return token for frontend to store in localStorage
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        classId: user.class_id,
        avatarUrl: user.avatar_url || null,
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
        two_factor_enabled: user.two_factor_enabled || false,
      },
    });
  } catch (error: any) {
    console.error('[2FA] Verify login TOTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed.',
    });
  }
};

// ============================================================
// REQUEST 2FA CODE (re-send OTP for login)
// Note: Called during 2FA flow - accepts either full auth token or tempToken
// ============================================================
export const request2FA = async (req: Request, res: Response) => {
  try {
    let userId: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwtLib = await import('jsonwebtoken');
        const decoded = jwtLib.default.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
        userId = decoded.id;
      } catch {
        // Try as tempToken
        try {
          const jwtLib = await import('jsonwebtoken');
          const decoded = jwtLib.default.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
          userId = decoded.id;
        } catch {
          // Not valid
        }
      }
    }

    if (!userId && req.body.email) {
      const user = await UserDB.findByEmail(req.body.email);
      userId = user?.id || null;
    }

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

    const otp = await OTPService.createLoginOTP(user.id, user.email);
    const emailSent = await sendOTPEmail(user.email, otp, 'login');

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email.',
      });
    }

    res.json({
      success: true,
      message: 'Ma xac thuc da duoc gui den email cua ban.',
    });
  } catch (error: any) {
    console.error('[2FA] Request 2FA error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request 2FA.',
    });
  }
};

// ============================================================
// GOOGLE LOGIN (OAuth via Supabase on teacher-web)
// ============================================================
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, avatarUrl, role: requestedRole, rememberDevice = false } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    // Use requested role, default to teacher for backward compatibility
    const role = requestedRole || 'teacher';

    // Check whitelist based on role
    if (role === 'teacher') {
      const whitelistCheck = await checkTeacherWhitelist(email);
      if (!whitelistCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: whitelistCheck.message,
        });
      }
    } else if (role === 'student') {
      const whitelistCheck = await checkStudentWhitelist(email);
      if (!whitelistCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: whitelistCheck.message,
        });
      }
    }

    let user = await UserDB.findByEmail(email);

    if (!user) {
      // Create new user with the requested role (teacher or student)
      user = await UserDB.create({
        email,
        name: name || (role === 'student' ? 'Student' : 'Teacher'),
        role: role,
        avatar_url: avatarUrl || undefined,
      });
    } else if (avatarUrl && !user.avatar_url) {
      // Only set Google avatar if user has no existing avatar
      user = await UserDB.update(user.id, { avatar_url: avatarUrl });
    }

    // ===== 2FA CHECK: Google OAuth must respect 2FA requirement =====
    // Only teachers require 2FA (as per REQUIRE_2FA env)
    // Students can login without 2FA
    console.log(`[googleLogin] REQUIRE_2FA env: "${process.env.REQUIRE_2FA}", user.role: ${user.role}, two_factor_enabled: ${user.two_factor_enabled}, two_factor_verified: ${user.two_factor_verified}`);
    
    if (user.role === 'teacher' && process.env.REQUIRE_2FA === 'true') {
      // Teacher with 2FA requirement - check trusted device
      if (user.two_factor_enabled && user.two_factor_verified) {
        const deviceToken = getTrustedDeviceToken(req);
        console.log(`[googleLogin] 2FA user: ${user.email}, deviceToken present: ${!!deviceToken}`);
        if (deviceToken) {
          const trustedDevice = await TrustedDeviceDB.findValidDevice(user.id, deviceToken);
          console.log(`[googleLogin] findValidDevice result: ${trustedDevice ? 'FOUND (bypass 2FA)' : 'NOT FOUND (require 2FA)'}`);
          if (trustedDevice) {
            await TrustedDeviceDB.updateLastUsed(trustedDevice.id);
            const accessToken = generateToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            const isProduction = process.env.NODE_ENV === 'production';
            const cookieOptions = {
              httpOnly: true,
              secure: isProduction,
              sameSite: isProduction ? 'none' : ('lax' as const),
              maxAge: 7 * 24 * 60 * 60 * 1000,
            } as const;

            res.cookie('accessToken', accessToken, cookieOptions);
            res.cookie('refreshToken', refreshToken, {
              ...cookieOptions,
              maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            return res.json({
              success: true,
              token: accessToken,
              refreshToken,
              trustedDevice: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                classId: user.class_id,
                avatarUrl: user.avatar_url || null,
                two_factor_enabled: true,
              },
            });
          }
        }

        // No trusted device - require TOTP for teacher
        return res.json({
          success: false,
          requires2FA: true,
          skipSetup: true,
          message: 'Tài khoản của bạn đã bật xác thực 2FA. Vui lòng nhập mã từ ứng dụng TOTP.',
          tempToken: generateToken(user.id, '5m'),
        });
      }

      if (!user.two_factor_enabled) {
        // First-time Google login - setup TOTP required for teacher
        const secret = generateSecret();
        const otpauthUrl = generateURI({ secret, label: user.email, issuer: 'Lan Anh English' });

        let qrCodeUrl = '';
        try {
          qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
        } catch (err) {
          console.error('Failed to generate QR code:', err);
        }

        await UserDB.update(user.id, { two_factor_secret: secret });

        return res.json({
          success: false,
          requires2FA: true,
          requiresSetup: true,
          message: 'Vui lòng quét mã QR bằng ứng dụng authenticator để hoàn tất đăng nhập lần đầu.',
          tempToken: jwt.sign({ id: user.id, isSetup: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '10m' }),
          twoFactorSecret: secret,
          twoFactorQrCode: qrCodeUrl,
        });
      }
    } else if (user.role === 'teacher' && user.two_factor_enabled && user.two_factor_verified) {
      // Teacher with 2FA enabled but REQUIRE_2FA not set - still check trusted device
      const deviceToken = getTrustedDeviceToken(req);
      console.log(`[googleLogin] 2FA enabled (no REQUIRE_2FA env), user: ${user.email}, deviceToken: ${!!deviceToken}`);
      if (deviceToken) {
        const trustedDevice = await TrustedDeviceDB.findValidDevice(user.id, deviceToken);
        console.log(`[googleLogin] findValidDevice result: ${trustedDevice ? 'FOUND' : 'NOT FOUND'}`);
        if (trustedDevice) {
          await TrustedDeviceDB.updateLastUsed(trustedDevice.id);
          const accessToken = generateToken(user.id);
          const refreshToken = generateRefreshToken(user.id);

          const isProduction = process.env.NODE_ENV === 'production';
          const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : ('lax' as const),
            maxAge: 7 * 24 * 60 * 60 * 1000,
          } as const;

          res.cookie('accessToken', accessToken, cookieOptions);
          res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });

          return res.json({
            success: true,
            token: accessToken,
            refreshToken,
            trustedDevice: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              classId: user.class_id,
              avatarUrl: user.avatar_url || null,
              two_factor_enabled: true,
            },
          });
        }
        // No trusted device - require TOTP for teacher
        return res.json({
          success: false,
          requires2FA: true,
          skipSetup: true,
          message: 'Tài khoản của bạn đã bật xác thực 2FA. Vui lòng nhập mã từ ứng dụng TOTP.',
          tempToken: generateToken(user.id, '5m'),
        });
      }
    }
    // Students skip 2FA check entirely - they can login without 2FA
    // ===== End 2FA check =====

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    } as const;

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Create trusted device record if rememberDevice is true
    let deviceToken: string | null = null;
    if (rememberDevice) {
      const ipAddress = req.ip || req.socket?.remoteAddress || undefined;
      deviceToken = await successfulLoginWithDevice(res, user.id, req.headers['user-agent'], ipAddress);
    }

    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      trustedDevice: !!deviceToken,
      deviceToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        classId: user.class_id,
        avatarUrl: user.avatar_url || null,
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
        two_factor_enabled: user.two_factor_enabled || false,
      },
    });
  } catch (error: any) {
    console.error('[googleLogin]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Google login failed.',
    });
  }
};

// ============================================================
// STUDENT SIGN UP WITH EMAIL VERIFICATION
// ============================================================

// Step 1: Send OTP to email for registration
export const sendRegisterOTP = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, tên và mật khẩu là bắt buộc.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự.',
      });
    }

    // Check if email already registered
    const existingUser = await UserDB.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.',
      });
    }

    // Create temporary user record with pending status
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store temp registration data (we'll use sessionStorage-like approach with a map)
    // For simplicity, we'll store in memory (in production, use Redis or DB)
    (global as any).__pendingRegistrations = (global as any).__pendingRegistrations || new Map();
    (global as any).__pendingRegistrations.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      name,
      password,
      role: 'student',
      createdAt: Date.now(),
    });

    // Create OTP for registration
    const otp = await OTPService.createRegisterOTP(tempUserId, email);

    // Send OTP email
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      console.error('[OTP] RESEND_API_KEY is not set!');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please try again later.',
      });
    }

    await resend.emails.send({
      from: 'English Exam <onboarding@resend.dev>',
      to: email,
      subject: 'Mã xác nhận đăng ký - Lan Anh English',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5F8D78;">Lan Anh English</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản học sinh tại Lan Anh English.</p>
          <p>Dưới đây là mã xác nhận của bạn:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>Mã này có hiệu lực trong <strong>5 phút</strong>.</p>
          <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">English Exam System - Hệ thống học tập và thi online</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'Mã xác nhận đã được gửi đến email của bạn!',
    });
  } catch (error: any) {
    console.error('[Register] sendRegisterOTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.',
    });
  }
};

// Step 2: Verify OTP and complete registration
export const verifyRegisterOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!email || !otp || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin.',
      });
    }

    // Verify OTP
    const otpResult = await OTPService.verifyOTP(email, otp, 'register');
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.error || 'Mã OTP không hợp lệ.',
      });
    }

    // Check if email already exists
    const existingUser = await UserDB.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký.',
      });
    }

    // Create the actual user
    const user = await UserDB.create({
      email: email.toLowerCase(),
      password,
      name,
      role: 'student',
    });

    // Clear OTP after successful verification
    OTPService.clearOTP(email);

    // Clear pending registration
    if ((global as any).__pendingRegistrations) {
      (global as any).__pendingRegistrations.delete(email.toLowerCase());
    }

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    } as const;

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url || null,
        phone: user.phone || null,
      },
    });
  } catch (error: any) {
    console.error('[Register] verifyRegisterOTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Xác thực thất bại. Vui lòng thử lại.',
    });
  }
};

// ============================================================
// WHITELIST MANAGEMENT (Admin only)
// ============================================================

// List all whitelists (teacher + student)
export const listWhitelist = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query; // 'teacher', 'student', or undefined for all

    let teacherWhitelist: any[] = [];
    let studentWhitelist: any[] = [];

    if (!type || type === 'teacher') {
      teacherWhitelist = await TeacherWhitelistDB.list();
    }
    if (!type || type === 'student') {
      studentWhitelist = await StudentWhitelistDB.list();
    }

    res.json({
      success: true,
      teacherWhitelist,
      studentWhitelist,
      total: teacherWhitelist.length + studentWhitelist.length,
    });
  } catch (error: any) {
    console.error('[WHITELIST] List error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list whitelist.',
    });
  }
};

// Manage whitelist entries
export const manageWhitelist = async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, role, action } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    if (action === 'delete') {
      // Delete from appropriate whitelist based on role
      if (role === 'student') {
        await StudentWhitelistDB.deactivate(email);
      } else {
        await TeacherWhitelistDB.deactivate(email);
      }
      res.json({
        success: true,
        message: 'Email đã được xóa khỏi whitelist.',
      });
    } else {
      // Add or update whitelist
      if (role === 'student') {
        await StudentWhitelistDB.create({ email, name });
      } else {
        await TeacherWhitelistDB.create({ email, name });
      }
      res.json({
        success: true,
        message: 'Email đã được thêm vào whitelist.',
      });
    }
  } catch (error: any) {
    console.error('[WHITELIST] Manage error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to manage whitelist.',
    });
  }
};

// Get whitelist statistics
export const getWhitelistStats = async (req: AuthRequest, res: Response) => {
  try {
    const teacherCount = await TeacherWhitelistDB.count();
    const studentCount = await StudentWhitelistDB.count();

    res.json({
      success: true,
      stats: {
        teachers: teacherCount,
        students: studentCount,
        total: teacherCount + studentCount,
      },
    });
  } catch (error: any) {
    console.error('[WHITELIST] Stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get whitelist stats.',
    });
  }
};

// ============================================================
// USER MANAGEMENT (Admin only)
// ============================================================

// Get all users (for admin dashboard)
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('users')
      .select('id, email, name, role, student_id, class_id, avatar_url, phone, date_of_birth, two_factor_enabled, two_factor_verified, created_at, updated_at', { count: 'exact' });

    // Filter by role
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    // Search by email or name
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });
    
    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get statistics
    const { count: teacherCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    const { count: studentCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    res.json({
      success: true,
      users: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
      stats: {
        teachers: teacherCount || 0,
        students: studentCount || 0,
        total: (teacherCount || 0) + (studentCount || 0),
      },
    });
  } catch (error: any) {
    console.error('[USERS] List error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list users.',
    });
  }
};

// Get user by ID (for admin dashboard)
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, student_id, class_id, avatar_url, phone, date_of_birth, two_factor_enabled, two_factor_verified, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user: data,
    });
  } catch (error: any) {
    console.error('[USERS] Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user.',
    });
  }
};

// ============================================================
// REVOKE ALL TRUSTED DEVICES
// ============================================================
export const revokeTrustedDevices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    const count = await TrustedDeviceDB.revokeAll(userId);
    clearTrustedDeviceCookie(res);

    res.json({
      success: true,
      message: `Đã hủy ${count} thiết bị đáng tin cậy.`,
    });
  } catch (error: any) {
    console.error('[TrustedDevice] Revoke error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to revoke trusted devices.',
    });
  }
};
