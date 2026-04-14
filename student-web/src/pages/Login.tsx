import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getMe } from '../services/authService';
import { signInWithGoogle } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  STUDENT_LOGO_SRC,
  STUDENT_LOGIN_BG_DESKTOP,
  STUDENT_LOGIN_BG_MOBILE,
} from '../constants/branding';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case 'email':
        if (value && !isValidEmail(value)) {
          newErrors.email = 'Email không hợp lệ';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (value && value.length < 6) {
          newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
      newErrors.email = 'Email không hợp lệ';
    }
    if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
        try {
          const freshUser = await getMe();
          const mergedUser = {
            ...response.user,
            ...freshUser,
            id: response.user.id,
            email: response.user.email,
          };
          localStorage.setItem('user', JSON.stringify(mergedUser));
          setUser(mergedUser);
        } catch {
          localStorage.setItem('user', JSON.stringify(response.user));
          setUser(response.user);
        }
        if (response.deviceToken) {
          localStorage.setItem('deviceToken', response.deviceToken);
        }
        toast.success('Chào mừng bạn quay trở lại!');
        const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
        sessionStorage.removeItem('redirectUrl');
        navigate(redirectUrl, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // The page will redirect to Google, then back to /auth/callback
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập Google thất bại');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden animate-fade-in">
      {/* Desktop Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{
          backgroundImage: `url(${STUDENT_LOGIN_BG_DESKTOP})`,
        }}
      />
      {/* Mobile Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{
          backgroundImage: `url(${STUDENT_LOGIN_BG_MOBILE})`,
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div
        className="w-full max-w-[400px] relative z-10 px-4"
      >
        <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-6">
          {/* Logo Section */}
          <div className="text-center mb-6">
            <img
              src={STUDENT_LOGO_SRC}
              alt="Lan Anh English"
              className="w-auto h-24 object-contain mx-auto mb-3 drop-shadow-sm"
            />
            <h1 className="text-xl font-bold text-gray-800">
              Lan Anh English
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">
              For Student
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
                placeholder="Email"
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
                placeholder="Mật khẩu"
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
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                Quên mật khẩu?
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
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">hoặc</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Login - Google */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleLogin}
            className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Tiếp tục với Google
          </button>

          {/* Sign up link */}
          <div className="text-center mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
