import { Response } from 'express';
import { ClassDB } from '../database/Class.js';
import { UserDB } from '../database/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateClassCode } from '../utils/generateClassCode.js';

export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { name, grade, level } = req.body;

    // Generate unique class code
    let classCode = generateClassCode();
    let existingClass = await ClassDB.findByCode(classCode);
    while (existingClass) {
      classCode = generateClassCode();
      existingClass = await ClassDB.findByCode(classCode);
    }

    const classDoc = await ClassDB.create({
      name,
      grade,
      level,
      teacherId: req.user!.id,
      classCode,
    });

    res.status(201).json({
      success: true,
      class: classDoc,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo lớp.',
    });
  }
};

export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const classes = await ClassDB.findByTeacherId(req.user!.id);

    res.json({
      success: true,
      classes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách lớp.',
    });
  }
};

export const addStudentToClass = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, studentId } = req.body;

    const classDoc = await ClassDB.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp.',
      });
    }

    if (classDoc.teacher_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện.',
      });
    }

    await ClassDB.addStudent(classId, studentId);
    await UserDB.updateClassId(studentId, classId);

    const updatedClass = await ClassDB.findById(classId);

    res.json({
      success: true,
      class: updatedClass,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi thêm học sinh.',
    });
  }
};

export const joinClassByCode = async (req: AuthRequest, res: Response) => {
  try {
    const { classCode } = req.body;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã lớp.',
      });
    }

    const classDoc = await ClassDB.findByCode(classCode);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Mã lớp không hợp lệ.',
      });
    }

    // Check if student is already in the class
    const existingClass = await ClassDB.findByStudentId(req.user!.id);
    if (existingClass && existingClass.id === classDoc.id) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã tham gia lớp này rồi.',
      });
    }

    // Add student to class
    await ClassDB.addStudent(classDoc.id, req.user!.id);
    await UserDB.updateClassId(req.user!.id, classDoc.id);

    res.json({
      success: true,
      message: 'Tham gia lớp thành công!',
      class: classDoc,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tham gia lớp.',
    });
  }
};

export const getClassByCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const classDoc = await ClassDB.findByCode(code);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp.',
      });
    }

    res.json({
      success: true,
      class: classDoc,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin lớp.',
    });
  }
};

export const getClassById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = (req as any).params;
    const classDoc = await ClassDB.findById(id);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    // Check if teacher owns this class
    if (classDoc.teacher_id !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this class.',
      });
    }

    res.json({
      success: true,
      class: classDoc,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get class details.',
    });
  }
};

export const getMyClass = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserDB.findById(req.user!.id);
    if (!user || !user.class_id) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa tham gia lớp nào.',
      });
    }

    const classDoc = await ClassDB.findById(user.class_id);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp.',
      });
    }

    res.json({
      success: true,
      class: classDoc,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin lớp.',
    });
  }
};

export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, grade, level, is_locked } = req.body;

    const classDoc = await ClassDB.findById(id);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp.',
      });
    }

    if (classDoc.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật lớp này.',
      });
    }

    const updatedClass = await ClassDB.update(id, { name, grade, level, is_locked });
    if (!updatedClass) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật lớp.',
      });
    }

    res.json({
      success: true,
      class: updatedClass,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật lớp.',
    });
  }
};

export const removeStudentFromClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id, studentId } = req.params;

    const classDoc = await ClassDB.findById(id);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp.',
      });
    }

    if (classDoc.teacher_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện.',
      });
    }

    await ClassDB.removeStudent(id, studentId);

    res.json({
      success: true,
      message: 'Đã xóa học sinh khỏi lớp.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xóa học sinh.',
    });
  }
};

