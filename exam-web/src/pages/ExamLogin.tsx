import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Mail, Lock, Shield } from 'lucide-react';
import { examAuth } from '../services/api';

export default function ExamLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [securityCheck, setSecurityCheck] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    checkSecurity();
    blockCopyPaste();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const blockCopyPaste = () => {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      setError('Không được phép sao chép nội dung!');
      setTimeout(() => setError(''), 3000);
    });
    document.addEventListener('cut', (e) => {
      e.preventDefault();
      setError('Không được phép cắt nội dung!');
      setTimeout(() => setError(''), 3000);
    });
    document.addEventListener('paste', (e) => {
      e.preventDefault();
      setError('Không được phép dán nội dung!');
      setTimeout(() => setError(''), 3000);
    });

    // Block Ctrl+C and Ctrl+V
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'C' || e.key === 'V')) {
        e.preventDefault();
        setError('Ctrl+C và Ctrl+V bị vô hiệu hóa!');
        setTimeout(() => setError(''), 3000);
      }
    });
  };

  const checkSecurity = () => {
    const devToolsOpen = () => {
      const threshold = 160;
      const check1 = window.outerWidth - window.innerWidth > threshold;
      const check2 = window.outerHeight - window.innerHeight > threshold;
      return check1 || check2;
    };

    if (window.self !== window.top) {
      setSecurityCheck(false);
      return;
    }

    if (devToolsOpen()) {
      setSecurityCheck(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await examAuth.login(email, password);

      if (!result.success) {
        if (result.needsVerification) {
          setError('Tài khoản chưa được xác thực email. Vui lòng xác thực email bên student-web trước khi vào phòng thi.');
        } else {
          setError(result.message || 'Đăng nhập thất bại');
        }
        setLoading(false);
        return;
      }

      // Login successful, now send OTP
      const otpResult = await examAuth.sendOTP(email);
      
      if (otpResult.success) {
        setShowOTP(true);
        setResendTimer(60);
      } else {
        setError(otpResult.message || 'Không thể gửi mã OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await examAuth.verifyOTP(email, otp);

      if (!result.success) {
        setError(result.message || 'Mã OTP không đúng');
        setLoading(false);
        return;
      }

      // OTP verified - redirect to exams
      navigate('/exams');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setError('');
    setLoading(true);

    try {
      const result = await examAuth.sendOTP(email);
      
      if (result.success) {
        setResendTimer(60);
        setError('');
      } else {
        setError(result.message || 'Không thể gửi lại mã OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOTP(false);
    setOtp('');
    setError('');
  };

  if (!securityCheck) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-red-200">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cảnh Báo Bảo Mật</h1>
          <p className="text-gray-600">
            Phát hiện công cụ phát triển hoặc hành vi bất thường. 
            Vui lòng đóng các công cụ này và thử lại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 overflow-auto"
      style={{
        backgroundImage: 'url(/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100dvh'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md border border-gray-200 my-4"
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 mb-3 sm:mb-4">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
            {showOTP ? 'Xác Thực OTP' : 'Lan Anh Exam System'}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm">
            {showOTP ? 'Nhập mã OTP được gửi qua email' : 'Nhập thông tin để vào phòng thi'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Login form */}
        {!showOTP ? (
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="email@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-3 sm:space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700">
                Mã xác thực đã được gửi đến email: <strong>{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Mã OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0}
                className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : 'Gửi lại mã'}
              </button>
            </div>
          </form>
        )}

        {/* Security notice */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Hệ thống giám sát chống gian lận thi cử
          </p>
        </div>
      </motion.div>
    </div>
  );
}
