import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

function parseListenPort(): number {
  const raw = process.env.PORT;
  if (raw === undefined || raw === '') return 5000;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    console.error('[PORT] Giá trị không hợp lệ:', raw, '→ dùng 5000');
    return 5000;
  }
  return n;
}

const PORT = parseListenPort();

/**
 * CORS: teacher-web / student-web trên Vercel + localhost.
 * Dùng origin: true (phản chiếu Origin) + credentials — tránh lỗi preflight thiếu ACAO khi whitelist lệch ký tự / bản deploy cũ.
 * Chỉ cho phép origin hợp lệ (localhost, *.vercel.app, danh sách cố định).
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const fixed = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://teacher-web-rose.vercel.app',
    'https://student-web-xi.vercel.app',
  ];
  if (fixed.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith('.vercel.app')) return true;
  } catch {
    /* ignore */
  }
  return false;
}

const corsOptions: cors.CorsOptions = {
  origin(origin: string | undefined, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Access-Token',
    'Cookie',
    'Origin',
    'Accept',
    'Accept-Language',
    'X-Requested-With',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/** Probe Render / Cloudflare — không import DB/Supabase để luôn có TCP listen (tránh 521 khi env thiếu). */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'English Exam API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      classes: '/api/classes',
      assignments: '/api/assignments',
      'question-parser': '/api/question-parser',
      exams: '/api/exams',
      ai: '/api/ai',
      notifications: '/api/notifications',
    },
  });
});

async function mountApiRoutes(): Promise<void> {
  const [
    { default: authRoutes },
    { default: classRoutes },
    { default: assignmentRoutes },
    { default: questionParserRoutes },
    { default: examRoutes },
    { default: aiImportRoutes },
    { default: notificationRoutes },
  ] = await Promise.all([
    import('./routes/authRoutes.js'),
    import('./routes/classRoutes.js'),
    import('./routes/assignmentRoutes.js'),
    import('./routes/questionParserRoutes.js'),
    import('./routes/examRoutes.js'),
    import('./routes/aiImportRoutes.js'),
    import('./routes/notificationRoutes.js'),
  ]);

  app.use('/api/auth', authRoutes);
  app.use('/api/classes', classRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/question-parser', questionParserRoutes);
  app.use('/api/exams', examRoutes);
  app.use('/api/ai', aiImportRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

async function startServer(): Promise<void> {
  console.log('🚀 Starting server — binding', PORT, 'on 0.0.0.0');
  await new Promise<void>((resolve, reject) => {
    try {
      const server = app.listen(PORT, '0.0.0.0', () => resolve());
      server.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
  console.log(`✅ TCP listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);

  try {
    await mountApiRoutes();
    console.log('✅ API routes đã gắn xong');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('❌ Không load được API (thường do thiếu SUPABASE_* trên Render):', msg);
    app.use('/api', (_req: Request, res: Response) => {
      res.status(503).json({
        success: false,
        message:
          'API chưa sẵn sàng: kiểm tra biến môi trường SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY (hoặc SUPABASE_ANON_KEY) trên Render.',
        detail: process.env.NODE_ENV === 'development' ? msg : undefined,
      });
    });
    app.use((req: Request, res: Response) => {
      if (req.path.startsWith('/api')) return;
      res.status(404).json({ message: 'Route not found' });
    });
  }
}

startServer().catch((e) => {
  console.error('❌ startServer failed:', e);
  process.exit(1);
});
