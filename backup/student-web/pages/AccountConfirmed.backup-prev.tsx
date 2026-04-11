import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmAccount } from '../services/authService';
import { Loader2, CheckCircle, XCircle, ArrowRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AccountConfirmed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState('Đang xác nhận tài khoản...');

  useEffect(() => {
    const confirm = async () => {
      const code = searchParams.get('code');
      const email = searchParams.get('email');

      if (!code || !email) {
        setStatus('error');
        setMessage('Thiếu thông tin xác nhận. Vui lòng thử lại.');
        return;
      }

      try {
        const response = await confirmAccount(email, code);
        if (response.success) {
          setStatus('success');
          setMessage(response.message);
          toast.success('Tài khoản đã được xác nhận!');
        } else if (response.alreadyVerified) {
          setStatus('already_verified');
          setMessage(response.message);
        } else {
          setStatus('error');
          setMessage(response.message || 'Xác nhận thất bại');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Xác nhận thất bại. Vui lòng thử lại.');
      }
    };

    confirm();
  }, [searchParams]);

  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          .custom-bg {
            background-image: url('/background.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            min-height: 100vh;
          }
        }
        @media (max-width: 639px) {
          .custom-bg {
            background-image: url('/background.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            min-height: 100vh;
          }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      <div className="custom-bg min-h-screen flex items-center justify-center font-sans text-gray-800 transition-colors duration-300 py-4 px-2 sm:px-0">
        <div className="w-full max-w-md p-8 sm:p-10 glass-card shadow-2xl rounded-2xl transition-all duration-300 text-center">
          {/* Logo Section */}
          <div className="mb-6">
            <img
              src="/logo.png"
              alt="Lan Anh English Logo"
              className="w-auto h-24 sm:h-28 object-contain mx-auto mb-3"
            />
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Lan Anh English
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Học tiếng Anh hiệu quả
            </p>
          </div>

          {/* Status Content */}
          {status === 'loading' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Đang xác nhận</h2>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận thành công!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6B9080] to-[#5F8D78] text-white rounded-xl font-medium hover:from-[#5F8D78] hover:to-[#4A6F5E] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Đăng nhập ngay
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'already_verified' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Tài khoản đã được xác nhận</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6B9080] to-[#5F8D78] text-white rounded-xl font-medium hover:from-[#5F8D78] hover:to-[#4A6F5E] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Đăng nhập
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Xác nhận thất bại</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5F8D78] text-white rounded-xl font-medium hover:bg-[#4A6F5E] transition-colors"
              >
                Quay về trang đăng nhập
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
