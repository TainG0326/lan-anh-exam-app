import { Request, Response } from 'express';
import { EmailWhitelistDB } from '../database/Whitelist.js';

// ============================================================
// WHITELIST ADMIN API (API Key Auth)
// All admin-dashboard whitelist operations go through this
// ============================================================

// GET /api/admin/whitelist?type=student&page=1&search=...
export const adminListWhitelist = async (req: Request, res: Response) => {
  try {
    const { type, page = '1', search, limit = '15' } = req.query;

    let teacherWhitelist: any[] = [];
    let studentWhitelist: any[] = [];
    let result: any[] = [];
    let totalCount = 0;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 15;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    if (!type || type === 'teacher') {
      teacherWhitelist = await EmailWhitelistDB.list('teacher');
    }
    if (!type || type === 'student') {
      studentWhitelist = await EmailWhitelistDB.list('student');
    }

    result = type === 'teacher' ? teacherWhitelist
              : type === 'student' ? studentWhitelist
              : [...teacherWhitelist, ...studentWhitelist];

    // Apply search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      result = result.filter(item =>
        item.email?.toLowerCase().includes(searchLower) ||
        item.name?.toLowerCase().includes(searchLower)
      );
    }

    totalCount = result.length;

    // Apply pagination
    result = result.slice(from, to);

    res.json({
      success: true,
      data: result,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error: any) {
    console.error('[AdminWhitelist] List error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list whitelist.',
    });
  }
};

// POST /api/admin/whitelist
// Body: { email, name?, role: 'student'|'teacher'|'any', action?: 'delete' }
export const adminManageWhitelist = async (req: Request, res: Response) => {
  try {
    const { email, name, role, action } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    if (!role || !['student', 'teacher', 'any'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role is required and must be: student, teacher, or any.',
      });
    }

    const emailLower = email.toLowerCase().trim();

    if (action === 'delete') {
      await EmailWhitelistDB.deactivate(emailLower, role);
      res.json({
        success: true,
        message: `Email "${email}" has been removed from whitelist.`,
      });
    } else {
      await EmailWhitelistDB.create({ email: emailLower, name, role });
      res.json({
        success: true,
        message: `Email "${email}" has been added to whitelist as ${role}.`,
      });
    }
  } catch (error: any) {
    console.error('[AdminWhitelist] Manage error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to manage whitelist.',
    });
  }
};

// GET /api/admin/whitelist/stats
export const adminGetWhitelistStats = async (req: Request, res: Response) => {
  try {
    const teacherCount = await EmailWhitelistDB.count('teacher');
    const studentCount = await EmailWhitelistDB.count('student');

    res.json({
      success: true,
      stats: {
        teachers: teacherCount,
        students: studentCount,
        total: teacherCount + studentCount,
      },
    });
  } catch (error: any) {
    console.error('[AdminWhitelist] Stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get whitelist stats.',
    });
  }
};

// POST /api/admin/whitelist/bulk
// Body: { emails: string[], role: string }
export const adminBulkAddWhitelist = async (req: Request, res: Response) => {
  try {
    const { emails, role } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'emails array is required.',
      });
    }

    if (!role || !['student', 'teacher', 'any'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role is required.',
      });
    }

    const results = { added: 0, failed: 0, errors: [] as string[] };

    for (const email of emails) {
      try {
        await EmailWhitelistDB.create({
          email: email.toLowerCase().trim(),
          role,
        });
        results.added++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`${email}: ${e.message}`);
      }
    }

    res.json({
      success: true,
      message: `Added ${results.added} emails. ${results.failed} failed.`,
      ...results,
    });
  } catch (error: any) {
    console.error('[AdminWhitelist] Bulk add error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to bulk add whitelist.',
    });
  }
};
