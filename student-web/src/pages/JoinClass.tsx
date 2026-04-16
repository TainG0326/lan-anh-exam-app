import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinClassByCode, getClassByCode, Class } from '../services/classService';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import {
  Users,
  Key,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  STUDENT_LOGO_SRC,
  STUDENT_APP_BG_DESKTOP,
  STUDENT_APP_BG_MOBILE,
} from '../constants/branding';

export default function JoinClass() {
  const { t } = useLanguage();
  const [classCode, setClassCode] = useState('');
  const [classCodeError, setClassCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewClass, setPreviewClass] = useState<Class | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const navigate = useNavigate();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const validateClassCode = useCallback((value: string) => {
    const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code && code.length > 0 && code.length < 6) {
      setClassCodeError('Mã lớp phải có ít nhất 6 ký tự');
    } else {
      setClassCodeError('');
    }
  }, []);

  const handlePreviewClass = useCallback(async (code: string) => {
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length < 6) {
      setPreviewClass(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPreviewLoading(true);
    setPreviewClass(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await getClassByCode(normalized);
        if (result.success) {
          setPreviewClass(result.class);
        } else {
          setPreviewClass(null);
        }
      } catch {
        setPreviewClass(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setClassCode(val);
    validateClassCode(val);
    handlePreviewClass(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = classCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) {
      setClassCodeError('Vui lòng nhập mã lớp');
      return;
    }
    if (code.length < 6) {
      setClassCodeError('Mã lớp phải có ít nhất 6 ký tự');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    setLoading(true);
    try {
      const response = await joinClassByCode(code, controller.signal);
      if (response.success) {
        toast.success(t('common.joinSuccess') || 'Tham gia lớp thành công!');
        navigate('/');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        toast.error('Yêu cầu hết thời gian. Vui lòng thử lại.');
        return;
      }
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (!error.response) {
        toast.error('Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else if (status === 404) {
        toast.error(message || 'Mã lớp không tồn tại. Vui lòng kiểm tra lại.');
      } else if (status === 400) {
        if (message?.toLowerCase().includes('already') || message?.toLowerCase().includes('đã')) {
          toast.error('Bạn đã tham gia lớp này rồi.');
        } else if (message?.toLowerCase().includes('locked') || message?.toLowerCase().includes('khóa')) {
          toast.error('Lớp học đã bị khóa. Không thể tham gia.');
        } else {
          toast.error(message || 'Không thể tham gia lớp.');
        }
      } else if (status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else if (status === 500) {
        toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
      } else {
        toast.error(message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const isValid = previewClass && !previewLoading && classCode.length >= 6 && !classCodeError;
  const isChecking = previewLoading && classCode.length >= 6 && !classCodeError;
  const notFound = !previewClass && !previewLoading && classCode.length >= 6 && !classCodeError;

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-8 animate-fade-in">
      {/* White form card - floating cleanly on the global background */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6">
          {/* Logo Section */}
          <div className="text-center mb-6">
            <img
              src={STUDENT_LOGO_SRC}
              alt="Lan Anh English"
              className="w-auto h-20 object-contain mx-auto mb-2 drop-shadow-sm"
            />
            <h1 className="text-lg font-bold text-gray-800">
              {t('common.joinClass') || 'Tham gia lớp học'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Nhập mã lớp để tham gia
            </p>
          </div>

          {/* Instruction */}
          <div className="bg-primary/5 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">Mã lớp từ giáo viên</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Gồm 6 ký tự (ví dụ: <span className="font-mono font-semibold text-primary">ABC123</span>)
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code Input */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  className={`
                    w-full px-4 py-3 pl-11 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tracking-[0.2em] text-center font-semibold
                    ${classCodeError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      : isValid
                      ? 'border-success focus:border-success focus:ring-success/20 bg-success-light/30'
                      : 'border-gray-200'
                    }
                  `}
                  placeholder="------"
                  value={classCode}
                  onChange={handleInputChange}
                  maxLength={10}
                  required
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>

                {/* Right indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {previewLoading ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : isValid ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : notFound ? (
                    <XCircle className="w-4 h-4 text-error" />
                  ) : null}
                </div>
              </div>

              {/* Error message */}
              {classCodeError && (
                <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3" strokeWidth={2} />
                  {classCodeError}
                </p>
              )}

              {/* Checking status */}
              {isChecking && (
                <p className="text-sm text-primary flex items-center gap-1 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                  Đang kiểm tra mã lớp...
                </p>
              )}

              {/* Character hint */}
              {classCode.length > 0 && classCode.length < 6 && !classCodeError && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {6 - classCode.length} ký tự nữa
                </p>
              )}
            </div>

            {/* Class Preview — Success */}
            {isValid && previewClass && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {previewClass.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {previewClass.grade} — {previewClass.level}
                    </p>
                  </div>
                  <span className="badge badge-success flex-shrink-0">Hợp lệ</span>
                </div>
              </div>
            )}

            {/* Class Preview — Not Found */}
            {notFound && (
              <div className="bg-error-light/50 border-2 border-error/30 rounded-xl p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-error flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">Không tìm thấy lớp</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Mã lớp không tồn tại. Vui lòng kiểm tra lại.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !classCode.trim() ||
                !!classCodeError ||
                (!previewClass && classCode.length >= 6)
              }
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang tham gia...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Tham gia lớp</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Help note */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Mã lớp được chia sẻ bởi giáo viên qua email, tin nhắn hoặc trong buổi học
            </p>
          </div>
        </div>
      </div>
    );
  }
