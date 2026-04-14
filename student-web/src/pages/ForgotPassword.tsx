import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  STUDENT_LOGO_SRC,
  STUDENT_LOGIN_BG_DESKTOP,
  STUDENT_LOGIN_BG_MOBILE,
} from '../constants/branding';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Đã gửi mã OTP đến email của bạn!');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      if (response.data.success) {
        toast.success('Mật khẩu đã được cập nhật thành công!');
        setStep('success');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Đã gửi lại mã OTP!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (step === 'email') return 'Quên mật khẩu';
    if (step === 'otp') return 'Đặt mật khẩu mới';
    return '✓ Thành công';
  };

  const getDesc = () => {
    if (step === 'email') return 'Nhập email để nhận mã xác nhận đặt lại mật khẩu';
    if (step === 'otp') return 'Nhập mã OTP đã gửi đến email và đặt mật khẩu mới';
    return 'Mật khẩu đã được đặt lại thành công!';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Desktop Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{ backgroundImage: `url(${STUDENT_LOGIN_BG_DESKTOP})` }}
      />
      {/* Mobile Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${STUDENT_LOGIN_BG_MOBILE})` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="w-full max-w-[420px] mx-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src={STUDENT_LOGO_SRC}
              alt="Lan Anh English"
              className="w-auto h-20 object-contain mx-auto mb-3"
            />
            <h1 className="text-xl font-bold text-gray-800">
              {getTitle()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {getDesc()}
            </p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-400 hover:text-primary transition-colors"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Mã OTP đã gửi đến: <span className="font-semibold text-primary">{email}</span>
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                className="w-full text-xs text-primary hover:underline"
              >
                Gửi lại OTP
              </button>
              <input
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm text-center tracking-[0.5em] font-mono"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
              >
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Mật khẩu đã được cập nhật thành công!</p>
              <p className="text-sm text-gray-400">Đang chuyển hướng đến trang đăng nhập...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
