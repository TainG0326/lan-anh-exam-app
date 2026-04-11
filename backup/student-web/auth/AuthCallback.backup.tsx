import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, getSupabaseSession } from '../services/supabase';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = 'https://server-three-blue.vercel.app/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
            console.log('exchangeCodeForSession failed:', exchangeError.message);
          } else {
            sessionData = data;
          }
        }

        if (!sessionData || !sessionData.session) {
          const { data: existingSession, error: sessionError } = await getSupabaseSession();

          if (sessionError) {
            console.log('Error getting session:', sessionError.message);
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
              console.log('setSession failed:', setSessionError.message);
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response: Response;
        try {
          response = await fetch(API_URL + '/auth/google-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userEmail,
              name: userName,
              avatarUrl: userAvatar,
              role: 'student',
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend response not OK:', response.status, errorText);
            throw new Error('Server error: ' + response.status);
          }

          const result = await response.json();

          if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('sessionActive', Date.now().toString());
            setSuccess(true);
            setStatus('Login successful! Redirecting...');
            setTimeout(() => {
              window.location.href = 'https://student-web-sigma.vercel.app';
            }, 500);
          } else {
            setError(result.message || 'Login failed');
          }
        } catch (fetchError: any) {
          console.error('Fetch error:', fetchError);
          if (fetchError.name === 'AbortError') {
            setError('Request timed out. Please try again.');
          } else if (!window.navigator.onLine) {
            setError('No internet connection. Please check your network.');
          } else {
            setError('Unable to connect to server. Please try again.');
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-login-gradient">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#5F8D78] flex items-center justify-center">
          {error ? (
            <XCircle className="w-10 h-10 text-red-500" />
          ) : success ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          )}
        </div>
        
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          {error ? 'Authentication Failed' : 'Processing...'}
        </h1>
        
        <p className="text-gray-600 mb-4">
          {status}
        </p>
        
        {error && (
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-[#6B9080] to-[#5F8D78] text-white rounded-lg font-medium hover:from-[#5F8D78] hover:to-[#4A6F5E] transition-all"
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
}

