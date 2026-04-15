import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinClassByCode } from '../services/classService';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { Users, Key, Sparkles } from 'lucide-react';

export default function JoinClass() {
  const { t } = useLanguage();
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      toast.error(t('common.enterClassCode') || 'Please enter a class code');
      return;
    }

    setLoading(true);
    try {
      const response = await joinClassByCode(classCode.toUpperCase());
      if (response.success) {
        toast.success(t('common.joinSuccess') || 'Successfully joined class!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.joinFailed') || 'Invalid class code');
    } finally {
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
                  className="w-full pl-12 pr-4 py-4 text-lg font-mono text-center border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 bg-background-light hover:bg-background"
                  placeholder="ABC123"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>
              {classCode && (
                <p className="mt-2 text-sm text-text-secondary text-center">
                  {t('common.classCode') || 'Class Code'}: <span className="font-mono font-bold text-primary">{classCode}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !classCode.trim()}
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
