import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Shield, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Verify2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);

  useEffect(() => {
    // Get data from location state or sessionStorage
    const state = location.state as any;
    if (state?.email && state?.tempToken) {
      setEmail(state.email);
      setTempToken(state.tempToken);
    } else {
      // Try to get from sessionStorage
      const storedEmail = sessionStorage.getItem('2fa_email');
      const storedToken = sessionStorage.getItem('2fa_tempToken');
      const storedRemember = sessionStorage.getItem('2fa_rememberDevice');

      if (storedEmail && storedToken) {
        setEmail(storedEmail);
        setTempToken(storedToken);
        if (storedRemember) {
          setRememberDevice(storedRemember === 'true');
        }
      } else {
        toast.error('Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Vui lòng nhập mã 6 chữ số');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL + '/auth/verify-login-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          tempToken,
          rememberDevice,
        }),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        // Clear 2FA session data
        sessionStorage.removeItem('2fa_email');
        sessionStorage.removeItem('2fa_tempToken');
        sessionStorage.removeItem('2fa_rememberDevice');

        // Save tokens
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('sessionActive', Date.now().toString());
        
        if (result.deviceToken) {
          localStorage.setItem('deviceToken', result.deviceToken);
        }

        toast.success('Xác thực thành công!');
        navigate('/');
      } else {
        toast.error(result.message || 'Mã xác thực không đúng');
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      const response = await fetch(API_URL + '/auth/request-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Mã xác thực mới đã được gửi đến email của bạn.');
      } else {
        toast.error(result.message || 'Không thể gửi lại mã');
      }
    } catch (error) {
      toast.error('Không thể gửi lại mã. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Xác thực hai yếu tố
            </h1>
            <p className="text-gray-500 text-sm">
              Nhập mã xác thực từ ứng dụng Google Authenticator
            </p>
            {email && (
              <p className="text-sm text-gray-400 mt-2">
                {email}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Mã xác thực
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="000000"
                autoFocus
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Ghi nhớ thiết bị này (bỏ qua 2FA lần sau)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Xác thực</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend code */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={resendCode}
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Gửi lại mã xác thực
            </button>
          </div>

          {/* Back to login */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                sessionStorage.clear();
                navigate('/login');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
