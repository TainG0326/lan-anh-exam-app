import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  STUDENT_LOGO_SRC,
  STUDENT_LOGIN_BG_DESKTOP,
  STUDENT_LOGIN_BG_MOBILE,
} from '../constants/branding';

export default function SignUp() {
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }
    if (!isValidEmail(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInfo()) return;

    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', { email, name, password });
      toast.success('Mã xác nhận đã được gửi đến email!');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi mã xác nhận thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ 6 số của mã xác nhận');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register/verify-otp', {
        email,
        name,
        password,
        otp,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('sessionActive', Date.now().toString());
        toast.success('Đăng ký thành công!');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await api.post('/auth/register/send-otp', { email, name, password });
      toast.success('Đã gửi lại mã xác nhận!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi lại thất bại');
    } finally {
      setLoading(false);
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

      <div className="w-full max-w-[400px] relative z-10 px-4">
        <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-6">
          {/* Logo Section */}
          <div className="text-center mb-6">
            <img
              src={STUDENT_LOGO_SRC}
              alt="Lan Anh English"
              className="w-auto h-24 object-contain mx-auto mb-3 drop-shadow-sm"
            />
            <h1 className="text-xl font-bold text-gray-800">
              {step === 'info' ? 'Đăng ký tài khoản' : 'Xác thực email'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 'info'
                ? 'Tạo tài khoản học sinh tại Lan Anh English'
                : 'Nhập mã xác nhận đã gửi đến email'}
            </p>
          </div>

          {step === 'info' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Name */}
              <div className="relative">
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-3 pl-11 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.name ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="Họ và tên"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1 -mt-2">
                  <AlertCircle className="h-3 w-3" strokeWidth={2} />
                  {errors.name}
                </p>
              )}

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  required
                  className={`w-full px-4 py-3 pl-11 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
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

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full px-4 py-3 pl-11 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="Mật khẩu (ít nhất 6 ký tự)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
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

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full px-4 py-3 pl-11 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                    errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1 -mt-2">
                  <AlertCircle className="h-3 w-3" strokeWidth={2} />
                  {errors.confirmPassword}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp tục</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Back to login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {/* Email info */}
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-500">Mã xác nhận đã gửi đến:</p>
                <p className="font-semibold text-primary text-sm">{email}</p>
              </div>

              {/* OTP input */}
              <input
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />

              {/* Resend OTP */}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-sm text-primary hover:underline disabled:opacity-50"
              >
                Gửi lại mã xác nhận
              </button>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Xác thực và đăng ký</span>
                  </>
                )}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-full text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Quay lại
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
