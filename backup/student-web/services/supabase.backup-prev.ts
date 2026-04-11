import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvophbiqtpffokpienki.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Always use student-web URL for OAuth callback
const REDIRECT_URL = 'https://student-web-sigma.vercel.app/auth/callback';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google OAuth Provider
export const signInWithGoogle = async () => {
  // First sign out to ensure clean session
  await supabase.auth.signOut();
  
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

// Get session
export const getSupabaseSession = () => {
  return supabase.auth.getSession();
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

