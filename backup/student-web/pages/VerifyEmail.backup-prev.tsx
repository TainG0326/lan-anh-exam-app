import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email...');

  useEffect(() => {
    const verify = async () => {
      const code = searchParams.get('code');
      const email = searchParams.get('email');

      if (!code || !email) {
        setStatus('error');
        setMessage('Thiếu thông tin xác thực. Vui lòng thử lại.');
        return;
      }

      try {
        const response = await verifyEmail(email, code);
        if (response.success) {
          setStatus('success');
          setMessage('Xác thực email thành công!');
          toast.success('Email đã được xác thực!');
          
          // Update user context if logged in
          if (user) {
            const updatedUser = { ...user, email_verified: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        } else {
          setStatus('error');
          setMessage(response.message || 'Xác thực thất bại');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Xác thực thất bại. Vui lòng thử lại.');
      }
    };

    verify();
  }, [searchParams, user, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5F8D78]/20 to-[#6B9080]/20 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang xác thực</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thành công!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5F8D78] text-white rounded-xl font-medium hover:bg-[#4A6F5E] transition-colors"
            >
              Về trang chủ
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thất bại</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5F8D78] text-white rounded-xl font-medium hover:bg-[#4A6F5E] transition-colors"
            >
              Quay lại Profile
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

