import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Đang xử lý xác thực...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      console.log('[AuthCallback] START');

      const urlObj = new URL(window.location.href);
      const code = urlObj.searchParams.get('code');
      const urlError = urlObj.searchParams.get('error');
      const error_description = urlObj.searchParams.get('error_description');

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashAccessToken = hashParams.get('access_token');
      const hashExpiresIn = hashParams.get('expires_in');
      const hashRefreshToken = hashParams.get('refresh_token');
      const hashTokenType = hashParams.get('token_type');
      const hashProviderToken = hashParams.get('provider_token');
      const hashProviderRefreshToken = hashParams.get('provider_refresh_token');

      if (urlError) {
        setError('Xác thực thất bại: ' + urlError);
        toast.error(error_description || 'Xác thực thất bại');
        window.location.href = '/login';
        return;
      }

      if (!code && !hashAccessToken) {
        setError('Không nhận được mã xác thực từ Google');
        toast.error('Không nhận được mã xác thực từ Google');
        window.location.href = '/login';
        return;
      }

      setStatus('Đang xử lý đăng nhập...');

      try {
        let supabaseUser: any = null;
        let supabaseSession: any = null;
        let userEmail = '';
        let userName = '';
        let userAvatar: string | null = null;

        if (hashAccessToken) {
          const payload = decodeJwtPayload(hashAccessToken);
          if (payload) {
            userEmail = payload.email || '';
            userName = payload.user_metadata?.full_name || payload.user_metadata?.name || 'Học sinh';
            userAvatar = payload.user_metadata?.avatar_url || null;

            supabaseUser = {
              id: payload.sub,
              email: userEmail,
              user_metadata: payload.user_metadata || {
                full_name: userName,
                avatar_url: userAvatar,
              },
            };

            supabaseSession = {
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken || '',
              expires_in: hashExpiresIn ? parseInt(hashExpiresIn) : 3600,
              expires_at: payload.exp ? payload.exp : Math.floor(Date.now() / 1000) + 3600,
              token_type: hashTokenType || 'bearer',
              provider_token: hashProviderToken,
              provider_refresh_token: hashProviderRefreshToken,
              user: supabaseUser,
            };
          }

          const { data: setData, error: setError2 } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken || '',
          }) as { data: any; error: any };

          if (!setError2 && setData?.session) {
            supabaseUser = setData.user || supabaseUser;
            supabaseSession = setData.session;
            userEmail = supabaseUser?.email || userEmail;
            userName = supabaseUser?.user_metadata?.full_name || supabaseUser?.user_metadata?.name || userName;
            userAvatar = supabaseUser?.user_metadata?.avatar_url || userAvatar;
          }
        }

        if (!supabaseSession && code) {
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code) as { data: any; error: any };
          if (!exchangeError && exchangeData?.session) {
            supabaseUser = exchangeData?.user || exchangeData?.session?.user;
            supabaseSession = exchangeData?.session;
            userEmail = supabaseUser?.email || '';
            userName = supabaseUser?.user_metadata?.full_name || supabaseUser?.user_metadata?.name || 'Học sinh';
            userAvatar = supabaseUser?.user_metadata?.avatar_url || null;
          }
        }

        if (!supabaseSession) {
          const { data: sessionData2 } = await supabase.auth.getSession() as { data: any; error: any };
          if (sessionData2?.session) {
            supabaseUser = sessionData2.user;
            supabaseSession = sessionData2.session;
          }
        }

        if (!supabaseSession && code) {
          const { data: setData } = await supabase.auth.setSession({
            access_token: '',
            refresh_token: code,
          }) as { data: any; error: any };
          if (setData?.session) {
            supabaseUser = setData.user;
            supabaseSession = setData.session;
          }
        }

        if (!supabaseUser || !supabaseSession) {
          setError('Không thể xác thực với Google. Vui lòng thử lại.');
          toast.error('Không thể xác thực với Google. Vui lòng thử lại.');
          window.location.href = '/login';
          return;
        }

        setStatus('Đang đăng nhập vào hệ thống...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          const existingDeviceToken = localStorage.getItem('deviceToken');
          if (existingDeviceToken) headers['X-Device-Token'] = existingDeviceToken;

          const response = await fetch(API_URL + '/auth/google-login', {
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

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 409) {
              setError(errorData.message || 'Email đã được đăng ký với vai trò khác.');
              toast.error(errorData.message || 'Email đã được đăng ký với vai trò khác.');
              await supabase.auth.signOut();
              window.location.href = '/login';
            } else {
              setError(errorData.message || 'Lỗi server. Vui lòng thử lại.');
              toast.error(errorData.message || 'Lỗi server. Vui lòng thử lại.');
              window.location.href = '/login';
            }
            return;
          }

          const result = await response.json();

          if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user || { email: userEmail, name: userName }));
            localStorage.setItem('sessionActive', Date.now().toString());
            if (result.deviceToken) localStorage.setItem('deviceToken', result.deviceToken);
            setSuccess(true);
            setStatus('Đăng nhập thành công!');
            window.location.href = '/';
          } else if (result.requires2FA) {
            sessionStorage.setItem('2fa_email', userEmail);
            sessionStorage.setItem('2fa_tempToken', result.tempToken || '');
            sessionStorage.setItem('2fa_rememberDevice', 'true');
            window.location.href = result.requiresSetup ? '/verify-2fa-setup' : '/verify-2fa';
          } else if (result.roleMismatch) {
            setError(result.message || 'Vai trò không phù hợp.');
            toast.error(result.message || 'Vai trò không phù hợp.');
            window.location.href = '/login';
          } else {
            setError(result.message || 'Đăng nhập thất bại.');
            toast.error(result.message || 'Đăng nhập thất bại.');
            window.location.href = '/login';
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            setError('Yêu cầu hết thời gian. Vui lòng thử lại.');
            toast.error('Yêu cầu hết thời gian. Vui lòng thử lại.');
          } else if (!window.navigator.onLine) {
            setError('Không có kết nối internet.');
            toast.error('Không có kết nối internet.');
          } else {
            const errorMessage = fetchError.message || 'Đăng nhập thất bại.';
            setError(errorMessage);
            toast.error(errorMessage);
          }
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        setError('Đã xảy ra lỗi không mong muốn');
        toast.error('Đã xảy ra lỗi không mong muốn');
        window.location.href = '/login';
      }
    };

    handleCallback();
  }, []);

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
        <p className="text-gray-500 mb-4">{status}</p>
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
