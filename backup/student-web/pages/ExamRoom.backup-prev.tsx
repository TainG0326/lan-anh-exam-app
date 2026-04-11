import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, AlertTriangle, Eye, EyeOff, Camera, Monitor, 
  Shield, XCircle, CheckCircle, Copy, Clipboard,
  ChevronLeft, ChevronRight, Flag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getExamByCode, 
  startExam, 
  submitExam, 
  submitAnswer,
  logViolation,
  updateWebcamStatus,
  updateFullscreenStatus,
  getRemainingTime,
  autoSubmitExam,
  getExamProctoringSettings
} from '../services/examService';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  points: number;
  correctAnswer?: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  total_points: number;
  require_webcam?: boolean;
  auto_submit?: boolean;
  block_copy_paste?: boolean;
  block_right_click?: boolean;
  block_tab_switch?: boolean;
  require_fullscreen?: boolean;
  capture_webcam_interval?: number;
}

interface ExamSettings {
  requireWebcam: boolean;
  autoSubmit: boolean;
  blockCopyPaste: boolean;
  blockRightClick: boolean;
  blockTabSwitch: boolean;
  requireFullscreen: boolean;
  captureWebcamInterval: number;
  maxViolations: number;
}

interface StartExamResponse {
  success: boolean;
  attemptId: string;
  attempt?: {
    answers: Record<string, any>;
  };
  exam?: Exam;
}

interface TimeResponse {
  success: boolean;
  remainingTime: number;
  endTime: string;
  submitted?: boolean;
}

export default function ExamRoom() {
  const { examCode } = useParams<{ examCode: string }>();
  const navigate = useNavigate();
  
  // State
  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [settings, setSettings] = useState<ExamSettings | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Proctoring state
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showWebcamPreview, setShowWebcamPreview] = useState(true);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const webcamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load exam and initialize
  useEffect(() => {
    if (examCode) {
      initializeExam();
    }
    return () => {
      cleanup();
    };
  }, [examCode]);

  // Initialize proctoring when exam loaded
  useEffect(() => {
    if (exam && attemptId) {
      initializeProctoring();
    }
  }, [exam, attemptId]);

  // Timer
  useEffect(() => {
    if (exam && attemptId && !submitted) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [exam, attemptId, submitted]);

  // Anti-cheating event listeners
  useEffect(() => {
    if (!settings || submitted) return;

    const handleEvents = () => {
      // Block right click
      if (settings.blockRightClick) {
        document.addEventListener('contextmenu', preventDefault);
      }
      
      // Block copy/paste
      if (settings.blockCopyPaste) {
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);
      }
      
      // Detect tab switch
      if (settings.blockTabSwitch) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
      }
    };

    const preventDefault = (e: Event) => {
      e.preventDefault();
      recordViolation('block_action', `Blocked: ${e.type}`);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', 'Student left the exam tab');
      }
    };

    const handleWindowBlur = () => {
      recordViolation('window_blur', 'Student left the exam window');
    };

    handleEvents();

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [settings, submitted]);

  const initializeExam = async () => {
    try {
      setLoading(true);
      
      // Get exam settings first
      const settingsData = await getExamProctoringSettings(examCode!);
      setSettings(settingsData.settings || {
        requireWebcam: true,
        autoSubmit: true,
        blockCopyPaste: true,
        blockRightClick: true,
        blockTabSwitch: true,
        requireFullscreen: true,
        captureWebcamInterval: 30,
        maxViolations: 5
      });

      // Get exam details
      const examData = await getExamByCode(examCode!);
      setExam(examData as unknown as Exam);

      // Start the exam
      const startData = await startExam(examData.id || examData._id || examCode!) as unknown as StartExamResponse;
      setAttemptId(startData.attemptId);
      setAnswers(startData.attempt?.answers || {});
      
      // Request fullscreen if required
      if (settingsData.settings?.requireFullscreen) {
        requestFullscreen();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load exam');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const initializeProctoring = async () => {
    if (!settings) return;

    // Initialize webcam
    if (settings.requireWebcam) {
      await initWebcam();
    }

    // Log exam start
    await logViolation(attemptId, {
      type: 'exam_start',
      description: 'Student started the exam',
      severity: 1
    });
  };

  const initWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 320, height: 240 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamActive(true);
      
      // Capture photos periodically
      if (settings?.captureWebcamInterval) {
        webcamIntervalRef.current = setInterval(() => {
          captureWebcamPhoto();
        }, settings.captureWebcamInterval * 1000);
      }
    } catch (error: any) {
      console.error('Webcam error:', error);
      setWebcamError('Unable to access webcam. Exam may be recorded as suspicious.');
      await logViolation(attemptId, {
        type: 'webcam_error',
        description: 'Failed to access webcam',
        severity: 3
      });
    }
  };

  const captureWebcamPhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !webcamActive) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
      
      try {
        await updateWebcamStatus(attemptId, true, dataUrl);
      } catch (error) {
        console.error('Failed to capture webcam photo:', error);
      }
    }
  };

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenActive(true);
      await updateFullscreenStatus(attemptId, true);
    } catch (error) {
      console.error('Fullscreen error:', error);
      showWarningMessage('Please enable fullscreen mode for the exam');
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setFullscreenActive(false);
      await updateFullscreenStatus(attemptId, false);
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  };

  const startTimer = async () => {
    timerRef.current = setInterval(async () => {
      try {
        const timeData = await getRemainingTime(attemptId) as unknown as TimeResponse;
        if (timeData.submitted) {
          setSubmitted(true);
          navigate(`/exams/result/${exam?.id}`);
          return;
        }
        setTimeRemaining(timeData.remainingTime);

        // Auto-submit when time runs out
        if (timeData.remainingTime <= 0 && settings?.autoSubmit) {
          handleAutoSubmit();
        }
      } catch (error) {
        // Fallback to local calculation
        const now = new Date().getTime();
        const endTime = now + timeRemaining * 60000;
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining <= 0 && settings?.autoSubmit) {
          handleAutoSubmit();
        }
      }
    }, 1000);
  };

  const handleAutoSubmit = async () => {
    try {
      setSubmitting(true);
      await autoSubmitExam(attemptId);
      setSubmitted(true);
      toast.success('Exam auto-submitted due to time expiry!');
      navigate(`/exams/result/${exam?.id}`);
    } catch (error) {
      console.error('Auto-submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const recordViolation = async (type: string, description: string, severity: number = 2) => {
    try {
      const result = await logViolation(attemptId, {
        type,
        description,
        severity
      });
      
      setViolationCount(result.violationCount || violationCount + 1);
      
      if (result.flagged) {
        setIsFlagged(true);
        showWarningMessage('Multiple violations detected. Your exam is flagged for review.');
      } else if (settings && violationCount >= settings.maxViolations - 1) {
        showWarningMessage(`Warning: ${settings.maxViolations - violationCount} more violations will flag your exam!`);
      }
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  };

  const showWarningMessage = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);
  };

  const handleAnswerChange = async (questionId: string, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    try {
      await submitAnswer(exam!.id, questionId, answer);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit the exam?')) return;

    setSubmitting(true);
    try {
      await submitExam(exam!.id, answers);
      setSubmitted(true);
      toast.success('Exam submitted successfully!');
      navigate(`/exams/result/${exam!.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (webcamIntervalRef.current) {
      clearInterval(webcamIntervalRef.current);
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 300) return 'text-red-600';
    if (timeRemaining <= 600) return 'text-orange-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Initializing exam...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we set up your exam</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Exam not found</p>
          <button onClick={() => navigate('/exams')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const questions = exam.questions || [];
  const questionIds = questions.map((q, i) => q.id || `q_${i}`);
  const currentQId = questionIds[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden canvas for webcam capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Warning Toast */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            {warningMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
            {isFlagged && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Flag className="w-4 h-4" /> Flagged
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            {/* Proctoring indicators */}
            <div className="flex items-center gap-3 text-sm">
              {settings?.requireWebcam && (
                <div className={`flex items-center gap-1 ${webcamActive ? 'text-green-600' : 'text-red-500'}`}>
                  {webcamActive ? <Camera className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  <span className="hidden sm:inline">Camera</span>
                </div>
              )}
              {settings?.requireFullscreen && (
                <div className={`flex items-center gap-1 ${fullscreenActive ? 'text-green-600' : 'text-red-500'}`}>
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-orange-600">
                <Shield className="w-4 h-4" />
                <span>{violationCount} violations</span>
              </div>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 text-2xl font-mono font-bold ${getTimerColor()}`}>
              <Clock className="w-6 h-6" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {questions[currentQuestion]?.points} points
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {questions[currentQuestion]?.question}
            </h2>

            {/* Answer Options */}
            {questions[currentQuestion]?.type === 'multiple-choice' && questions[currentQuestion]?.options && (
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQId] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQuestion}`}
                      value={option}
                      checked={answers[currentQId] === option}
                      onChange={() => handleAnswerChange(currentQId, option)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {questions[currentQuestion]?.type === 'fill-blank' && (
              <input
                type="text"
                value={answers[currentQId] || ''}
                onChange={(e) => handleAnswerChange(currentQId, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Type your answer here..."
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentQuestion === idx
                      ? 'bg-blue-600 text-white'
                      : answers[questionIds[idx]]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Exam
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar - Webcam & Info */}
        <div className="w-80 space-y-4">
          {/* Webcam Preview */}
          {settings?.requireWebcam && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Camera</h3>
                <button
                  onClick={() => setShowWebcamPreview(!showWebcamPreview)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showWebcamPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {showWebcamPreview && (
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!webcamActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {webcamError && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-2">
                      {webcamError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Exam Info */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Exam Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{exam.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Questions:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Points:</span>
                <span className="font-medium">{exam.total_points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Answered:</span>
                <span className="font-medium">
                  {Object.keys(answers).filter(k => answers[k]).length} / {questions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Security Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {settings?.blockRightClick ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span>Right-click blocked</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {settings?.blockCopyPaste ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span>Copy/Paste blocked</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {settings?.blockTabSwitch ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span>Tab switch detection</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {fullscreenActive ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>Fullscreen mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

