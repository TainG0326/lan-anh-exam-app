import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Đang xử lý xác thực...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) {
      console.log('[AuthCallback] Already processed, skipping');
      return;
    }
    processedRef.current = true;

    const handleCallback = async () => {
      console.log('[AuthCallback] START - Current URL:', window.location.href);

      const fullUrl = window.location.href;
      const urlObj = new URL(fullUrl);
      const code = urlObj.searchParams.get('code');
      const urlError = urlObj.searchParams.get('error');
      const error_description = urlObj.searchParams.get('error_description');

      console.log('[AuthCallback] Code found:', !!code, 'URL Error:', urlError);

      if (urlError) {
        console.log('[AuthCallback] OAuth error:', urlError, error_description);
        setError('Xác thực thất bại: ' + urlError);
        toast.error(error_description || 'Xác thực thất bại');
        navigate('/login', { replace: true });
        return;
      }

      if (!code) {
        console.log('[AuthCallback] NO CODE - Redirecting to login');
        setError('Không nhận được mã xác thực từ Google');
        toast.error('Không nhận được mã xác thực từ Google');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      setStatus('Đang xử lý đăng nhập...');

      try {
        // STEP 1: Exchange code for session
        console.log('[AuthCallback] STEP 1: Exchanging code for session...');
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('[AuthCallback] exchangeCodeForSession error:', exchangeError);
        } else {
          console.log('[AuthCallback] exchangeCodeForSession SUCCESS:', !!exchangeData?.session);
        }

        let sessionData = exchangeData;
        let supabaseUser = exchangeData?.user || exchangeData?.session?.user;
        let supabaseSession = exchangeData?.session;

        // STEP 2: If no session from exchange, try getSession
        if (!supabaseSession) {
          console.log('[AuthCallback] STEP 2: Trying getSession...');
          const { data: sessionData2, error: sessionError2 } = await supabase.auth.getSession();
          console.log('[AuthCallback] getSession result:', !!sessionData2?.session, 'error:', sessionError2?.message);
          if (sessionData2?.session) {
            sessionData = sessionData2;
            supabaseUser = sessionData2.user;
            supabaseSession = sessionData2.session;
          }
        }

        // STEP 3: If still no session, try setSession with code as refresh_token
        if (!supabaseSession && code) {
          console.log('[AuthCallback] STEP 3: Trying setSession with code...');
          const { data: setData, error: setError2 } = await supabase.auth.setSession({
            access_token: '',
            refresh_token: code,
          });
          console.log('[AuthCallback] setSession result:', !!setData?.session, 'error:', setError2?.message);
          if (setData?.session) {
            sessionData = setData;
            supabaseUser = setData.user;
            supabaseSession = setData.session;
          }
        }

        console.log('[AuthCallback] Final - user:', !!supabaseUser, 'session:', !!supabaseSession);

        if (!supabaseUser || !supabaseSession) {
          console.error('[AuthCallback] FAIL: No user/session from Supabase');
          setError('Không thể xác thực với Google. Vui lòng thử lại.');
          toast.error('Không thể xác thực với Google. Vui lòng thử lại.');
          return;
        }

        setStatus('Đang đăng nhập vào hệ thống...');

        const userEmail = supabaseUser.email || '';
        const userName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'Học sinh';
        const userAvatar = supabaseUser.user_metadata?.avatar_url || null;

        console.log('[AuthCallback] User info:', { email: userEmail, name: userName });

        // STEP 4: Call backend API
        console.log('[AuthCallback] STEP 4: Calling backend /auth/google-login...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('[AuthCallback] Request timeout!');
          controller.abort();
        }, 30000);

        let response: Response;
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          const existingDeviceToken = localStorage.getItem('deviceToken');
          if (existingDeviceToken) {
            headers['X-Device-Token'] = existingDeviceToken;
          }

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

          console.log('[AuthCallback] Backend response status:', response.status);
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[AuthCallback] Backend error:', errorData);
            throw new Error(errorData.message || 'Server error: ' + response.status);
          }

          const result = await response.json();
          console.log('[AuthCallback] Backend result:', JSON.stringify(result));

          if (result.success) {
            console.log('[AuthCallback] SUCCESS - Redirecting to home...');

            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user || { email: userEmail, name: userName }));
            localStorage.setItem('sessionActive', Date.now().toString());
            if (result.deviceToken) {
              localStorage.setItem('deviceToken', result.deviceToken);
            }

            setSuccess(true);
            setStatus('Đăng nhập thành công! Đang chuyển hướng...');

            setTimeout(() => {
              console.log('[AuthCallback] Doing hard redirect to /');
              window.location.href = '/';
            }, 500);
          } else if (result.requires2FA) {
            console.log('[AuthCallback] 2FA required');
            sessionStorage.setItem('2fa_email', userEmail);
            sessionStorage.setItem('2fa_tempToken', result.tempToken || '');
            sessionStorage.setItem('2fa_rememberDevice', 'true');

            if (result.requiresSetup) {
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
              toast.error(result.message || 'Vui lòng nhập mã xác thực 2FA');
              navigate('/verify-2fa', {
                state: {
                  email: userEmail,
                  tempToken: result.tempToken,
                }
              });
            }
          } else {
            console.error('[AuthCallback] Login failed:', result.message);
            setError(result.message || 'Đăng nhập thất bại');
            toast.error(result.message || 'Đăng nhập thất bại');
          }
        } catch (fetchError: any) {
          console.error('[AuthCallback] Fetch error:', fetchError);
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            setError('Yêu cầu hết thời gian. Vui lòng thử lại.');
            toast.error('Yêu cầu hết thời gian. Vui lòng thử lại.');
          } else if (!window.navigator.onLine) {
            setError('Không có kết nối internet.');
            toast.error('Không có kết nối internet.');
          } else {
            setError('Không thể kết nối máy chủ.');
            toast.error('Không thể kết nối máy chủ.');
          }
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
