import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvophbiqtpffokpienki.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Always use teacher-web URL for OAuth callback
const REDIRECT_URL = 'https://teacher-web-rose.vercel.app/auth/callback';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google OAuth Provider
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URL,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
};

// Site name for email templates
export const SITE_NAME = 'Lan Anh - Teacher Portal';
export const SITE_URL = 'https://teacher-web-rose.vercel.app';

// Forgot Password - Send reset email
export const forgotPassword = async (email: string) => {
  const redirectUrl = import.meta.env.PROD 
    ? 'https://teacher-web-rose.vercel.app/reset-password'
    : `${window.location.origin}/reset-password`;
    
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) throw error;
  return data;
};

// Reset Password - Complete password reset
export const resetPassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
};

// Get session
export const getSupabaseSession = () => {
  return supabase.auth.getSession();
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
