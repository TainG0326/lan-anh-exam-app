import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getSupabaseSession } from '../services/supabase';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getMe } from '../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Đang xử lý xác thực...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const fullUrl = window.location.href;
      const urlObj = new URL(fullUrl);
      const code = urlObj.searchParams.get('code');
      const urlError = urlObj.searchParams.get('error');
      const error_description = urlObj.searchParams.get('error_description');

      if (urlError) {
        setError('Xác thực thất bại: ' + urlError);
        toast.error(error_description || 'Xác thực thất bại');
        navigate('/login');
        return;
      }

      setStatus('Đang xử lý đăng nhập...');

      try {
        let sessionData: any = null;

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.log('[AuthCallback] exchangeCodeForSession error:', exchangeError.message);
          } else {
            sessionData = data;
          }
        }

        if (!sessionData || !sessionData.session) {
          const { data: existingSession, error: sessionError } = await getSupabaseSession();

          if (sessionError) {
            console.log('[AuthCallback] getSupabaseSession error:', sessionError.message);
          } else if (existingSession?.session) {
            sessionData = existingSession;
          }
        }

        if (!sessionData || !sessionData.session) {
          if (code) {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: '',
              refresh_token: code,
            });

            if (setSessionError) {
              console.log('[AuthCallback] setSession error:', setSessionError.message);
            } else {
              sessionData = data;
            }
          }
        }

        const sessionAny = sessionData as any;
        const user = sessionAny?.user || sessionAny?.session?.user;
        const session = sessionAny?.session || sessionAny?.session;

        if (!user || !session) {
          setError('Không thể xác thực. Vui lòng thử lại.');
          toast.error('Không thể xác thực với Google. Vui lòng thử lại.');
          return;
        }

        setStatus('Đang đăng nhập vào hệ thống...');

        const userEmail = user.email || '';
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || 'Học sinh';
        const userAvatar = user.user_metadata?.avatar_url || null;

        const existingDeviceToken = localStorage.getItem('deviceToken');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response: Response;
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (existingDeviceToken) {
            headers['X-Device-Token'] = existingDeviceToken;
          }

          console.log('[AuthCallback] Sending google-login request for student:', userEmail);
          response = await fetch(API_URL + '/auth/google-login', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: userEmail,
              name: userName,
              avatarUrl: userAvatar,
              role: 'student',
              rememberDevice: true,
            }),
            credentials: 'include',
            signal: controller.signal,
          });

          console.log('[AuthCallback] google-login response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Server error: ' + response.status);
          }

          const result = await response.json();
          console.log('[AuthCallback] google-login result:', JSON.stringify({
            success: result.success,
            requires2FA: result.requires2FA,
            requiresSetup: result.requiresSetup,
            message: result.message,
            hasTempToken: !!result.tempToken,
          }));

          if (result.success) {
            localStorage.setItem('token', result.token);
            try {
              const freshUser = await getMe();
              localStorage.setItem('user', JSON.stringify(freshUser));
            } catch {
              localStorage.setItem('user', JSON.stringify(result.user));
            }
            localStorage.setItem('sessionActive', Date.now().toString());
            if (result.deviceToken) {
              localStorage.setItem('deviceToken', result.deviceToken);
            }
            setSuccess(true);
            setStatus('Đăng nhập thành công! Đang chuyển hướng...');
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          } else if (result.requires2FA) {
            // Store temp token and redirect to 2FA verification page
            sessionStorage.setItem('2fa_email', userEmail);
            sessionStorage.setItem('2fa_tempToken', result.tempToken || '');
            sessionStorage.setItem('2fa_rememberDevice', 'true');
            
            // Redirect to 2FA page
            if (result.requiresSetup) {
              // First time setup - show QR code
              toast.error(result.message || 'Vui lòng xác thực 2FA');
              navigate('/verify-2fa-setup', { 
                state: { 
                  email: userEmail, 
                  tempToken: result.tempToken,
                  twoFactorSecret: result.twoFactorSecret,
                  twoFactorQrCode: result.twoFactorQrCode,
                }
              });
            } else {
              // Verify existing 2FA
              toast.error(result.message || 'Vui lòng nhập mã xác thực 2FA');
              navigate('/verify-2fa', { 
                state: { 
                  email: userEmail, 
                  tempToken: result.tempToken,
                }
              });
            }
            return;
          } else {
            setError(result.message || 'Đăng nhập thất bại');
            toast.error(result.message || 'Đăng nhập thất bại');
          }
        } catch (fetchError: any) {
          console.error('[AuthCallback] Fetch error:', fetchError);
          if (fetchError.name === 'AbortError') {
            setError('Yêu cầu hết thời gian. Vui lòng thử lại.');
            toast.error('Yêu cầu hết thời gian. Vui lòng thử lại.');
          } else if (!window.navigator.onLine) {
            setError('Không có kết nối internet. Vui lòng kiểm tra mạng.');
            toast.error('Không có kết nối internet.');
          } else {
            setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
            toast.error('Không thể kết nối máy chủ.');
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        setError('Đã xảy ra lỗi không mong muốn');
        toast.error('Đã xảy ra lỗi không mong muốn');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center">
          {error ? (
            <XCircle className="w-10 h-10 text-white" />
          ) : success ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          )}
        </div>

        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {error ? 'Xác thực thất bại' : 'Đang xử lý...'}
        </h1>

        <p className="text-gray-500 mb-4">
          {status}
        </p>

        {error && (
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
          >
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}
