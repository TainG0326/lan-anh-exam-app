import express from 'express';
import { AuthRequest, protect } from '../middleware/auth.js';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParseLib from 'pdf-parse';
const pdfParse = 'default' in pdfParseLib ? (pdfParseLib as any).default : pdfParseLib;
import mammoth from 'mammoth';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type GenerateContentResult,
} from '@google/generative-ai';

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
export const aiUploadArrayMiddleware = upload.array('images', 50);

/** Google đã ngừng nhiều bản gemini-1.5-flash trên v1beta → dùng model ổn định mới. Có thể override bằng GEMINI_MODEL trên Render. */
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/** Retry tự động khi Gemini trả 503 (high demand). */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function geminiWithRetry<T>(fn: () => Promise<T>, label = 'Gemini call'): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is503 = /503|Service Unavailable|high demand|temporarily unavailable/i.test(msg);
      if (is503 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * (attempt + 1);
        console.warn(`[AI Import] ${label} bị 503 (lần ${attempt + 1}), thử lại sau ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/** Giảm chặn nhầm với đề thi / tài liệu học thuật (an toàn vẫn do API Google áp dụng). */
const GEMINI_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

function getGeminiModel(genAI: GoogleGenerativeAI) {
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    safetySettings: GEMINI_SAFETY_SETTINGS,
  });
}

/** Tránh throw từ response.text() khi bị chặn / không có candidate — trả lỗi rõ cho client. */
function readGeminiText(result: GenerateContentResult): string {
  const response = result.response as {
    text?: () => string;
    candidates?: unknown[];
    promptFeedback?: { blockReason?: string };
  };
  try {
    if (typeof response.text === 'function') {
      return response.text();
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      msg.includes('block') || msg.includes('Block')
        ? 'AI từ chối xử lý nội dung (chính sách an toàn). Thử file khác hoặc nhập câu hỏi thủ công.'
        : msg
    );
  }
  if (response.promptFeedback?.blockReason) {
    throw new Error(
      'AI không xử lý được nội dung (bị chặn). Thử đổi file hoặc trích đoạn văn bản ngắn hơn.'
    );
  }
  return '';
}

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

// Một multer duy nhất (aiUploadMiddleware) — trước đó có thêm multer inline → lỗi; không gắn multer → req.file luôn undefined
router.post('/import', aiUploadMiddleware, async (req: AuthRequest, res) => {
  try {
    console.log('[AI Import] user:', req.user?.id, req.user?.role);
    if (!req.user || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can use AI import' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const { mimetype, originalname } = req.file;
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    console.log('[AI Import] file:', originalname, 'mime:', mimetype, 'GEMINI_KEY set:', !!GEMINI_KEY);

    if (!GEMINI_KEY) {
      await fs.unlink(filePath).catch(() => {});
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured on the server' });
    }

    const questions = await processSingleFile(filePath, mimetype, originalname, GEMINI_KEY);

    await fs.unlink(filePath).catch(() => {});

    if (questions.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'No questions could be extracted. Please ensure the document contains clearly formatted multiple-choice questions.',
      });
    }

    res.json({ success: true, questions, count: questions.length });
  } catch (error: any) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    const msg = error?.message || String(error);
    console.error('[AI Import] error:', msg);
    const is503 = /503|Service Unavailable|high demand|temporarily unavailable/i.test(msg);
    const isGeminiFetch = /GoogleGenerativeAI|fetching from|API key|API_KEY|401|403|404/i.test(msg);
    const status = is503 || isGeminiFetch ? 502 : 500;
    const clientMsg = is503
      ? 'Gemini API đang quá tải (503). Vui lòng chờ 1–2 phút rồi thử lại.'
      : isGeminiFetch
      ? 'Dịch vụ AI tạm thời lỗi hoặc cấu hình API (Gemini) chưa đúng trên server. Kiểm tra GEMINI_API_KEY và GEMINI_MODEL trên Render.'
      : msg || 'AI import failed';
    res.status(status).json({ success: false, message: clientMsg });
  }
});

/** Xử lý nhiều ảnh cùng lúc — mỗi ảnh gọi Gemini Vision, gộp kết quả */
router.post('/import-batch', aiUploadArrayMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can use AI import' });
    }
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured on the server' });
    }

    console.log(`[AI Import Batch] processing ${files.length} files`);
    const allQuestions: GeminiQuestion[] = [];
    const errors: { file: string; message: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const qs = await processSingleFile(file.path, file.mimetype, file.originalname, GEMINI_KEY);
        allQuestions.push(...qs);
        console.log(`[AI Import Batch] file ${i + 1}/${files.length} (${file.originalname}): extracted ${qs.length} questions`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ file: file.originalname, message: msg });
        console.error(`[AI Import Batch] file ${file.originalname} failed:`, msg);
      } finally {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    if (allQuestions.length === 0) {
      const errorMsg = errors.length > 0
        ? `Không trích xuất được câu hỏi từ ${errors.length} file. Lỗi: ${errors.map(e => `${e.file}: ${e.message}`).join('; ')}`
        : 'No questions could be extracted.';
      return res.status(422).json({ success: false, message: errorMsg });
    }

    res.json({
      success: true,
      questions: allQuestions,
      count: allQuestions.length,
      filesProcessed: files.length,
      filesWithErrors: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    const files = req.files as Express.Multer.File[] | undefined;
    if (files) await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
    const msg = error?.message || String(error);
    console.error('[AI Import Batch] error:', msg);
    const is503 = /503|Service Unavailable|high demand/i.test(msg);
    const isGeminiFetch = /GoogleGenerativeAI|API key|401|403|404/i.test(msg);
    const status = is503 || isGeminiFetch ? 502 : 500;
    const clientMsg = is503
      ? 'Gemini API đang quá tải (503). Vui lòng chờ 1–2 phút rồi thử lại.'
      : isGeminiFetch
      ? 'Dịch vụ AI tạm thời lỗi. Kiểm tra GEMINI_API_KEY trên Render.'
      : msg || 'Batch import failed';
    res.status(status).json({ success: false, message: clientMsg });
  }
});

/** Tách logic xử lý 1 file thành hàm riêng — dùng chung cho /import và /import-batch */
async function processSingleFile(
  filePath: string,
  mimetype: string,
  originalname: string,
  GEMINI_KEY: string
): Promise<GeminiQuestion[]> {
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(originalname) ||
    ['image/jpeg', 'image/png', 'image/webp'].includes(mimetype);

  if (isImage) {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = getGeminiModel(genAI);

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

    console.log('[AI Import] calling Gemini Vision for:', originalname);
    const result = await geminiWithRetry(
      () => model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: mimeStr, data: base64 } },
      ]),
      'Gemini Vision'
    );

    const rawText = readGeminiText(result).trim();
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        return parsed.map((q: any) => ({
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
      return [];
    }
    return [];
  }

  // Text / PDF / DOCX
  let extractedText: string;
  try {
    extractedText = await extractTextFromFile(filePath, mimetype, originalname);
  } catch (extractErr: unknown) {
    const msg = extractErr instanceof Error ? extractErr.message : String(extractErr);
    throw new Error(`Không đọc được file: ${msg}`);
  }

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = getGeminiModel(genAI);

  const prompt = buildGeminiPrompt(extractedText);
  console.log('[AI Import] calling Gemini Flash for:', originalname);
  const result = await geminiWithRetry(
    () => model.generateContent(prompt),
    'Gemini Flash'
  );

  const rawText = readGeminiText(result).trim();
  const jsonMatch = rawText.match(/\[[\s\S]*?\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map((q: any) => ({
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
    throw new Error('AI không phân tích được câu hỏi từ file này. Hãy thử file khác hoặc nhập câu hỏi thủ công.');
  }
  return [];
}

/** Multer / lọc file: trả JSON 4xx thay vì để middleware toàn cục trả 500 không đồng nhất */
router.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const anyErr = err as { name?: string; code?: string; message?: string };
  if (anyErr?.name === 'MulterError' || anyErr?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File quá lớn (tối đa 20MB).',
    });
  }
  if (typeof anyErr?.message === 'string' && anyErr.message.includes('Only PDF')) {
    return res.status(400).json({ success: false, message: anyErr.message });
  }
  next(err);
});

export default router;