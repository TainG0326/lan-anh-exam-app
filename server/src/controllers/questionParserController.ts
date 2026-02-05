import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { parseQuestions } from '../utils/questionParser.js';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept text files and docx
    const allowedMimes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.endsWith('.txt') || 
        file.originalname.endsWith('.docx') ||
        file.originalname.endsWith('.doc')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file .txt hoặc .docx'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

export const parseFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file để upload.',
      });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();
    let content = '';

    try {
      if (fileType === '.txt') {
        // Read text file
        content = await fs.readFile(filePath, 'utf-8');
      } else if (fileType === '.docx') {
        // For .docx files, we'll need mammoth library
        // For now, return error asking user to convert to .txt
        await fs.unlink(filePath); // Clean up
        return res.status(400).json({
          success: false,
          message: 'File .docx chưa được hỗ trợ. Vui lòng chuyển đổi file sang định dạng .txt hoặc copy nội dung vào file .txt',
        });
      } else {
        // Try to read as text anyway
        content = await fs.readFile(filePath, 'utf-8');
      }

      // Parse questions from content
      const questions = parseQuestions(content, fileType);

      // Clean up uploaded file
      await fs.unlink(filePath);

      if (questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra định dạng file.\n\nĐịnh dạng mong muốn:\nCâu 1: Câu hỏi?\nA. Đáp án A\nB. Đáp án B\nC. Đáp án C\nD. Đáp án D\nĐáp án: A',
        });
      }

      res.json({
        success: true,
        questions,
        count: questions.length,
      });
    } catch (error: any) {
      // Clean up file on error
      try {
        await fs.unlink(filePath);
      } catch {}
      
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi đọc file: ' + error.message,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xử lý file.',
    });
  }
};

