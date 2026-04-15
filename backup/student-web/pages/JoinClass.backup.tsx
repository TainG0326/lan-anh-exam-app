import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinClassByCode, getClassByCode, Class } from '../services/classService';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { Users, Key, Sparkles, AlertCircle, Loader2, BookOpen, GraduationCap } from 'lucide-react';

export default function JoinClass() {
  const { t } = useLanguage();
  const [classCode, setClassCode] = useState('');
  const [classCodeError, setClassCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewClass, setPreviewClass] = useState<Class | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const navigate = useNavigate();

  const validateClassCode = useCallback((value: string) => {
    const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code && code.length < 6) {
      setClassCodeError(t('common.codeMinLength') || 'Mã lớp phải có ít nhất 6 ký tự');
    } else {
      setClassCodeError('');
    }
  }, [t]);

  const handlePreviewClass = useCallback(async (code: string) => {
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length < 6) {
      setPreviewClass(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewClass(null);
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = classCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) {
      setClassCodeError(t('common.enterClassCode') || 'Vui lòng nhập mã lớp');
      return;
    }
    if (code.length < 6) {
      setClassCodeError(t('common.codeMinLength') || 'Mã lớp phải có ít nhất 6 ký tự');
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
      } else if (status === 404) {
        toast.error(message || 'Mã lớp không tồn tại. Vui lòng kiểm tra lại.');
      } else if (status === 400) {
        if (message?.toLowerCase().includes('already') || message?.toLowerCase().includes('đã')) {
          toast.error('Bạn đã tham gia lớp này rồi.');
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

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-hover p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">{t('common.joinClass') || 'Join Class'}</h2>
                <p className="text-primary-light mt-1">Kết nối với lớp học của bạn</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Key className="w-10 h-10 text-primary" />
            </div>
            <p className="text-text-secondary mb-2">
              Nhập mã lớp do giáo viên cung cấp
            </p>
            <p className="text-sm text-text-muted">
              Mã lớp thường có 6 ký tự (ví dụ: ABC123)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                {t('common.classCode') || 'Class Code'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Key className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="text"
                  className={`
                    w-full pl-12 pr-4 py-4 text-lg font-mono text-center border-2 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-all duration-200 bg-background-light hover:bg-background
                    ${classCodeError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-border'}
                    ${previewClass ? 'border-green-400 focus:border-green-400 focus:ring-green-400/20' : ''}
                  `}
                  placeholder="ABC123"
                  value={classCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setClassCode(val);
                    validateClassCode(val);
                    handlePreviewClass(val);
                  }}
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>
              {classCodeError && (
                <p className="mt-2 text-sm text-red-500 flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" strokeWidth={2} />
                  {classCodeError}
                </p>
              )}
              {previewLoading && classCode.length >= 6 && !classCodeError && (
                <p className="mt-2 text-sm text-text-muted flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Đang kiểm tra mã lớp...
                </p>
              )}
            </div>

            {/* Class Preview */}
            {previewClass && !previewLoading && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-green-800 truncate">{previewClass.name}</h3>
                    <p className="text-sm text-green-700 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {previewClass.grade} — {previewClass.level}
                    </p>
                  </div>
                  <div className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full flex-shrink-0">
                    ✓ Hợp lệ
                  </div>
                </div>
              </div>
            )}
            {!previewClass && !previewLoading && classCode.length >= 6 && !classCodeError && (
              <p className="text-sm text-text-muted flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" strokeWidth={2} />
                Không tìm thấy lớp với mã này
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !classCode.trim() || !!classCodeError || (!previewClass && classCode.length >= 6)}
              className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-lg shadow-button hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('common.joining') || 'Joining...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t('common.join') || 'Join Class Now'}
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-text-secondary text-center">
              Mã lớp thường được chia sẻ bởi giáo viên qua email hoặc trong lớp học
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
