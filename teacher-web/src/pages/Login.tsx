import { useState, useEffect, useRef } from 'react';
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
  const [rememberDevice, setRememberDevice] = useState(true);

  // OTP refs for keyboard navigation
  const otpSetupRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpVerifyRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      } else {
        setRequiresSetup(false);
        // Check skipSetup from OAuth flow (already verified, no QR needed)
        const skipSetup = sessionStorage.getItem('pending2FASkipSetup') === 'true';
        if (skipSetup) {
          sessionStorage.removeItem('pending2FASkipSetup');
        }
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
        // Lưu device token nếu có
        if (response.deviceToken) {
          localStorage.setItem('deviceToken', response.deviceToken);
        }
        if (response.trustedDevice) {
          toast.success('Welcome back! Trusted device verified.');
        } else {
          toast.success('Welcome back!');
        }
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
          toast('Please scan the QR code with your authenticator app to complete login.');
        } else {
          toast('Please enter the verification code from your authenticator app.');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await verifyLoginOTP(email, otp, tempToken, rememberDevice);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('sessionActive', Date.now().toString());
        // Lưu device token nếu có (remember device)
        if (response.deviceToken) {
          localStorage.setItem('deviceToken', response.deviceToken);
        }
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
    setRememberDevice(true);
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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

      {/* ===== 2FA SETUP FORM (first-time setup with QR) ===== */}
      {requires2FA && requiresSetup ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[720px] mx-4 relative z-10"
        >
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] overflow-hidden">
            {/* Header */}
            <div className="text-center px-10 pt-10 pb-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Set Up Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Scan the QR code with your authenticator app (Google Authenticator or Authy)
              </p>
            </div>

            {/* Two-column body */}
            <div className="flex flex-col md:flex-row">
              {/* Left: QR Code */}
              <div className="md:w-[46%] px-10 py-8 md:border-r border-gray-100 flex flex-col items-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
                  Scan QR Code
                </p>
                <div className="p-5 bg-white rounded-xl border-2 border-gray-200 shadow-sm mb-5">
                  <img
                    src={twoFactorQrCode}
                    alt="QR Code"
                    className="w-48 h-48 rounded-lg"
                  />
                </div>

                {/* Manual Key */}
                {twoFactorSecret && (
                  <div className="w-full">
                    <p className="text-xs text-gray-400 mb-2 text-center font-medium">
                      Or enter this key manually
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 border border-gray-200 overflow-hidden">
                        <p className="font-mono text-xs text-gray-600 tracking-wider select-all break-all leading-relaxed">
                          {twoFactorSecret}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFactorSecret);
                          toast.success('Code copied!');
                        }}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Copy code"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Steps + OTP */}
              <div className="md:w-[54%] px-10 py-8">
                {/* Setup Steps */}
                <div className="mb-7 space-y-3">
                  {[
                    { num: 1, text: 'Open Google Authenticator or Authy' },
                    { num: 2, text: 'Tap the + button and select "Scan a barcode"' },
                    { num: 3, text: 'Scan the QR code or enter the key on the left' },
                    { num: 4, text: 'Enter the 6-digit code below to confirm' },
                  ].map((step) => (
                    <div key={step.num} className="flex items-center gap-3.5">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        otp.length === 6 && step.num === 4
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : otp.length > 0 && step.num < 4
                          ? 'bg-primary/20 text-primary'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.num}
                      </div>
                      <p className={`text-sm transition-colors ${
                        otp.length === 6 && step.num === 4 ? 'text-gray-800 font-semibold' : 'text-gray-500'
                      }`}>
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* OTP Form */}
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  {/* Desktop OTP boxes - compact elegant size */}
                  <div className="hidden sm:flex items-center justify-center gap-1.5">
                    {[...Array(6)].map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpSetupRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp[i] || ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          if (raw.length > 1) {
                            const newOtp = raw.slice(0, 6);
                            setOtp(newOtp);
                            setTimeout(() => {
                              const last = document.getElementById(`otp-setup-${Math.min(newOtp.length, 5)}`);
                              last?.focus();
                            }, 0);
                            if (newOtp.length === 6) {
                              const form = document.getElementById('otp-form-setup');
                              if (form) setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true })), 150);
                            }
                          } else {
                            const newOtp = otp.slice(0, i) + raw + otp.slice(i + 1);
                            setOtp(newOtp);
                            if (raw) {
                              setTimeout(() => {
                                if (i < 5) {
                                  const next = document.getElementById(`otp-setup-${i + 1}`);
                                  next?.focus();
                                }
                              }, 0);
                            }
                            if (newOtp.length === 6) {
                              const form = document.getElementById('otp-form-setup');
                              if (form) setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true })), 150);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace') {
                            e.preventDefault();
                            const newOtp = otp.slice(0, i) + otp.slice(i + 1);
                            setOtp(newOtp);
                            setTimeout(() => {
                              const target = document.getElementById(`otp-setup-${Math.max(0, i - (otp[i] ? 0 : 1))}`);
                              target?.focus();
                            }, 0);
                          }
                          if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            const prev = document.getElementById(`otp-setup-${i - 1}`);
                            prev?.focus();
                          }
                          if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            const next = document.getElementById(`otp-setup-${i + 1}`);
                            next?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                          setOtp(pasted);
                          if (pasted.length === 6) {
                            const form = document.getElementById('otp-form-setup');
                            if (form) setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true })), 150);
                          }
                        }}
                        autoFocus={i === 0}
                        id={`otp-setup-${i}`}
                        className={`
                          w-10 h-10 text-center text-base font-bold transition-all duration-200 border
                          ${otp[i]
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-300'
                          }
                          focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20
                        `}
                        style={{ borderRadius: '8px', maxWidth: '40px' }}
                      />
                    ))}
                  </div>

                  {/* Mobile OTP */}
                  <div className="sm:hidden">
                    <input
                      id="otp-mobile-setup"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      className="w-full px-5 py-4 text-center text-2xl tracking-[0.5em] font-mono font-bold border-2 border-gray-200 bg-gray-50 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      style={{ borderRadius: '14px' }}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <div className="flex justify-center gap-1.5 mt-3">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            i < otp.length ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Verify Button */}
                  <button
                    id="otp-form-setup"
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-sm tracking-wide rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'VERIFY & CONFIRM'
                    )}
                  </button>

                  {/* Back to login */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-sm text-gray-400 hover:text-primary transition-colors font-medium px-3 py-2 -mx-3"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>

      /* ===== 2FA VERIFY FORM (already set up, no QR) ===== */
      ) : requires2FA ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] mx-4 relative z-10"
        >
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] overflow-hidden">
            {/* Header */}
            <div className="text-center px-8 pt-10 pb-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-500">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            {/* Body */}
            <div className="px-8 pb-8 pt-6">
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* Email hint */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 truncate">{email}</p>
                </div>

                {/* Desktop OTP boxes - compact elegant size */}
                <div className="hidden sm:flex items-center justify-center gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpVerifyRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp[i] || ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        if (raw.length > 1) {
                          const newOtp = raw.slice(0, 6);
                          setOtp(newOtp);
                          if (newOtp.length === 6) {
                            const form = document.getElementById('otp-form-verify');
                            if (form) setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true })), 150);
                          }
                        } else {
                          const newOtp = otp.slice(0, i) + raw + otp.slice(i + 1);
                          setOtp(newOtp);
                          if (raw) {
                            setTimeout(() => {
                              if (i < 5) {
                                const next = document.getElementById(`otp-verify-${i + 1}`);
                                next?.focus();
                              }
                            }, 0);
                          }
                          if (newOtp.length === 6) {
                            const form = document.getElementById('otp-form-verify');
                            if (form) setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true })), 150);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          e.preventDefault();
                          const newOtp = otp.slice(0, i) + otp.slice(i + 1);
                          setOtp(newOtp);
                          setTimeout(() => {
                            const target = document.getElementById(`otp-verify-${Math.max(0, i - (otp[i] ? 0 : 1))}`);
                            target?.focus();
                          }, 0);
                        }
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          const prev = document.getElementById(`otp-verify-${i - 1}`);
                          prev?.focus();
                        }
                        if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          const next = document.getElementById(`otp-verify-${i + 1}`);
                          next?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        setOtp(pasted);
                        if (pasted.length === 6) {
                          const form = document.getElementById('otp-form-verify');
                          if (form) setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true })), 150);
                        }
                      }}
                      autoFocus={i === 0}
                      id={`otp-verify-${i}`}
                      className={`
                        w-10 h-10 text-center text-base font-bold transition-all duration-200 border
                        ${otp[i]
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-300'
                        }
                        focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20
                      `}
                      style={{ borderRadius: '8px', maxWidth: '40px' }}
                    />
                  ))}
                </div>

                {/* Mobile OTP */}
                <div className="sm:hidden">
                  <input
                    id="otp-mobile-verify"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    className="w-full px-5 py-4 text-center text-2xl tracking-[0.5em] font-mono font-bold border-2 border-gray-200 bg-gray-50 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    style={{ borderRadius: '14px' }}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <div className="flex justify-center gap-1.5 mt-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          i < otp.length ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  id="otp-form-verify"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-4 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-sm tracking-wide rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'VERIFY'
                  )}
                </button>

                {/* Remember this device */}
                {!requiresSetup && (
                  <div className="flex items-center gap-2.5 justify-center">
                    <input
                      type="checkbox"
                      id="remember-device"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                    />
                    <label htmlFor="remember-device" className="text-sm text-gray-500 cursor-pointer select-none">
                      Remember this device for 30 days
                    </label>
                  </div>
                )}

                {/* Back to login */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-sm text-gray-400 hover:text-primary transition-colors font-medium px-3 py-2 -mx-3"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>

      /* ===== LOGIN FORM ===== */
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px] relative z-10 px-4"
        >
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-6">
            {/* Logo Section - Inside Card */}
            <div className="text-center mb-6">
              <img
                src={TEACHER_LOGO_SRC}
                alt="Lan Anh English"
                className="w-auto h-24 object-contain mx-auto mb-3 drop-shadow-sm"
              />
              <h1 className="text-xl font-bold text-gray-800">
                Lan Anh English
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                For Teacher
              </p>
            </div>

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

              {/* Create account link */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
                >
                  Create an account
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
          </div>
        </motion.div>
      )}
    </div>
  );
}
