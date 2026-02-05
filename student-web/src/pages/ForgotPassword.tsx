import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const navigate = useNavigate();

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        toast.success('Mã OTP đã được gửi đến email của bạn!');
        setStep('otp');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      
      if (response.data.success) {
        toast.success('Đặt lại mật khẩu thành công!');
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        toast.success('Mã OTP đã được gửi lại!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi lại mã OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .mesh-gradient {
          background-color: #fcfcf9;
          background-image: 
            radial-gradient(at 12% 18%, hsla(138,41%,88%,1) 0px, transparent 50%),
            radial-gradient(at 89% 13%, hsla(60,28%,93%,1) 0px, transparent 50%),
            radial-gradient(at 19% 89%, hsla(138,41%,92%,1) 0px, transparent 50%),
            radial-gradient(at 85% 82%, hsla(60,28%,91%,1) 0px, transparent 50%),
            radial-gradient(at 50% 50%, hsla(138,20%,95%,1) 0px, transparent 50%);
        }
        .dark .mesh-gradient {
          background-color: #1A2321;
          background-image: 
            radial-gradient(at 12% 18%, hsla(138,20%,15%,1) 0px, transparent 50%),
            radial-gradient(at 89% 13%, hsla(138,25%,12%,1) 0px, transparent 50%),
            radial-gradient(at 19% 89%, hsla(138,20%,18%,1) 0px, transparent 50%),
            radial-gradient(at 85% 82%, hsla(138,25%,14%,1) 0px, transparent 50%),
            radial-gradient(at 50% 50%, hsla(138,15%,20%,1) 0px, transparent 50%);
        }
      `}</style>

      <div className="mesh-gradient min-h-screen flex items-center justify-center font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
        <div className="w-full max-w-md p-8 sm:p-10 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-xl rounded-lg border border-white/50 dark:border-gray-700/50 transition-all duration-300">
          <div className="text-center mb-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="font-serif text-3xl text-gray-900 dark:text-white mb-2 tracking-tight">
              {step === 'email' && 'Quên mật khẩu'}
              {step === 'otp' && 'Nhập mã OTP'}
              {step === 'success' && 'Thành công!'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
              {step === 'email' && 'Nhập email để nhận mã xác nhận'}
              {step === 'otp' && 'Nhập mã OTP đã gửi về email'}
              {step === 'success' && 'Mật khẩu đã được đặt lại'}
            </p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-5">
                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-gradient-to-r from-[#6B9080] to-[#5F8D78] hover:from-[#5F8D78] hover:to-[#4A6F5E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5F8D78] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </span>
                  {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Mã OTP đã gửi đến: <span className="font-medium text-[#5F8D78]">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-xs text-[#5F8D78] hover:underline mt-1"
                >
                  Gửi lại mã OTP
                </button>
              </div>

              <div className="space-y-5">
                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="otp">
                    Mã OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200 text-center tracking-widest text-lg font-mono"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="newPassword">
                    Mật khẩu mới
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={6}
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1" htmlFor="confirmPassword">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="block w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5F8D78] focus:border-[#5F8D78] sm:text-sm transition-colors duration-200"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-gradient-to-r from-[#6B9080] to-[#5F8D78] hover:from-[#5F8D78] hover:to-[#4A6F5E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5F8D78] shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300">
                  Mật khẩu đã được đặt lại thành công!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Đang chuyển về trang đăng nhập...
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="fixed top-4 right-4 z-50">
          <button
            className="p-2 rounded-full bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white transition-all shadow-sm backdrop-blur-sm"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

