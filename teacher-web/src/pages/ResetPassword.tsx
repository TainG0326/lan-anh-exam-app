import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, ArrowLeft, Eye, EyeOff, Mail, CheckCircle, 
  RefreshCw, Clock, Shield
} from 'lucide-react';

// API URL
const API_URL = 'https://server-three-blue.vercel.app/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  
  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  const startResendCooldown = () => {
    setResendCooldown(60);
    
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
    }
    
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to send OTP');
      } else {
        toast.success(data.message || 'Mã OTP đã được tạo!');
        // Show test OTP if in test mode
        if (data.testOtp) {
          toast(<span>Mã OTP test: <strong>{data.testOtp}</strong></span>, { duration: 10000 });
        }
        setStep('verify');
        startResendCooldown();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }
    
    // For security, we verify OTP during password reset
    // Store email in sessionStorage for the reset step
    sessionStorage.setItem('reset_email', email);
    sessionStorage.setItem('reset_otp', otp);
    
    setStep('reset');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to resend OTP');
      } else {
        toast.success(data.message || 'Mã OTP đã được gửi lại!');
        startResendCooldown();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch') || 'Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('auth.passwordTooShort') || 'Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const resetEmail = sessionStorage.getItem('reset_email') || email;
      
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: resetEmail, 
          otp: sessionStorage.getItem('reset_otp') || otp,
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to reset password');
      } else {
        toast.success(t('auth.passwordUpdated') || 'Password updated successfully!');
        sessionStorage.removeItem('reset_email');
        sessionStorage.removeItem('reset_otp');
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Auto-focus OTP input
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-login-gradient px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        {step !== 'success' && (
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back') || 'Quay lại'}
          </button>
        )}

        {/* Success State */}
        <AnimatePresence mode="wait">
          {step === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {t('auth.passwordUpdated') || 'Đổi mật khẩu thành công!'}
              </h1>
              <p className="text-text-secondary mb-6">
                {t('auth.redirectToLogin') || 'Đang chuyển hướng đến trang đăng nhập...'}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-primary"
              >
                {t('auth.goToLogin') || 'Đến trang đăng nhập'}
              </button>
            </motion.div>
          ) : (
            <>
              {/* Logo/Brand */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/25">
                  {step === 'request' ? (
                    <Mail className="w-8 h-8 text-white" />
                  ) : step === 'verify' ? (
                    <Shield className="w-8 h-8 text-white" />
                  ) : (
                    <Lock className="w-8 h-8 text-white" />
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {step === 'request' 
                    ? (t('auth.resetPassword') || 'Quên mật khẩu') 
                    : step === 'verify'
                    ? 'Xác thực OTP'
                    : (t('auth.setNewPassword') || 'Tạo mật khẩu mới')}
                </h1>
                <p className="text-gray-600 mt-2 text-sm">
                  {step === 'request'
                    ? (t('auth.resetPasswordDesc') || 'Nhập email để nhận mã OTP')
                    : step === 'verify'
                    ? 'Nhập mã OTP được gửi đến email của bạn'
                    : (t('auth.setNewPasswordDesc') || 'Nhập mật khẩu mới của bạn bên dưới')}
                </p>
              </div>

              {/* Form Card */}
              <div className="card p-6 sm:p-8">
                {step === 'request' ? (
                  <form onSubmit={handleRequestReset} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('auth.email') || 'Email'}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teacher@example.com"
                        required
                        className="input-field w-full"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t('auth.sending') || 'Đang gửi...'}</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          <span>Gửi mã OTP</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : step === 'verify' ? (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Mã OTP (6 chữ số)
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        required
                        className="input-field w-full text-center text-2xl tracking-[0.5em] font-mono"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Mã OTP đã được gửi đến: <span className="font-medium">{email}</span>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Đang xác thực...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          <span>Xác thực OTP</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('request');
                          setOtp('');
                        }}
                        className="text-text-secondary hover:text-text-primary"
                      >
                        ← Thay đổi email
                      </button>
                    </div>

                    {resendCooldown > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-800 font-medium">
                              Gửi lại sau: {resendCooldown} giây
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {resendCooldown === 0 && (
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={loading}
                          className="text-primary hover:text-primary-hover font-medium text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Gửi lại mã OTP
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {(email || sessionStorage.getItem('reset_email')) && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{sessionStorage.getItem('reset_email') || email}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('auth.newPassword') || 'Mật khẩu mới'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="input-field w-full pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {t('auth.confirmPassword') || 'Xác nhận mật khẩu'}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="input-field w-full pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t('auth.updating') || 'Đang cập nhật...'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>{t('auth.updatePassword') || 'Cập nhật mật khẩu'}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <p className="text-xs text-gray-400 text-center mt-6">
                {t('auth.securityNotice') || 'Liên kết sẽ hết hạn sau 1 giờ. Vui lòng kiểm tra thư mục spam nếu không nhận được email.'}
              </p>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
