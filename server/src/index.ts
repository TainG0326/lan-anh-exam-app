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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow all origins for development
const corsOptions = {
  origin: function (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost ports for development (3001 for teacher-web, 3002 for student-web)
    if (
      origin === 'http://localhost:3001' ||
      origin === 'http://localhost:3002' ||
      origin === 'http://localhost:5173' ||
      origin === 'http://localhost:5174' ||
      origin.startsWith('http://localhost:')
    ) {
      return callback(null, true);
    }

    // Allow Vercel preview/production URLs
    if (origin.includes('vercel.app') || origin.includes('teacher-web') || origin.includes('student-web')) {
      return callback(null, true);
    }

    // For development, allow all
    callback(null, true);
  },
  credentials: true, // Allow cookies
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
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/question-parser', questionParserRoutes);
app.use('/api/exams', examRoutes);

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

// Start server
const startServer = async () => {
  try {
    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.warn('⚠️  Supabase connection failed, but server will continue...');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
