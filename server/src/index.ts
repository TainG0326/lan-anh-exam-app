import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/supabase.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import questionParserRoutes from './routes/questionParserRoutes.js';
import examRoutes from './routes/examRoutes.js';
import aiImportRoutes from './routes/aiImportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration — allow all origins for development + all Vercel production URLs
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://localhost:5174',
  /\.vercel\.app$/,
  /\.vercel\.app\/(.*)/,
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Check against regex patterns
    const allowed = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : origin === o
    );
    if (allowed) return callback(null, true);

    // Fallback: allow any vercel.app domain
    if (origin.includes('.vercel.app')) return callback(null, true);

    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Origin', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for HttpOnly cookies
app.use(cookieParser());

// Serve static files (avatars)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/question-parser', questionParserRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/ai', aiImportRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server — skip Supabase connection check; Vercel cold starts need fast startup
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
