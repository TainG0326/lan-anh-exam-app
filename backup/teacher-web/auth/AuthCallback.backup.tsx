import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, getSupabaseSession } from '../services/supabase';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getMe } from '../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState('Processing authentication...');
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
        setError('Authentication failed: ' + urlError);
        toast.error(error_description || 'Authentication failed');
        navigate('/login');
        return;
      }

      setStatus('Processing login...');

      try {
        let sessionData = null;

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // Silent fail, try next method
          } else {
            sessionData = data;
          }
        }

        if (!sessionData || !sessionData.session) {
          const { data: existingSession, error: sessionError } = await getSupabaseSession();

          if (sessionError) {
            // Silent fail, try next method
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
              // Silent fail
            } else {
              sessionData = data;
            }
          }
        }

        const sessionAny = sessionData as any;
        const user = sessionAny?.user || sessionAny?.session?.user;
        const session = sessionAny?.session || sessionAny?.session;

        if (!user || !session) {
          setError('Unable to authenticate. Please try again.');
          return;
        }

        setStatus('Logging into system...');

        const userEmail = user.email || '';
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
        const userAvatar = user.user_metadata?.avatar_url || null;

        // Lấy device token từ localStorage để gửi kèm request (bypass 2FA nếu đã đăng ký)
        const existingDeviceToken = localStorage.getItem('deviceToken');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response: Response;
        try {
          // Headers với device token để bypass 2FA nếu có
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
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
              role: 'teacher',
              rememberDevice: true, // Google login tự động remember device
            }),
            credentials: 'include',
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error('Server error: ' + response.status);
          }

          const result = await response.json();

          if (result.success) {
            localStorage.setItem('token', result.token);
            // Fetch latest user data to ensure all fields (avatar, phone, dateOfBirth) are current
            try {
              const freshUser = await getMe();
              localStorage.setItem('user', JSON.stringify(freshUser));
            } catch {
              localStorage.setItem('user', JSON.stringify(result.user));
            }
            localStorage.setItem('sessionActive', Date.now().toString());
            // Lưu device token nếu server trả về
            if (result.deviceToken) {
              localStorage.setItem('deviceToken', result.deviceToken);
            }
            setSuccess(true);

            // Nếu là trusted device, hiển thị thông báo
            if (result.trustedDevice) {
              setStatus('Trusted device verified! Redirecting...');
            } else {
              setStatus('Login successful! Redirecting...');
            }

            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
          } else if (result.requires2FA) {
            // 2FA required - redirect to login page with pre-filled email and QR code data
            sessionStorage.setItem('pending2FAEmail', userEmail);
            sessionStorage.setItem('pending2FATempToken', result.tempToken || '');
            sessionStorage.setItem('pending2FASetup', result.requiresSetup ? 'true' : 'false');
            if (result.skipSetup) {
              sessionStorage.setItem('pending2FASkipSetup', 'true');
            }
            // Lưu QR code data nếu có (setup flow)
            if (result.twoFactorQrCode) {
              sessionStorage.setItem('pending2FQrCode', result.twoFactorQrCode);
              sessionStorage.setItem('pending2FSecret', result.twoFactorSecret || '');
            }
            setSuccess(true);
            setStatus('2FA verification required. Redirecting...');
            setTimeout(() => {
              window.location.href = '/login?2fa=required';
            }, 500);
          } else {
            setError(result.message || 'Login failed');
          }
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            setError('Request timed out. Please try again.');
          } else if (!window.navigator.onLine) {
            setError('No internet connection. Please check your network.');
          } else {
            // Backend error message (e.g. roleMismatch, whitelist rejection)
            setError(fetchError.message || 'Login failed. Please try again.');
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch {
        setError('An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate, t]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-login-gradient">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center">
          {error ? (
            <XCircle className="w-10 h-10 text-error" />
          ) : success ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          )}
        </div>
        
        <h1 className="text-xl font-semibold text-text-primary mb-2">
          {error ? 'Authentication Failed' : 'Processing...'}
        </h1>
        
        <p className="text-text-secondary mb-4">
          {status}
        </p>
        
        {error && (
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
}
