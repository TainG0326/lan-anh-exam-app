import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, verifyLoginOTP } from '../services/authService';
import { signInWithGoogle } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [searchParams] = useSearchParams();

  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');

  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const isSessionExpired = searchParams.get('expired') === 'true';
  const needs2FAFromOAuth = searchParams.get('2fa') === 'required';

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isSessionExpired) {
      toast('Your session has expired. Please login again.');
      navigate('/login', { replace: true });
    }
  }, [isSessionExpired, navigate]);

  // Handle 2FA redirect from Google OAuth
  useEffect(() => {
    if (needs2FAFromOAuth) {
      const pendingEmail = sessionStorage.getItem('pending2FAEmail') || '';
      const pendingTempToken = sessionStorage.getItem('pending2FATempToken') || '';
      const pendingSetup = sessionStorage.getItem('pending2FASetup') === 'true';
      const pendingQrCode = sessionStorage.getItem('pending2FQrCode') || '';
      const pendingSecret = sessionStorage.getItem('pending2FSecret') || '';

      if (pendingEmail) {
        setEmail(pendingEmail);
      }
      if (pendingTempToken) {
        setTempToken(pendingTempToken);
      }
      if (pendingSetup) {
        setRequiresSetup(true);
        setTwoFactorQrCode(pendingQrCode);
        setTwoFactorSecret(pendingSecret);
      }
      setRequires2FA(true);

      // Clear session storage
      sessionStorage.removeItem('pending2FAEmail');
      sessionStorage.removeItem('pending2FATempToken');
      sessionStorage.removeItem('pending2FASetup');
      sessionStorage.removeItem('pending2FQrCode');
      sessionStorage.removeItem('pending2FSecret');
    }
  }, [needs2FAFromOAuth]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'email':
        if (value && !isValidEmail(value)) {
          newErrors.email = 'Invalid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!isValidEmail(email)) {
      newErrors.email = 'Invalid email address';
    }
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);
      if (response.success) {
        localStorage.setItem('sessionActive', Date.now().toString());
        setUser(response.user);
        toast.success('Welcome back!');
        const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard';
        sessionStorage.removeItem('redirectUrl');
        navigate(redirectUrl, { replace: true });
      } else if (response.requires2FA) {
        setRequires2FA(true);
        setTempToken(response.tempToken || '');
        setRequiresSetup(response.requiresSetup || false);
        if (response.twoFactorQrCode) {
          setTwoFactorQrCode(response.twoFactorQrCode);
          setTwoFactorSecret(response.twoFactorSecret || '');
        }
        if (response.requiresSetup) {
          toast('Vui lÃ²ng quÃ©t mÃ£ QR báº±ng á»©ng dá»¥ng authenticator Ä‘á»ƒ hoÃ n táº¥t Ä‘Äƒng nháº­p.');
        } else {
          toast('Vui lÃ²ng nháº­p mÃ£ xÃ¡c thá»±c tá»« á»©ng dá»¥ng authenticator.');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
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
        toast.success('Welcome back!');
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

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setOtp('');
    setTempToken('');
    setRequiresSetup(false);
    setTwoFactorSecret('');
    setTwoFactorQrCode('');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error('Google login requires Supabase configuration');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Desktop Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{ 
          backgroundImage: `url(${TEACHER_LOGIN_BG_DESKTOP})`,
        }}
      />
      {/* Mobile Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ 
          backgroundImage: `url(${TEACHER_LOGIN_BG_MOBILE})`,
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] relative z-10 px-4"
      >
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-6">
          {/* Logo Section - Inside Card */}
          <div className="text-center mb-6">
            <img
              src={TEACHER_LOGO_SRC}
              alt="Há»c viá»‡n Anh ngá»¯ Lan Anh"
              className="w-auto h-24 object-contain mx-auto mb-3 drop-shadow-sm"
            />
            <h1 className="text-xl font-bold text-gray-800">
              Lan Anh English
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">
              For Teacher
            </p>
          </div>

          {/* 2FA Verification Form */}
          {requires2FA ? (
            <>
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  {requiresSetup ? 'Thiáº¿t láº­p xÃ¡c thá»±c 2FA' : 'XÃ¡c thá»±c hai yáº¿u tá»‘'}
                </h2>
                <p className="text-xs text-gray-500">
                  {requiresSetup
                    ? 'QuÃ©t mÃ£ QR báº±ng á»©ng dá»¥ng Google Authenticator hoáº·c Authy'
                    : 'Nháº­p mÃ£ 6 chá»¯ sá»‘ tá»« á»©ng dá»¥ng authenticator'}
                </p>
              </div>

              {/* QR Code Setup */}
              {requiresSetup && twoFactorQrCode && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 text-center mb-3">
                    1. Má»Ÿ <strong>Google Authenticator</strong> hoáº·c <strong>Authy</strong>
                  </p>
                  <p className="text-sm text-gray-600 text-center mb-3">
                    2. Nháº¥n <strong>+</strong> vÃ  chá»n <strong>Scan a barcode</strong>
                  </p>
                  <div className="flex justify-center mb-3">
                    <img
                      src={twoFactorQrCode}
                      alt="QR Code"
                      className="w-40 h-40 rounded-lg border border-gray-200"
                    />
                  </div>
                  {twoFactorSecret && (
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1 text-center">Hoáº·c nháº­p mÃ£ nÃ y thá»§ cÃ´ng:</p>
                      <p className="text-center font-mono text-sm font-semibold text-gray-800 break-all">
                        {twoFactorSecret}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    3. Nháº­p mÃ£ 6 chá»¯ sá»‘ bÃªn dÆ°á»›i Ä‘á»ƒ xÃ¡c nháº­n
                  </p>
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 text-center text-lg tracking-[0.5em] border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Äang xÃ¡c thá»±c...</span>
                    </>
                  ) : (
                    <>
                      <span>XÃ¡c thá»±c</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    Quay láº¡i Ä‘Äƒng nháº­p
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email field */}
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={`
                      w-full px-4 py-3 pl-11 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all
                      ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200'}
                    `}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateField('email', e.target.value);
                    }}
                  />
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1 -mt-2">
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
                      w-full px-4 py-3 pl-11 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all
                      ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200'}
                    `}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validateField('password', e.target.value);
                    }}
                  />
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1 -mt-2">
                    <AlertCircle className="h-3 w-3" strokeWidth={2} />
                    {errors.password}
                  </p>
                )}

                {/* Forgot password */}
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-sm text-primary hover:text-primary-hover transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Social Login - Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

