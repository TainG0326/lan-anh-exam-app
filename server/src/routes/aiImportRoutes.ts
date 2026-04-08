import express from 'express';
import { AuthRequest, protect } from '../middleware/auth.js';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParseLib from 'pdf-parse';
const pdfParse = 'default' in pdfParseLib ? (pdfParseLib as any).default : pdfParseLib;
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config — allow PDF, DOCX, images
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: FileFilterCallback) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const extraAllowed = ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(file.mimetype) || extraAllowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, JPG, PNG files are accepted'));
    }
  },
});
export const aiUploadMiddleware = upload.single('file');

/** Google đã ngừng nhiều bản gemini-1.5-flash trên v1beta → dùng model ổn định mới. Có thể override bằng GEMINI_MODEL trên Render. */
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

interface GeminiQuestion {
  question: string;
  type: 'multiple-choice';
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

function buildGeminiPrompt(textContent: string): string {
  return `You are a teacher-exam question extractor. Given document text, extract all multiple-choice questions and return a JSON array.

Rules:
- Each question object must have: question (string), type (always "multiple-choice"), options (array of 4 strings A/B/C/D), correctAnswer (string index "0"-"3"), points (integer, default 1), explanation (string, optional).
- Map correct answer letter A→0, B→1, C→2, D→3.
- If there are fewer than 4 options, fill missing ones with empty string.
- If correct answer cannot be determined, set correctAnswer to "" and add explanation noting uncertainty.
- Return ONLY valid JSON — no markdown, no explanation outside the array.

Document text:
${textContent.slice(0, 12000)}`;
}

async function extractTextFromFile(
  filePath: string,
  mimeType: string,
  originalName: string
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf' || mimeType === 'application/pdf') {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // Images: return file path so controller can send base64 to Gemini Vision
  return filePath;
}

const router = express.Router();

// Bắt buộc: không có protect thì req.user luôn undefined → luôn 403 "Only teachers can use AI import"
router.use(protect);

// Dùng aiUploadMiddleware đã export ở trên — KHÔNG tạo thêm multer instance
router.post('/import', async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can use AI import' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const { mimetype, originalname } = req.file;
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_KEY) {
      await fs.unlink(filePath).catch(() => {});
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured on the server' });
    }

    // 1. Extract text
    let extractedText = await extractTextFromFile(filePath, mimetype, originalname);

    // 2. Gemini Vision for images
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(originalname) ||
      ['image/jpeg', 'image/png', 'image/webp'].includes(mimetype);

    let questions: GeminiQuestion[] = [];

    if (isImage) {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const imageData = await fs.readFile(filePath);
      const base64 = imageData.toString('base64');
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.webp': 'image/webp',
      };
      const mimeStr = mimeMap[path.extname(originalname).toLowerCase()] || mimetype;

      const prompt = `You are a teacher-exam question extractor. Given this image of exam questions, extract ALL multiple-choice questions and return ONLY a valid JSON array.

Each question: { "question": "text", "type": "multiple-choice", "options": ["A text","B text","C text","D text"], "correctAnswer": "0|1|2|3", "points": 1, "explanation": "" }.
Map A→0, B→1, C→2, D→3. Return ONLY JSON, no explanation.`;

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: mimeStr, data: base64 } },
      ]);

      const rawText = result.response.text().trim();
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          questions = parsed.map((q: any) => ({
            question: q.question || '',
            type: 'multiple-choice' as const,
            options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
            correctAnswer: typeof q.correctAnswer === 'number'
              ? String(q.correctAnswer)
              : (q.correctAnswer || ''),
            points: typeof q.points === 'number' ? q.points : 1,
            explanation: q.explanation || '',
          }));
        }
      } catch {
        // Return what we can from raw text
        questions = [];
      }
    } else {
      // 3. Gemini Flash for text/PDF/DOCX
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = buildGeminiPrompt(extractedText);
      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();

      // Try to extract JSON from response
      const jsonMatch = rawText.match(/\[[\s\S]*?\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          questions = parsed.map((q: any) => ({
            question: q.question || '',
            type: 'multiple-choice' as const,
            options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
            correctAnswer: typeof q.correctAnswer === 'number'
              ? String(q.correctAnswer)
              : (q.correctAnswer || ''),
            points: typeof q.points === 'number' ? q.points : 1,
            explanation: q.explanation || '',
          }));
        }
      } catch {
        return res.status(422).json({
          success: false,
          message: 'AI could not parse questions from this file. Please check the document format or add questions manually.',
          extractedText: extractedText.slice(0, 500),
        });
      }
    }

    // Clean up
    await fs.unlink(filePath).catch(() => {});

    if (questions.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'No questions could be extracted. Please ensure the document contains clearly formatted multiple-choice questions.',
      });
    }

    res.json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error: any) {
    try { await fs.unlink(req.file?.path || '').catch(() => {}); } catch {}
    console.error('AI Import error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'AI import failed' });
  }
});

export default router;