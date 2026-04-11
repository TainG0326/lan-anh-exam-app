import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, AlertTriangle, Camera, 
  CheckCircle, ChevronLeft, ChevronRight, 
  Flag, Wifi, WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { examApi, examAuth } from '../services/api';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  total_points: number;
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

export default function ExamRoom() {
  const { examCode } = useParams<{ examCode: string }>();
  const navigate = useNavigate();
  
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
  
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showWebcamPreview, setShowWebcamPreview] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const webcamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const securityCheckDone = useRef(false);

  useEffect(() => {
    const user = examAuth.getCurrentUser();
    if (!user || user.role !== 'student') {
      navigate('/login');
      return;
    }
    
    if (examCode) {
      initializeExam();
    }
    
    return () => {
      cleanup();
    };
  }, [examCode]);

  useEffect(() => {
    if (exam && attemptId && !securityCheckDone.current) {
      securityCheckDone.current = true;
      initializeProctoring();
    }
  }, [exam, attemptId]);

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

  useEffect(() => {
    if (!settings || submitted) return;

    const preventContextMenu = (e: MouseEvent) => {
      if (settings.blockRightClick) {
        e.preventDefault();
        recordViolation('right_click', 'Right-click blocked');
      }
    };

    const preventCopyPaste = (e: Event) => {
      if (settings.blockCopyPaste) {
        e.preventDefault();
        recordViolation('copy_paste', `Blocked: ${e.type}`);
      }
    };

    const handleVisibilityChange = () => {
      if (settings.blockTabSwitch && document.hidden) {
        recordViolation('tab_switch', 'Student left the exam tab');
      }
    };

    const handleWindowBlur = () => {
      if (settings.blockTabSwitch) {
        recordViolation('window_blur', 'Student left the exam window');
      }
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        recordViolation('dev_tools', 'Developer tools shortcut blocked');
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) {
        e.preventDefault();
        recordViolation('dev_tools', 'Developer tools shortcut blocked');
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        recordViolation('view_source', 'View source blocked');
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [settings, submitted]);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => {
      setNetworkStatus('offline');
      recordViolation('network_loss', 'Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeExam = async () => {
    try {
      setLoading(true);
      
      try {
        const settingsData = await examApi.getProctoringSettings(examCode!);
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
      } catch {
        setSettings({
          requireWebcam: true,
          autoSubmit: true,
          blockCopyPaste: true,
          blockRightClick: true,
          blockTabSwitch: true,
          requireFullscreen: true,
          captureWebcamInterval: 30,
          maxViolations: 5
        });
      }

      const examData = await examApi.getExamByCode(examCode!);
      setExam(examData);

      const startData = await examApi.startExam(examData.id);
      setAttemptId(startData.attemptId);
      setAnswers(startData.attempt?.answers || {});
      setTimeRemaining(examData.duration * 60);
      
      if (settings?.requireFullscreen) {
        requestFullscreen();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load exam');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const initializeProctoring = async () => {
    if (!settings) return;

    if (settings.requireWebcam) {
      await initWebcam();
    }

    await examApi.logViolation(attemptId, {
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
      
      if (settings?.captureWebcamInterval) {
        webcamIntervalRef.current = setInterval(() => {
          captureWebcamPhoto();
        }, settings.captureWebcamInterval * 1000);
      }
    } catch (error: any) {
      console.error('Webcam error:', error);
      setWebcamError('Không thể truy cập camera');
      await examApi.logViolation(attemptId, {
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
        await examApi.updateWebcamStatus(attemptId, true, dataUrl);
      } catch (error) {
        console.error('Failed to capture webcam photo:', error);
      }
    }
  };

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenActive(true);
      await examApi.updateFullscreenStatus(attemptId, true);
    } catch (error) {
      console.error('Fullscreen error:', error);
      showWarningMessage('Vui lòng bật chế độ toàn màn hình');
    }
  };

  const startTimer = async () => {
    timerRef.current = setInterval(async () => {
      try {
        const timeData = await examApi.getRemainingTime(attemptId);
        if (timeData.submitted) {
          setSubmitted(true);
          navigate(`/result/${exam?.id}`);
          return;
        }
        setTimeRemaining(timeData.remainingTime);

        if (timeData.remainingTime <= 0 && settings?.autoSubmit) {
          handleAutoSubmit();
        }
      } catch (error) {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime <= 0 && settings?.autoSubmit) {
            handleAutoSubmit();
          }
          return newTime;
        });
      }
    }, 1000);
  };

  const handleAutoSubmit = async () => {
    try {
      setSubmitting(true);
      await examApi.autoSubmitExam(attemptId);
      setSubmitted(true);
      toast.success('Nộp bài tự động do hết giờ!');
      navigate(`/result/${exam?.id}`);
    } catch (error) {
      console.error('Auto-submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const recordViolation = async (type: string, description: string, severity: number = 2) => {
    try {
      const result = await examApi.logViolation(attemptId, {
        type,
        description,
        severity
      });
      
      setViolationCount(result.violationCount || violationCount + 1);
      
      if (result.flagged) {
        setIsFlagged(true);
        showWarningMessage('Nhiều vi phạm đã được phát hiện. Bài thi của bạn sẽ được đánh dấu.');
      } else if (settings && violationCount >= settings.maxViolations - 1) {
        showWarningMessage(`Cảnh báo: ${settings.maxViolations - violationCount} vi phạm nữa sẽ đánh dấu bài thi!`);
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
      await examApi.submitAnswer(exam!.id, questionId, answer);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Bạn có chắc chắn muốn nộp bài?')) return;

    setSubmitting(true);
    try {
      await examApi.submitExam(exam!.id, answers);
      setSubmitted(true);
      toast.success('Nộp bài thành công!');
      navigate(`/result/${exam!.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Nộp bài thất bại');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy bài thi</p>
          <button onClick={() => navigate('/login')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const questions = exam.questions || [];
  const questionIds = questions.map((q, i) => q.id || `q_${i}`);
  const currentQId = questionIds[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 exam-container">
      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{warningMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">{exam.title}</h1>
            {isFlagged && (
              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium flex items-center gap-1">
                <Flag className="w-3 h-3" /> Bị đánh dấu
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {networkStatus === 'online' ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>

            <div className={`flex items-center gap-2 text-2xl font-mono font-bold ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500">
                Câu {currentQuestion + 1} / {questions.length}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {questions[currentQuestion]?.points} điểm
              </span>
            </div>

            <h2 className="text-lg font-medium mb-6 text-gray-800">
              {questions[currentQuestion]?.question}
            </h2>

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
                placeholder="Nhập câu trả lời..."
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </button>

            <div className="flex gap-1.5">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
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
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Sau
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 space-y-4">
          {settings?.requireWebcam && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Camera</h3>
                <button
                  onClick={() => setShowWebcamPreview(!showWebcamPreview)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showWebcamPreview ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              
              {showWebcamPreview && (
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!webcamActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
              {webcamError && (
                <p className="text-xs text-red-500 mt-2">{webcamError}</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-700 mb-3">Trạng thái</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Fullscreen</span>
                {fullscreenActive ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-red-500">Chưa</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Camera</span>
                {webcamActive ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-red-500">Chưa</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Mạng</span>
                {networkStatus === 'online' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-red-500">Mất</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Vi phạm</span>
                <span className={violationCount > 0 ? 'text-red-500 font-medium' : 'text-green-500'}>
                  {violationCount}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-700 mb-3">Thông tin</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian:</span>
                <span>{exam.duration} phút</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Câu hỏi:</span>
                <span>{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Điểm:</span>
                <span>{exam.total_points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Đã trả lời:</span>
                <span className="text-green-600">
                  {Object.keys(answers).filter(k => answers[k]).length} / {questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
