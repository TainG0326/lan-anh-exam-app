import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, register, verifyLoginOTP, request2FA } from '../services/authService';
import { signInWithGoogle, forgotPassword } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  TEACHER_LOGO_SRC,
  TEACHER_LOGIN_BG_DESKTOP,
  TEACHER_LOGIN_BG_MOBILE,
} from '../constants/branding';

type AuthMode = 'login' | 'register';

export default function Login() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [searchParams] = useSearchParams();

  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [resendingOTP, setResendingOTP] = useState(false);

  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const isSessionExpired = searchParams.get('expired') === 'true';

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isSessionExpired) {
      toast(t('auth.sessionExpired') || 'Your session has expired. Please login again.');
      navigate('/login', { replace: true });
    }
  }, [isSessionExpired, navigate, t]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'email':
        if (value && !isValidEmail(value)) {
          newErrors.email = t('validation.invalidEmail');
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          newErrors.password = t('validation.passwordMinLength');
        } else {
          delete newErrors.password;
        }
        break;
      case 'name':
        if (mode === 'register' && value && value.length < 2) {
          newErrors.name = t('validation.nameRequired');
        } else {
          delete newErrors.name;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!isValidEmail(email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    if (password.length < 6) {
      newErrors.password = t('validation.passwordMinLength');
    }
    if (mode === 'register' && name.length < 2) {
      newErrors.name = t('validation.nameRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      let response;

      if (mode === 'register') {
        response = await register({ name, email, password, role: 'student' });
        if (response.success) {
          toast.success(t('toast.accountCreated'));
          const loginResponse = await login(email, password);
          if (loginResponse.success) {
            localStorage.setItem('sessionActive', Date.now().toString());
            setUser(loginResponse.user);
            const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard';
            sessionStorage.removeItem('redirectUrl');
            navigate(redirectUrl, { replace: true });
          } else if (loginResponse.requires2FA) {
            setRequires2FA(true);
            setTempToken(loginResponse.tempToken || '');
            setRequiresSetup(loginResponse.requiresSetup || false);
            toast('Vui lòng nhập mã xác thực 2FA đã được gửi đến email của bạn.');
          }
        }
      } else {
        response = await login(email, password);
        if (response.success) {
          localStorage.setItem('sessionActive', Date.now().toString());
          setUser(response.user);
          toast.success(t('toast.welcomeBack'));
          const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard';
          sessionStorage.removeItem('redirectUrl');
          navigate(redirectUrl, { replace: true });
        } else if (response.requires2FA) {
          setRequires2FA(true);
          setTempToken(response.tempToken || '');
          setRequiresSetup(response.requiresSetup || false);
          toast('Vui lòng nhập mã xác thực 2FA đã được gửi đến email của bạn.');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || (mode === 'register' ? t('toast.registrationFailed') : t('toast.loginFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await verifyLoginOTP(email, otp, tempToken);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('sessionActive', Date.now().toString());
        toast.success(t('toast.welcomeBack'));
        const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard';
        sessionStorage.removeItem('redirectUrl');
        navigate(redirectUrl, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendingOTP(true);
    try {
      await request2FA();
      toast.success('Mã xác thực mới đã được gửi đến email của bạn!');
    } catch (error: any) {
      toast.error('Không thể gửi mã. Vui lòng thử lại.');
    } finally {
      setResendingOTP(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setOtp('');
    setTempToken('');
    setRequiresSetup(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error(t('login.googleNotConfigured') || 'Google login requires Supabase configuration');
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-2 sm:px-4 relative overflow-hidden bg-slate-100">
      {/* Desktop Background - hidden on mobile, shown on md+ */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{ 
          backgroundImage: `url(${TEACHER_LOGIN_BG_DESKTOP})`,
        }}
      />
      {/* Mobile Background - shown only on mobile, hidden on md+ */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ 
          backgroundImage: `url(${TEACHER_LOGIN_BG_MOBILE})`,
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md sm:max-w-[420px] relative z-10 px-3 sm:px-0"
      >
        {/* Header with Language Switcher */}
        <div className="flex justify-end mb-3 sm:mb-4">
          <LanguageSwitcher />
        </div>

        {/* Logo Section */}
        <div className="text-center mb-5 sm:mb-8">
          <img
            src={TEACHER_LOGO_SRC}
            alt="Học viện Anh ngữ Lan Anh"
            className="w-auto h-24 sm:h-32 object-contain mx-auto mb-2 sm:mb-4 drop-shadow-sm"
          />
          <h1 className="text-lg sm:text-2xl font-semibold text-text-primary">
            Lan Anh English
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {t('login.slogan')}
          </p>
        </div>

        {/* Card with light glass effect */}
        <div className="card p-5 sm:p-8 bg-white/80 backdrop-blur-sm shadow-2xl border border-white/40 rounded-2xl">

          {/* 2FA Verification Form */}
          {requires2FA ? (
            <>
              {/* Header */}
              <div className="text-center mb-5 sm:mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-1">
                  {requiresSetup ? 'Xác thực email lần đầu' : 'Xác thực hai yếu tố'}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Nhập mã xác thực đã được gửi đến email của bạn
                </p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  className="input-field w-full text-center text-lg tracking-[0.5em]"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác thực</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-text-secondary hover:text-primary transition-colors"
                  >
                    Quay lại đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendingOTP}
                    className="text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
                  >
                    {resendingOTP ? 'Đang gửi...' : 'Gửi lại mã'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-5 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-1">
                  {mode === 'login' ? t('login.welcomeBack') : t('login.createAccount')}
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  {mode === 'login' ? t('login.signInToContinue') : t('login.joinToday')}
                </p>
              </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field - Only for register */}
            {mode === 'register' && (
              <input
                id="name"
                name="name"
                type="text"
                required={mode === 'register'}
                className={`
                  input-field w-full
                  ${errors.name ? 'border-error focus:border-error focus:ring-error/20' : ''}
                `}
                placeholder={t('login.fullName')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateField('name', e.target.value);
                }}
              />
            )}

            {/* Email field */}
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`
                  input-field w-full
                  ${errors.email ? 'border-error focus:border-error focus:ring-error/20' : ''}
                `}
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField('email', e.target.value);
                }}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-error flex items-center gap-1 ml-1">
                <AlertCircle className="h-3 w-3" strokeWidth={2} />
                {errors.email}
              </p>
            )}

            {/* Password field */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className={`
                  input-field w-full
                  ${errors.password ? 'border-error focus:border-error focus:ring-error/20' : ''}
                `}
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validateField('password', e.target.value);
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" strokeWidth={2} /> : <Eye className="h-4.5 w-4.5" strokeWidth={2} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-error flex items-center gap-1 ml-1">
                <AlertCircle className="h-3 w-3" strokeWidth={2} />
                {errors.password}
              </p>
            )}

            {/* Forgot password - Login only */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/reset-password')}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('login.signingIn')}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? t('login.signIn') : t('login.createAccount')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login - Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="btn-secondary w-full flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('login.continueWithGoogle')}
          </button>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              {mode === 'login' ? t('login.dontHaveAccount') : t('login.alreadyHaveAccount')}
              <button
                type="button"
                onClick={switchMode}
                className="ml-1 text-primary hover:text-primary-hover font-medium transition-colors"
              >
                {mode === 'login' ? t('login.signUp') : t('login.signIn')}
              </button>
            </p>
          </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
