import express from 'express';
import { AuthRequest, protect } from '../middleware/auth.js';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParseLib from 'pdf-parse';
const pdfParse = 'default' in pdfParseLib ? (pdfParseLib as any).default : pdfParseLib;
import mammoth from 'mammoth';
import Anthropic from '@anthropic-ai/sdk';
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

/** Claude Vision — ưu tiên khi có ANTHROPIC_API_KEY; Gemini làm fallback */
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022';

function getGeminiKeyFromEnv(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
}

function hasConfiguredAiProvider(): boolean {
  return Boolean(ANTHROPIC_API_KEY || getGeminiKeyFromEnv());
}

const AI_KEYS_MISSING_MSG =
  'Chưa cấu hình AI trên server. Thêm biến ANTHROPIC_API_KEY (khuyến nghị) hoặc GEMINI_API_KEY trên hosting (ví dụ Render).';

/** Số ảnh gửi trong 1 request — Gemini free-tier giới hạn 20 req/ngày
 * 50 ảnh / 10 = 5 requests → còn dư 15 requests/ngày */
const IMAGES_PER_BATCH = 10;

// ── Rate limit tracker ──────────────────────────────────────────────────────
const MAX_GEMINI_REQUESTS_PER_DAY = 20;
let dailyRequestCount = 0;
let dailyResetTime = getTodayResetUTC();

function getTodayResetUTC(): Date {
  // Reset lúc 00:00 UTC mỗi ngày
  const now = new Date();
  const reset = new Date(now);
  reset.setUTCHours(0, 0, 0, 0);
  reset.setUTCDate(reset.getUTCDate() + 1);
  return reset;
}

function shouldGeminiBeSkipped(): boolean {
  const now = new Date();
  if (now >= dailyResetTime) {
    dailyRequestCount = 0;
    dailyResetTime = getTodayResetUTC();
    console.log('[RateLimit] Gemini quota reset for new day');
  }
  return dailyRequestCount >= MAX_GEMINI_REQUESTS_PER_DAY;
}

function recordGeminiRequest(): void {
  dailyRequestCount++;
  const remaining = Math.max(0, MAX_GEMINI_REQUESTS_PER_DAY - dailyRequestCount);
  console.log(`[RateLimit] Gemini request #${dailyRequestCount}/${MAX_GEMINI_REQUESTS_PER_DAY} (remaining: ${remaining})`);
}

/** Retry tự động khi Claude trả 529 (model overloaded) hoặc 429 (rate limit). */
const MAX_RETRIES_CLAUDE = 3;
const RETRY_DELAY_CLAUDE_MS = 2000;

function parseClaudeRetryDelay(errorMsg: string): number | null {
  const match = errorMsg.match(/retry after (\d+)s/i) ||
                errorMsg.match(/Please retry in (\d+\.?\d*)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000);
  }
  return null;
}

async function claudeWithRetry<T>(fn: () => Promise<T>, label = 'Claude call'): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES_CLAUDE; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isOverloaded = /529|overloaded|model at capacity/i.test(msg);
      const isRateLimit = /429|Rate limit|rate_limit|too many requests/i.test(msg);

      if ((isOverloaded || isRateLimit) && attempt < MAX_RETRIES_CLAUDE) {
        let delay = parseClaudeRetryDelay(msg);
        if (!delay) {
          delay = RETRY_DELAY_CLAUDE_MS * (attempt + 1);
        }
        const delayType = isRateLimit ? 'rate limit (429)' : 'overloaded (529)';
        console.warn(`[Claude] ${label} bị ${delayType} (lần ${attempt + 1}), thử lại sau ${Math.round(delay/1000)}s...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/** Classify error cho Claude */
function classifyClaudeError(msg: string): { category: string; suggestion: string } {
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('529') || lowerMsg.includes('overloaded')) {
    return {
      category: 'Claude quá tải (529)',
      suggestion: 'Claude đang bận, thử lại sau 1-2 phút'
    };
  }

  if (lowerMsg.includes('401') || lowerMsg.includes('403') || lowerMsg.includes('api key') || lowerMsg.includes('authentication')) {
    return {
      category: 'Lỗi xác thực API Claude',
      suggestion: 'ANTHROPIC_API_KEY không hợp lệ hoặc hết hạn'
    };
  }

  if (lowerMsg.includes('quota') || lowerMsg.includes('limit') || lowerMsg.includes('exceeded')) {
    return {
      category: 'Vượt quota Claude',
      suggestion: 'Đã dùng hết quota Claude, kiểm tra Anthropic billing'
    };
  }

  if (lowerMsg.includes('image') && lowerMsg.includes('invalid')) {
    return {
      category: 'Lỗi định dạng ảnh',
      suggestion: 'Ảnh không hỗ trợ, thử định dạng JPG hoặc PNG'
    };
  }

  if (lowerMsg.includes('empty') || lowerMsg.includes('no question') || lowerMsg.includes('cannot extract')) {
    return {
      category: 'Không trích xuất được',
      suggestion: 'Ảnh không chứa câu hỏi rõ ràng, thử ảnh chất lượng tốt hơn'
    };
  }

  return {
    category: 'Lỗi không xác định',
    suggestion: 'Thử file khác hoặc liên hệ hỗ trợ'
  };
}

/** Xử lý ảnh bằng Claude Vision - trích xuất câu hỏi trắc nghiệm */
async function processImageWithClaude(
  imageData: Buffer,
  originalname: string,
  mimeStr: string
): Promise<GeminiQuestion[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY không được cấu hình trên server');
  }

  const client = new Anthropic();

  const prompt = `You are a teacher-exam question extractor. Given this image of exam questions, extract ALL multiple-choice questions and return ONLY a valid JSON array.

Each question must have:
- question: string (nội dung câu hỏi)
- type: "multiple-choice" (always)
- options: array of 4 strings for A, B, C, D answers
- correctAnswer: string index "0"-"3" (0=A, 1=B, 2=C, 3=D)
- points: 1
- explanation: "" (optional)

Map: A→0, B→1, C→2, D→3. Return ONLY valid JSON array, no markdown, no explanation outside the array. Example: [{"question":"What is...","type":"multiple-choice","options":["A answer","B answer","C answer","D answer"],"correctAnswer":"0","points":1,"explanation":""}]`;

  console.log('[Claude Vision] Processing:', originalname);

  const base64Data = imageData.toString('base64');

  const response = await claudeWithRetry(async () => {
    return await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeStr as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: base64Data
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }]
    });
  }, 'Claude Vision');

  const rawText = response.content[0];
  if (rawText.type !== 'text') {
    throw new Error('Claude không trả về text, thử lại sau');
  }

  const text = rawText.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      const validQuestions = parsed.filter((q: any) => q.question && q.question.trim().length > 0);
      if (validQuestions.length === 0 && parsed.length > 0) {
        console.warn(`[Claude Vision] File ${originalname}: AI trả về ${parsed.length} câu hỏi nhưng đều rỗng`);
      }
      return validQuestions.map((q: any) => ({
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
  } catch (parseErr: unknown) {
    const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error(`[Claude Vision] JSON parse error for ${originalname}:`, parseMsg);
    const questionsFromText = extractQuestionsFromRawText(jsonStr, originalname);
    if (questionsFromText.length > 0) {
      console.log(`[Claude Vision] Fallback: extracted ${questionsFromText.length} questions from raw text`);
      return questionsFromText;
    }
  }

  console.warn(`[Claude Vision] Không trích xuất được câu hỏi từ ${originalname}`);
  return [];
}

/** Gộp nhiều ảnh vào 1 request Claude Vision — giảm số API calls */
async function processBatchImagesWithClaude(
  images: { imageData: Buffer; originalname: string; mimeStr: string }[],
  batchIndex: number
): Promise<{ originalname: string; questions: GeminiQuestion[] }[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic();

  const prompt = `You are a teacher-exam question extractor. Given ${images.length} images of exam questions, extract ALL multiple-choice questions from ALL images and return a JSON array.

For each image, prefix the question with its filename so you know which image it came from.

Rules:
- Each question object: { "question": "text", "type": "multiple-choice", "options": ["A text","B text","C text","D text"], "correctAnswer": "0"-"3", "points": 1, "explanation": "", "sourceFile": "filename" }
- Map: A→0, B→1, C→2, D→3
- Return ONLY valid JSON array, no markdown, no explanation outside the array
- If an image has no questions, skip it (don't include in array)
- Include "sourceFile" field with the original filename for each question

Example:
[{"question":"(Q1.jpg) What is...?","type":"multiple-choice","options":["A","B","C","D"],"correctAnswer":"0","points":1,"explanation":"","sourceFile":"Q1.jpg"}]`;

  console.log(`[Claude Batch ${batchIndex}] Processing ${images.length} images`);
  const base64Images = images.map(img => img.imageData.toString('base64'));

  const response = await claudeWithRetry(async () => {
    const contentParts: any[] = images.map((img, idx) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mimeStr as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
        data: base64Images[idx]
      }
    }));
    contentParts.push({ type: 'text', text: prompt });

    return await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: contentParts }]
    });
  }, `Claude Batch ${batchIndex}`);

  const rawText = response.content[0];
  if (rawText.type !== 'text') {
    throw new Error('Claude không trả về text');
  }

  const text = rawText.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

  const resultMap: Record<string, GeminiQuestion[]> = {};
  const fileOrder = images.map(img => img.originalname);
  fileOrder.forEach(f => { resultMap[f] = []; });

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      parsed.forEach((q: any) => {
        const src = q.sourceFile || '';
        const baseSrc = src.replace(/^.*[\\/]/, '').trim();
        const matched = baseSrc ? (resultMap[baseSrc] !== undefined ? baseSrc : fileOrder.find(f => baseSrc.includes(f) || f.includes(baseSrc)) || fileOrder[0]) : fileOrder[0];
        resultMap[matched]?.push({
          question: (q.question || '').replace(/^\([^)]+\)\s*/, ''),
          type: 'multiple-choice' as const,
          options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
          correctAnswer: typeof q.correctAnswer === 'number' ? String(q.correctAnswer) : (q.correctAnswer || ''),
          points: typeof q.points === 'number' ? q.points : 1,
          explanation: q.explanation || '',
        });
      });
    }
  } catch (parseErr: unknown) {
    console.error(`[Claude Batch ${batchIndex}] JSON parse error:`, parseErr instanceof Error ? parseErr.message : String(parseErr));
  }

  return fileOrder.map(fname => ({ originalname: fname, questions: resultMap[fname] || [] }));
}

/** Gộp nhiều ảnh vào 1 request Gemini Vision */
async function processBatchImagesWithGemini(
  images: { imageData: Buffer; originalname: string; mimeStr: string }[],
  batchIndex: number,
  geminiKey: string
): Promise<{ originalname: string; questions: GeminiQuestion[] }[]> {
  if (shouldGeminiBeSkipped()) {
    const resetIn = Math.ceil((dailyResetTime.getTime() - Date.now()) / 1000);
    throw new Error(
      `[RateLimit] Gemini quota đã hết (${MAX_GEMINI_REQUESTS_PER_DAY}/${MAX_GEMINI_REQUESTS_PER_DAY}). ` +
      `Reset tự động trong ${Math.floor(resetIn / 3600)}h ${Math.floor((resetIn % 3600) / 60)}m. ` +
      `Retry sau khi quota reset hoặc thêm ANTHROPIC_API_KEY làm fallback.`
    );
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = getGeminiModel(genAI);

  const prompt = `You are a teacher-exam question extractor. Given ${images.length} images of exam questions, extract ALL multiple-choice questions from ALL images and return a JSON array.

For each question, include the source filename.

Rules:
- Each question: { "question": "text", "type": "multiple-choice", "options": ["A text","B text","C text","D text"], "correctAnswer": "0"-"3", "points": 1, "explanation": "", "sourceFile": "filename" }
- Map: A→0, B→1, C→2, D→3
- Return ONLY valid JSON array, no markdown, no explanation outside the array
- Include "sourceFile" field with the original filename for each question`;

  console.log(`[Gemini Batch ${batchIndex}] Processing ${images.length} images`);
  const parts: any[] = images.map(img => ({
    inlineData: { mimeType: img.mimeStr, data: img.imageData.toString('base64') }
  }));
  parts.unshift({ text: prompt });

  const result = await geminiWithRetry(
    () => model.generateContent(parts),
    `Gemini Batch ${batchIndex}`
  );

  recordGeminiRequest();

  const rawText = readGeminiText(result).trim();
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

  const resultMap: Record<string, GeminiQuestion[]> = {};
  const fileOrder = images.map(img => img.originalname);
  fileOrder.forEach(f => { resultMap[f] = []; });

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      parsed.forEach((q: any) => {
        const src = q.sourceFile || '';
        const baseSrc = src.replace(/^.*[\\/]/, '').trim();
        const matched = baseSrc ? (resultMap[baseSrc] !== undefined ? baseSrc : fileOrder.find(f => baseSrc.includes(f) || f.includes(baseSrc)) || fileOrder[0]) : fileOrder[0];
        resultMap[matched]?.push({
          question: (q.question || '').replace(/^\([^)]+\)\s*/, ''),
          type: 'multiple-choice' as const,
          options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
          correctAnswer: typeof q.correctAnswer === 'number' ? String(q.correctAnswer) : (q.correctAnswer || ''),
          points: typeof q.points === 'number' ? q.points : 1,
          explanation: q.explanation || '',
        });
      });
    }
  } catch (parseErr: unknown) {
    console.error(`[Gemini Batch ${batchIndex}] JSON parse error:`, parseErr instanceof Error ? parseErr.message : String(parseErr));
  }

  return fileOrder.map(fname => ({ originalname: fname, questions: resultMap[fname] || [] }));
}

/** Xử lý text/PDF bằng Claude */
async function processTextWithClaude(
  textContent: string,
  originalname: string
): Promise<GeminiQuestion[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY không được cấu hình trên server');
  }

  const client = new Anthropic();

  const prompt = `You are a teacher-exam question extractor. Given document text, extract all multiple-choice questions and return a JSON array.

Rules:
- Each question object must have: question (string), type (always "multiple-choice"), options (array of 4 strings A/B/C/D), correctAnswer (string index "0"-"3"), points (integer, default 1), explanation (string, optional).
- Map correct answer letter A→0, B→1, C→2, D→3.
- If there are fewer than 4 options, fill missing ones with empty string.
- If correct answer cannot be determined, set correctAnswer to "" and add explanation noting uncertainty.
- Return ONLY valid JSON array, no markdown, no explanation outside the array.

Document text:
${textContent.slice(0, 12000)}`;

  console.log('[Claude] Processing text from:', originalname);

  const response = await claudeWithRetry(async () => {
    return await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
  }, 'Claude Text');

  const rawText = response.content[0];
  if (rawText.type !== 'text') {
    throw new Error('Claude không trả về text, thử lại sau');
  }

  const text = rawText.text.trim();
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;

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
    throw new Error('Claude không phân tích được câu hỏi từ file này. Hãy thử file khác hoặc nhập câu hỏi thủ công.');
  }

  return [];
}

/** Retry tự động khi Gemini trả 503 (high demand) hoặc 429 (quota). */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/** Parse retry delay từ error response của Gemini (429 quota) */
function parseRetryDelay(errorMsg: string): number | null {
  const match = errorMsg.match(/"retryDelay"\s*:\s*"(\d+)s"/i) ||
                errorMsg.match(/Please retry in (\d+\.?\d*)s/i) ||
                errorMsg.match(/retryDelay["\s:]+(\d+\.?\d*)/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000);
  }
  return null;
}

async function geminiWithRetry<T>(fn: () => Promise<T>, label = 'Gemini call'): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is503 = /503|Service Unavailable|high demand|temporarily unavailable/i.test(msg);
      const is429Quota = /429|Too Many Requests|quota exceeded|rate limit/i.test(msg);

      if ((is503 || is429Quota) && attempt < MAX_RETRIES) {
        // Ưu tiên dùng retry delay từ server (thường 47-55s cho quota)
        let delay = parseRetryDelay(msg);
        if (!delay) {
          delay = RETRY_DELAY_MS * (attempt + 1);
        }
        const delayType = is429Quota ? 'quota (429)' : '503';
        console.warn(`[AI Import] ${label} bị ${delayType} (lần ${attempt + 1}), thử lại sau ${Math.round(delay/1000)}s...`);
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

/** Phân loại lỗi để hiển thị thông điệp phù hợp cho user */
function classifyError(msg: string): { category: string; suggestion: string } {
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('503') || lowerMsg.includes('service unavailable') || lowerMsg.includes('high demand')) {
    return {
      category: 'Gemini quá tải (503)',
      suggestion: 'Gemini đang bận, thử lại sau 1-2 phút'
    };
  }

  if (lowerMsg.includes('401') || lowerMsg.includes('403') || lowerMsg.includes('api key') || lowerMsg.includes('authentication')) {
    return {
      category: 'Lỗi xác thực API',
      suggestion: 'GEMINI_API_KEY không hợp lệ hoặc hết hạn'
    };
  }

  if (lowerMsg.includes('quota') || lowerMsg.includes('limit') || lowerMsg.includes('exceeded')) {
    return {
      category: 'Vượt quota Gemini',
      suggestion: 'Đã dùng hết quota API Gemini, nâng cấp hoặc đợi đầu tháng'
    };
  }

  if (lowerMsg.includes('block') || lowerMsg.includes('safety') || lowerMsg.includes('harmful')) {
    return {
      category: 'AI chặn nội dung',
      suggestion: 'Nội dung bị chặn bởi chính sách an toàn của Gemini'
    };
  }

  if (lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) {
    return {
      category: 'Xử lý quá lâu',
      suggestion: 'Ảnh quá lớn hoặc phức tạp, thử ảnh nhỏ hơn'
    };
  }

  if (lowerMsg.includes('empty') || lowerMsg.includes('no question') || lowerMsg.includes('cannot extract')) {
    return {
      category: 'Không trích xuất được',
      suggestion: 'Ảnh không chứa câu hỏi rõ ràng, thử ảnh chất lượng tốt hơn'
    };
  }

  if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('connection')) {
    return {
      category: 'Lỗi mạng',
      suggestion: 'Kết nối mạng không ổn định, kiểm tra VPN/firewall'
    };
  }

  return {
    category: 'Lỗi không xác định',
    suggestion: 'Thử file khác hoặc liên hệ hỗ trợ'
  };
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

/** Fallback: Trích xuất câu hỏi từ raw text khi JSON parsing thất bại */
function extractQuestionsFromRawText(rawText: string, fileName: string): GeminiQuestion[] {
  const questions: GeminiQuestion[] = [];

  // Tìm các pattern phổ biến của câu hỏi trắc nghiệm
  // Pattern 1: Câu hỏi với đáp án A, B, C, D
  const questionPattern = /(?:^|\n)(.+?)\s*\n\s*[A-D]\s*[.:)]\s*(.+?)(?=\n\s*[A-D]\s*[.:)]\s*(.+?)){3}/gi;
  const matches = rawText.matchAll(questionPattern);

  for (const match of matches) {
    const question = match[1]?.trim();
    if (question && question.length > 5) {
      questions.push({
        question,
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        explanation: 'Trích xuất tự động từ text (chưa xác định đáp án đúng)',
      });
    }
  }

  // Pattern 2: Tìm các dòng có số thứ tự câu hỏi (1., 2., câu 1, etc.)
  const numberedPattern = /(?:^|\n)(?:\d+[.)]\s*|câu\s*\d+\s*)[.)\s]*(.+?)(?=\n|$)/gi;
  const numberedMatches = rawText.matchAll(numberedPattern);

  for (const match of numberedMatches) {
    const question = match[1]?.trim();
    if (question && question.length > 10 && !questions.find(q => q.question === question)) {
      questions.push({
        question,
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        explanation: 'Trích xuất tự động từ text',
      });
    }
  }

  console.log(`[extractQuestionsFromRawText] ${fileName}: found ${questions.length} questions`);
  return questions;
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
    const geminiKey = getGeminiKeyFromEnv() ?? '';
    console.log('[AI Import] file:', originalname, 'mime:', mimetype, 'GEMINI:', !!geminiKey);

    if (!geminiKey) {
      await fs.unlink(filePath).catch(() => {});
      return res.status(500).json({
        success: false,
        message: 'Chưa cấu hình GEMINI_API_KEY trên server (Render).'
      });
    }

    const questions = await processSingleFile(filePath, mimetype, originalname, geminiKey);

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

    // Kiểm tra lỗi Claude trước
    if (/ANTHROPIC|claude|Claude/i.test(msg) || msg.includes('ANTHROPIC_API_KEY')) {
      const errorInfo = classifyClaudeError(msg);
      res.status(502).json({
        success: false,
        message: `[${errorInfo.category}] ${errorInfo.suggestion}`
      });
      return;
    }

    const is503 = /503|Service Unavailable|high demand|temporarily unavailable/i.test(msg);
    const isGeminiFetch = /GoogleGenerativeAI|fetching from|API key|API_KEY|401|403|404/i.test(msg);
    const status = is503 || isGeminiFetch ? 502 : 500;
    const clientMsg = is503
      ? 'AI đang quá tải (503). Vui lòng chờ 1–2 phút rồi thử lại.'
      : isGeminiFetch
      ? 'Dịch vụ AI tạm thời lỗi hoặc cấu hình API chưa đúng trên server. Kiểm tra GEMINI_API_KEY hoặc ANTHROPIC_API_KEY trên Render.'
      : msg || 'AI import failed';
    res.status(status).json({ success: false, message: clientMsg });
  }
});

/** Xử lý nhiều ảnh — gộp mỗi N ảnh vào 1 request Gemini để tiết kiệm quota
 * Không dùng Claude vì free-tier quota quá thấp cho batch */
router.post('/import-batch', aiUploadArrayMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user || req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can use AI import' });
    }
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const geminiKey = getGeminiKeyFromEnv() ?? '';
    if (!geminiKey) {
      await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
      return res.status(500).json({
        success: false,
        message: 'Chưa cấu hình GEMINI_API_KEY trên server (Render).'
      });
    }

    console.log(
      `[AI Import Batch] ${files.length} files (GEMINI: true), batch size: ${IMAGES_PER_BATCH}`
    );
    const allQuestions: GeminiQuestion[] = [];
    const errors: { file: string; message: string }[] = [];

    // Tách riêng ảnh vs non-image (PDF/DOCX)
    const imageFiles: Express.Multer.File[] = [];
    const nonImageFiles: Express.Multer.File[] = [];
    for (const file of files) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(file.originalname) ||
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        imageFiles.push(file);
      } else {
        nonImageFiles.push(file);
      }
    }

    // ── Xử lý ảnh: gộp N ảnh/request ──
    for (let i = 0; i < imageFiles.length; i += IMAGES_PER_BATCH) {
      const batch = imageFiles.slice(i, i + IMAGES_PER_BATCH);
      const batchIdx = Math.floor(i / IMAGES_PER_BATCH) + 1;

      const images = await Promise.all(batch.map(async f => ({
        imageData: await fs.readFile(f.path),
        originalname: f.originalname,
        mimeStr: (['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype)
          ? f.mimetype
          : `image/${path.extname(f.originalname).slice(1)}`) as string,
      })));

      try {
        const results = await processBatchImagesWithGemini(images, batchIdx, geminiKey);
        for (const { originalname, questions } of results) {
          if (questions.length > 0) {
            allQuestions.push(...questions);
            console.log(`[AI Import Batch] ${originalname}: ${questions.length} questions`);
          } else {
            errors.push({ file: originalname, message: 'No questions extracted from image' });
          }
        }
      } catch (batchErr: unknown) {
        const batchMsg = batchErr instanceof Error ? batchErr.message : String(batchErr);
        console.error(`[AI Import Batch] Gemini batch ${batchIdx} failed:`, batchMsg);
        for (const file of batch) {
          errors.push({ file: file.originalname, message: `[Gemini batch error] ${batchMsg}` });
        }
      } finally {
        await Promise.all(batch.map(f => fs.unlink(f.path).catch(() => {})));
      }
    }

    // ── Non-image (PDF/DOCX): Gemini Flash text ──
    for (const file of nonImageFiles) {
      try {
        const qs = await processSingleFile(file.path, file.mimetype, file.originalname, geminiKey);
        allQuestions.push(...qs);
        console.log(`[AI Import Batch] ${file.originalname}: ${qs.length} questions`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ file: file.originalname, message: msg });
        console.error(`[AI Import Batch] ${file.originalname} failed:`, msg);
      } finally {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    if (allQuestions.length === 0) {
      const errorSummary = errors.map(e => `${e.file}: ${e.message}`).join(' | ');
      const errorMsg = errors.length > 0
        ? `Khong trích xuất duoc cau hoi tu ${errors.length} file. Chi tiet: ${errorSummary}`
        : 'No questions could be extracted.';
      return res.status(422).json({
        success: false,
        message: errorMsg,
        filesProcessed: files.length,
        filesWithErrors: errors.length,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    // Partial success - some questions extracted, some files failed
    if (errors.length > 0) {
      console.log(`[AI Import Batch] Partial success: ${allQuestions.length} questions from ${files.length - errors.length} files, ${errors.length} files failed`);
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

    // Kiểm tra lỗi Claude trước
    if (/ANTHROPIC|claude|Claude/i.test(msg) || msg.includes('ANTHROPIC_API_KEY')) {
      const errorInfo = classifyClaudeError(msg);
      res.status(502).json({
        success: false,
        message: `[${errorInfo.category}] ${errorInfo.suggestion}`
      });
      return;
    }

    const is503 = /503|Service Unavailable|high demand/i.test(msg);
    const isGeminiFetch = /GoogleGenerativeAI|API key|401|403|404/i.test(msg);
    const status = is503 || isGeminiFetch ? 502 : 500;
    const clientMsg = is503
      ? 'AI đang quá tải (503). Vui lòng chờ 1–2 phút rồi thử lại.'
      : isGeminiFetch
      ? 'Dịch vụ AI tạm thời lỗi. Kiểm tra API keys trên Render.'
      : msg || 'Batch import failed';
    res.status(status).json({ success: false, message: clientMsg });
  }
});

/** Tách logic xử lý 1 file thành hàm riêng — dùng chung cho /import và /import-batch
 * Ưu tiên dùng Claude Vision (ANTHROPIC_API_KEY), fallback sang Gemini */
async function processSingleFile(
  filePath: string,
  mimetype: string,
  originalname: string,
  geminiKey: string
): Promise<GeminiQuestion[]> {
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(originalname) ||
    ['image/jpeg', 'image/png', 'image/webp'].includes(mimetype);

  if (isImage) {
    const imageData = await fs.readFile(filePath);
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.webp': 'image/webp',
    };
    const mimeStr = mimeMap[path.extname(originalname).toLowerCase()] || mimetype;

    // Ưu tiên Claude Vision nếu có API key
    if (ANTHROPIC_API_KEY) {
      try {
        return await processImageWithClaude(imageData, originalname, mimeStr);
      } catch (claudeErr: unknown) {
        const claudeMsg = claudeErr instanceof Error ? claudeErr.message : String(claudeErr);
        const isCreditExhausted =
          claudeMsg.includes('400') ||
          /credit balance|too low|plans & billing|upgrade.*purchase/i.test(claudeMsg) ||
          claudeMsg.includes('invalid_request_error');

        console.warn(
          isCreditExhausted
            ? `[AI Import] Claude hết credit cho ${originalname}: ${claudeMsg}`
            : `[AI Import] Claude Vision thất bại cho ${originalname}: ${claudeMsg}`
        );

        // Fallback sang Gemini nếu có key
        if (geminiKey) {
          console.log(`[AI Import] Fallback sang Gemini Vision cho ${originalname}`);
          try {
            return await processImageWithGemini(imageData, originalname, mimeStr, geminiKey);
          } catch (geminiErr: unknown) {
            const geminiMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
            console.error(`[AI Import] Gemini Vision cũng thất bại cho ${originalname}: ${geminiMsg}`);
            throw claudeErr; // Trả về lỗi Claude gốc
          }
        }
        throw claudeErr;
      }
    }

    // Không có Claude → dùng Gemini trực tiếp
    if (!geminiKey) {
      throw new Error('Không có AI provider nào được cấu hình (ANTHROPIC_API_KEY hoặc GEMINI_API_KEY)');
    }
    return await processImageWithGemini(imageData, originalname, mimeStr, geminiKey);
  }

  // Text / PDF / DOCX - ưu tiên Claude, fallback Gemini
  let extractedText: string;
  try {
    extractedText = await extractTextFromFile(filePath, mimetype, originalname);
  } catch (extractErr: unknown) {
    const msg = extractErr instanceof Error ? extractErr.message : String(extractErr);
    throw new Error(`Không đọc được file: ${msg}`);
  }

  // Nếu là file path (ảnh), xử lý bằng vision
  if (!extractedText.includes('\x00') && !extractedText.match(/^[A-Za-z0-9+/=\s]+$/)) {
    // Đây là text thực sự
  }

  // Ưu tiên Claude cho text
  if (ANTHROPIC_API_KEY) {
    try {
      return await processTextWithClaude(extractedText, originalname);
    } catch (claudeErr: unknown) {
      const claudeMsg = claudeErr instanceof Error ? claudeErr.message : String(claudeErr);
      const isCreditExhausted =
        claudeMsg.includes('400') ||
        /credit balance|too low|plans & billing|upgrade.*purchase/i.test(claudeMsg) ||
        claudeMsg.includes('invalid_request_error');

      console.warn(
        isCreditExhausted
          ? `[AI Import] Claude hết credit cho ${originalname}: ${claudeMsg}`
          : `[AI Import] Claude text processing thất bại cho ${originalname}: ${claudeMsg}`
      );

      if (geminiKey) {
        console.log(`[AI Import] Fallback sang Gemini cho ${originalname}`);
        try {
          return await processTextWithGemini(extractedText, originalname, geminiKey);
        } catch (geminiErr: unknown) {
          const geminiMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          console.error(`[AI Import] Gemini cũng thất bại cho ${originalname}: ${geminiMsg}`);
          throw claudeErr;
        }
      }
      throw claudeErr;
    }
  }

  // Không có Claude → dùng Gemini trực tiếp
  if (!geminiKey) {
    throw new Error('Không có AI provider nào được cấu hình (ANTHROPIC_API_KEY hoặc GEMINI_API_KEY)');
  }
  return await processTextWithGemini(extractedText, originalname, geminiKey);
}

/** Xử lý ảnh bằng Gemini Vision */
async function processImageWithGemini(
  imageData: Buffer,
  originalname: string,
  mimeStr: string,
  GEMINI_KEY: string
): Promise<GeminiQuestion[]> {
  if (shouldGeminiBeSkipped()) {
    const resetIn = Math.ceil((dailyResetTime.getTime() - Date.now()) / 1000);
    throw new Error(
      `[RateLimit] Gemini quota đã hết (${MAX_GEMINI_REQUESTS_PER_DAY}/${MAX_GEMINI_REQUESTS_PER_DAY}). ` +
      `Reset tự động trong ${Math.floor(resetIn / 3600)}h ${Math.floor((resetIn % 3600) / 60)}m.`
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = getGeminiModel(genAI);

  const prompt = `You are a teacher-exam question extractor. Given this image of exam questions, extract ALL multiple-choice questions and return ONLY a valid JSON array.

Each question: { "question": "text", "type": "multiple-choice", "options": ["A text","B text","C text","D text"], "correctAnswer": "0|1|2|3", "points": 1, "explanation": "" }.
Map A→0, B→1, C→2, D→3. Return ONLY JSON, no explanation.`;

  console.log('[AI Import] calling Gemini Vision for:', originalname);
  const result = await geminiWithRetry(
    () => model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: mimeStr, data: imageData.toString('base64') } },
    ]),
    'Gemini Vision'
  );

  recordGeminiRequest();

  const rawText = readGeminiText(result).trim();
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      const validQuestions = parsed.filter((q: any) => q.question && q.question.trim().length > 0);
      if (validQuestions.length === 0 && parsed.length > 0) {
        console.warn(`[AI Import] File ${originalname}: AI trả về ${parsed.length} câu hỏi nhưng đều rỗng`);
      }
      return validQuestions.map((q: any) => ({
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
  } catch (parseErr: unknown) {
    const parseMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error(`[AI Import] JSON parse error for ${originalname}:`, parseMsg);
    const questionsFromText = extractQuestionsFromRawText(rawText, originalname);
    if (questionsFromText.length > 0) {
      console.log(`[AI Import] Fallback: extracted ${questionsFromText.length} questions from raw text`);
      return questionsFromText;
    }
  }
  console.warn(`[AI Import] Không trích xuất được câu hỏi từ ${originalname}`);
  return [];
}

/** Xử lý text bằng Gemini */
async function processTextWithGemini(
  extractedText: string,
  originalname: string,
  GEMINI_KEY: string
): Promise<GeminiQuestion[]> {
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