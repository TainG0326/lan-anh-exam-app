import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Key, Clock, AlertTriangle, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Lock, Eye, EyeOff, RefreshCw,
  Monitor, LogOut, FileText, User, Eye as ViewIcon
} from 'lucide-react';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface Question {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'fill-blank' | 'reading-comprehension';
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface ExamData {
  id: string;
  title: string;
  description?: string;
  exam_code: string;
  questions: Question[];
  startTime: string;
  endTime: string;
  duration: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  requireWebcam: boolean;
  status: string;
  isLockdownRequired: boolean;
}

interface ViolationRecord {
  type: 'blur' | 'clipboard' | 'shortcut' | 'right-click' | 'focus-loss' | 'tab-switch';
  timestamp: string;
  details: string;
  count: number;
}

type Screen = 'login' | 'access-key' | 'instructions' | 'exam' | 'submitting' | 'result' | 'emergency-exit';

// ============================================================
// BEK HASH (Browser Exam Key) - client-side generation
// ============================================================

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateBEKHash(url: string, examId: string): Promise<string> {
  // Server uses req.originalUrl which includes /api prefix
  const fullUrl = url.startsWith('/api') ? url : `/api${url}`;
  const EXAM_SECRET_KEY = 'exam-lockdown-secret-key';
  const hashInput = `${fullUrl}${EXAM_SECRET_KEY}${examId}`;
  return sha256(hashInput);
}

// ============================================================
// API SERVICE
// ============================================================

const API_BASE = 'https://english-exam-api-oksd.onrender.com/api';

async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  examId?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  // Add BEK hash for exam-taking endpoints
  const bekRequiredPaths = ['/exams/start', '/exams/submit-answer', '/exams/submit', '/exams/violation'];
  const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  if (examId && bekRequiredPaths.some(path => fullEndpoint.includes(path))) {
    const bek = await generateBEKHash(endpoint, examId);
    headers['x-lockdown-hash'] = bek;
    headers['x-lockdown-client'] = 'desktop-app';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================
// DESKTOP APP API (via preload)
// ============================================================

declare global {
  interface Window {
    lockdown?: {
      activate: () => Promise<{ success: boolean }>;
      deactivate: () => Promise<{ success: boolean }>;
      isActive: () => Promise<{ active: boolean }>;
      verifyMasterPassword: (password: string) => Promise<{ success: boolean }>;
      emergencyExit: () => Promise<{ success: boolean }>;
      onLockdownStatus: (callback: (data: { active: boolean }) => void) => () => void;
      onShortcutBlocked: (callback: (data: { shortcut: string }) => void) => () => void;
      onViolationRecorded: (callback: (data: any) => void) => () => void;
      onEmergencyExitRequested: (callback: () => void) => () => void;
    };
    exam?: {
      recordViolation: (violation: { type: string; details: string }) => Promise<{ success: boolean }>;
      setExamId: (examId: string) => Promise<{ success: boolean }>;
    };
    app?: {
      getInfo: () => Promise<{ version: string; platform: string; isLockdown: boolean }>;
    };
  }
}

// ============================================================
// SCREEN: LOGIN (Student auth for desktop app)
// ============================================================

function LoginScreen({ onLogin }: { onLogin: (token: string, userId: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (result.success && result.token) {
        onLogin(result.token, result.user?.id || '');
      } else {
        setError(result.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Kết nối thất bại. Kiểm tra internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Exam Lockdown Browser</h1>
          <p className="text-slate-400 text-sm">Lan Anh English - Đăng nhập học sinh</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Đăng nhập</h2>
              <p className="text-xs text-slate-400">Xác minh danh tính học sinh</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Đăng nhập & Tiếp tục
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200 leading-relaxed">
                <strong>Lưu ý:</strong> Đây là thiết bị thi chính thức. Mọi hành vi gian lận sẽ được ghi nhận và báo cáo cho giáo viên.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN: ACCESS KEY
// ============================================================

function AccessKeyScreen({ token, userId, onVerified }: {
  token: string;
  userId: string;
  onVerified: (exam: ExamData, attemptId: string) => void;
}) {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setError('Vui lòng nhập mã truy cập');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Verify access key (public endpoint - returns exam info only)
      const verifyResult = await apiRequest('/exams/public/verify', {
        method: 'POST',
        body: JSON.stringify({ access_key: accessKey.trim() }),
      });

      if (!verifyResult.success) {
        setError(verifyResult.message || 'Mã truy cập không hợp lệ');
        setLoading(false);
        return;
      }

      const examInfo = verifyResult.data;

      // Step 2: Start exam (authenticated + BEK - creates attempt + returns questions)
      const startResult = await apiRequest('/exams/start', {
        method: 'POST',
        body: JSON.stringify({ examId: examInfo.exam_id }),
      }, token, examInfo.exam_id);

      if (!startResult.success) {
        setError(startResult.message || 'Không thể bắt đầu bài thi');
        setLoading(false);
        return;
      }

      const examData: ExamData = {
        id: examInfo.exam_id,
        title: startResult.data.exam.title,
        description: startResult.data.exam.description,
        exam_code: '',
        questions: startResult.data.exam.questions.map((q: any, idx: number) => ({
          ...q,
          _id: q._id || `q_${idx}`,
          correctAnswer: q.correctAnswer || '',
        })),
        startTime: examInfo.start_time,
        endTime: examInfo.end_time,
        duration: startResult.data.exam.duration,
        totalPoints: startResult.data.exam.total_points || startResult.data.exam.duration,
        shuffleQuestions: startResult.data.exam.shuffle_questions,
        shuffleOptions: startResult.data.exam.shuffle_options,
        requireWebcam: examInfo.require_webcam,
        status: 'active',
        isLockdownRequired: examInfo.is_lockdown_required,
      };

      onVerified(examData, startResult.data.attemptId);
    } catch (err: any) {
      setError(err.message || 'Kết nối thất bại. Kiểm tra internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Exam Lockdown Browser</h1>
          <p className="text-slate-400 text-sm">Lan Anh English</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Nhập Mã Truy Cập</h2>
              <p className="text-xs text-slate-400">Giáo viên sẽ cung cấp mã cho bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">
                Mã truy cập (Access Key)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                  placeholder="VD: ABC123XY"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Xác nhận & Bắt đầu thi
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200 leading-relaxed">
                <strong>Lưu ý:</strong> Khi bắt đầu thi, ứng dụng sẽ chuyển sang chế độ khóa màn hình.
                Không được phép thoát ra ngoài, copy/paste, hay sử dụng phím tắt hệ thống.
                Mọi hành vi gian lận sẽ được ghi nhận.
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Văn bản sẽ được chọn tự động. Đây là thiết bị thi chính thức.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN: INSTRUCTIONS
// ============================================================

function InstructionsScreen({
  exam,
  onStart,
  onCancel,
}: {
  exam: ExamData;
  onStart: () => void;
  onCancel: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const totalQuestions = exam.questions?.length || 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{exam.title}</h1>
          {exam.description && (
            <p className="text-slate-400 text-sm">{exam.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Câu hỏi</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalQuestions}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Thời gian</span>
            </div>
            <p className="text-2xl font-bold text-white">{exam.duration} phút</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Tổng điểm</span>
            </div>
            <p className="text-2xl font-bold text-white">{exam.totalPoints || exam.duration}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Monitor className="w-5 h-5 text-primary" />
              <span className="text-xs text-slate-400 uppercase tracking-wide">Chế độ</span>
            </div>
            <p className="text-lg font-bold text-white">Khóa màn hình</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Quy định khi thi
          </h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              Không được phép thoát khỏi ứng dụng trong suốt thời gian thi
            </li>
            <li className="flex items-start gap-3">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              Không được copy, cut, paste trong ứng dụng
            </li>
            <li className="flex items-start gap-3">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              Không được chuyển tab trình duyệt hoặc mở ứng dụng khác
            </li>
            <li className="flex items-start gap-3">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              Không được chụp màn hình hoặc ghi hình
            </li>
            <li className="flex items-start gap-3">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              Mọi hành vi vi phạm sẽ được ghi nhận và báo cáo cho giáo viên
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              Có thể điều hướng giữa các câu hỏi và thay đổi câu trả lời
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              Bài thi sẽ tự động nộp khi hết thời gian
            </li>
          </ul>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-white/30 bg-white/10 text-primary focus:ring-primary accent-primary"
            />
            <span className="text-sm text-slate-300 leading-relaxed">
              Tôi đã đọc và đồng ý tuân thủ các quy định khi thi. Tôi hiểu rằng
              mọi hành vi gian lận sẽ bị ghi nhận và xử lý theo quy định.
            </span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Quay lại
          </button>
          <button
            onClick={onStart}
            disabled={!agreed}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5" />
            Bắt đầu thi
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN: EXAM
// ============================================================

function ExamScreen({
  exam,
  attemptId,
  token,
  onSubmit,
  onViolation,
}: {
  exam: ExamData;
  attemptId: string;
  token: string;
  onSubmit: (answers: Record<string, string>) => void;
  onViolation: (v: ViolationRecord) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = exam.questions || [];
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitExam = useCallback(() => {
    for (const v of violations) {
      window.exam?.recordViolation({ type: v.type, details: v.details });
    }
    onSubmit(answers);
  }, [answers, violations, onSubmit]);

  // Focus/blur detection
  useEffect(() => {
    const handleBlur = () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setWarningCount((c) => {
          const newCount = c + 1;
          const violation: ViolationRecord = {
            type: 'blur',
            timestamp: new Date().toISOString(),
            details: 'Window lost focus',
            count: newCount,
          };
          setViolations((prev) => [...prev, violation]);
          onViolation(violation);
          window.exam?.recordViolation({
            type: 'blur',
            details: `Warning #${newCount}: Window focus lost`,
          });
          return newCount;
        });
      }, 1000);
    };

    const handleFocus = () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const violation: ViolationRecord = {
        type: 'right-click',
        timestamp: new Date().toISOString(),
        details: 'Right-click blocked',
        count: 1,
      };
      setViolations((prev) => [...prev, violation]);
      onViolation(violation);
      window.exam?.recordViolation({ type: 'right-click', details: 'Right-click blocked' });
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation: ViolationRecord = {
        type: 'clipboard',
        timestamp: new Date().toISOString(),
        details: 'Copy blocked',
        count: 1,
      };
      setViolations((prev) => [...prev, violation]);
      onViolation(violation);
      window.exam?.recordViolation({ type: 'clipboard', details: 'Copy blocked' });
    };

    const handleCut = (e: ClipboardEvent) => { e.preventDefault(); };
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);

    window.lockdown?.onShortcutBlocked((data) => {
      const violation: ViolationRecord = {
        type: 'shortcut',
        timestamp: new Date().toISOString(),
        details: `Blocked: ${data.shortcut}`,
        count: 1,
      };
      setViolations((prev) => [...prev, violation]);
      onViolation(violation);
      window.exam?.recordViolation({ type: 'shortcut', details: `Blocked: ${data.shortcut}` });
    });

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, [onViolation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerClass = timeLeft <= 60 ? 'timer-danger' : timeLeft <= 300 ? 'timer-warning' : 'text-white';

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ._id]: value }));
  };

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Không có câu hỏi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-sm font-semibold text-white truncate max-w-xs">{exam.title}</h1>
          </div>
          <div className={`flex items-center gap-2 text-xl font-mono font-bold ${timerClass}`}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              <span className="text-white font-semibold">{answeredCount}</span>/{questions.length}
            </span>
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
          {violations.length > 0 && (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{violations.length} vi phạm</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full p-6 gap-6">
        <div className="flex-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {currentIndex + 1}
                </span>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    {currentQ.type === 'multiple-choice' ? 'Trắc nghiệm' : currentQ.type === 'fill-blank' ? 'Điền trống' : 'Đọc hiểu'}
                  </p>
                  <p className="text-sm text-slate-400">{currentQ.points} điểm</p>
                </div>
              </div>
              {answers[currentQ._id] && (
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                  <CheckCircle className="w-3 h-3" />
                  Đã trả lời
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold text-white mb-8 leading-relaxed">
              {currentQ.question}
            </h2>

            {currentQ.type === 'multiple-choice' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = answers[currentQ._id] === idx.toString();
                  const label = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx.toString())}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/20 text-white'
                          : 'border-white/20 bg-white/5 text-slate-300 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-white/10'
                      }`}>{label}</span>
                      <span className="flex-1">{option}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === 'fill-blank' && (
              <input
                type="text"
                value={answers[currentQ._id] || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Nhập câu trả lời..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Câu trước
            </button>
            <span className="text-sm text-slate-400">
              Câu {currentIndex + 1} / {questions.length}
            </span>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-all"
              >
                Câu tiếp
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                Nộp bài
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="w-64 shrink-0">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sticky top-24">
            <h3 className="text-sm font-semibold text-white mb-4">Điều hướng</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q._id];
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                      isCurrent
                        ? 'bg-primary text-white ring-2 ring-primary/50'
                        : isAnswered
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/10 text-slate-400 hover:bg-white/20'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-primary" />
                <span>Hiện tại</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-white/10" />
                <span>Chưa trả lời</span>
              </div>
            </div>
            <button
              onClick={handleSubmitExam}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              Nộp bài thi
            </button>
          </div>
        </div>
      </div>

      {showWarning && (
        <div className="lockdown-overlay">
          <div className="bg-slate-800 rounded-2xl border border-amber-500/50 p-8 max-w-md text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Cảnh báo!</h2>
            <p className="text-slate-300 mb-2">
              Bạn đã rời khỏi cửa sổ thi lần <strong className="text-amber-400">{warningCount}</strong>.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Hành vi này đã được ghi nhận. Tiếp tục vi phạm sẽ bị báo cáo cho giáo viên.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all"
            >
              Tôi đã hiểu - Quay lại thi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SCREEN: SUBMITTING
// ============================================================

function SubmittingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Đang nộp bài thi...</h2>
        <p className="text-slate-400">Vui lòng không tắt ứng dụng</p>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN: RESULT
// ============================================================

function ResultScreen({ score, total, examTitle, onClose }: {
  score: number;
  total: number;
  examTitle: string;
  onClose: () => void;
}) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 50;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
          passed ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          {passed ? (
            <CheckCircle className="w-12 h-12 text-green-400" />
          ) : (
            <XCircle className="w-12 h-12 text-red-400" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {passed ? 'Chúc mừng!' : 'Chưa đạt'}
        </h1>
        <p className="text-slate-400 mb-8">{examTitle}</p>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Kết quả</p>
          <p className="text-5xl font-bold text-white mb-2">{score} / {total}</p>
          <p className={`text-lg font-semibold ${passed ? 'text-green-400' : 'text-red-400'}`}>
            {percentage}%
          </p>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          {passed
            ? 'Bạn đã vượt qua bài thi. Kết quả sẽ được gửi đến giáo viên.'
            : 'Bạn chưa đạt yêu cầu. Vui lòng liên hệ giáo viên.'}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
        >
          Đóng ứng dụng
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN: EMERGENCY EXIT
// ============================================================

function EmergencyExitScreen({ onVerify, onCancel }: {
  onVerify: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await window.lockdown?.verifyMasterPassword(password);
      if (result?.success) {
        onVerify();
      } else {
        setError('Mật khẩu không đúng');
      }
    } catch {
      setError('Lỗi xác minh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Thoát khẩn cấp</h1>
          <p className="text-sm text-slate-400">Yêu cầu mật khẩu Master từ giáo viên</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Đang xác minh...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [exam, setExam] = useState<ExamData | null>(null);
  const [attemptId, setAttemptId] = useState('');
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    if (screen === 'exam' && exam) {
      window.lockdown?.activate();
      window.exam?.setExamId(exam.id);
    }
  }, [screen, exam]);

  useEffect(() => {
    window.lockdown?.onEmergencyExitRequested(() => {
      setScreen('emergency-exit');
    });
  }, []);

  const handleLogin = (authToken: string, uid: string) => {
    setToken(authToken);
    setUserId(uid);
    setScreen('access-key');
  };

  const handleExamVerified = (examData: ExamData, attempt: string) => {
    setExam(examData);
    setAttemptId(attempt);
    setScreen('instructions');
  };

  const handleStartExam = () => {
    setScreen('exam');
  };

  const handleCancelInstructions = () => {
    window.lockdown?.deactivate();
    setExam(null);
    setAttemptId('');
    setScreen('access-key');
  };

  const handleSubmitExam = async (finalAnswers: Record<string, string>) => {
    setScreen('submitting');

    try {
      const response = await apiRequest('/exams/submit', {
        method: 'POST',
        body: JSON.stringify({ attemptId }),
      }, token, exam?.id);

      setResult({
        score: response.data?.score || 0,
        total: response.data?.totalPoints || exam?.totalPoints || 0,
      });

      window.lockdown?.deactivate();
      setScreen('result');
    } catch {
      window.lockdown?.deactivate();
      setResult({ score: 0, total: exam?.totalPoints || 0 });
      setScreen('result');
    }
  };

  const handleViolation = (_v: ViolationRecord) => {
    // Already recorded in ExamScreen
  };

  const handleEmergencyVerify = () => {
    window.lockdown?.deactivate();
    window.close();
  };

  return (
    <div className="min-h-screen">
      {screen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {screen === 'access-key' && token && userId && (
        <AccessKeyScreen token={token} userId={userId} onVerified={handleExamVerified} />
      )}

      {screen === 'instructions' && exam && (
        <InstructionsScreen
          exam={exam}
          onStart={handleStartExam}
          onCancel={handleCancelInstructions}
        />
      )}

      {screen === 'exam' && exam && (
        <ExamScreen
          exam={exam}
          attemptId={attemptId}
          token={token}
          onSubmit={handleSubmitExam}
          onViolation={handleViolation}
        />
      )}

      {screen === 'submitting' && <SubmittingScreen />}

      {screen === 'result' && result && exam && (
        <ResultScreen
          score={result.score}
          total={result.total}
          examTitle={exam.title}
          onClose={() => window.close()}
        />
      )}

      {screen === 'emergency-exit' && (
        <EmergencyExitScreen
          onVerify={handleEmergencyVerify}
          onCancel={() => setScreen('exam')}
        />
      )}
    </div>
  );
}
