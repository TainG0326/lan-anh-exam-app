import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvophbiqtpffokpienki.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2b3BoYmlxdHBmZm9rcGllbmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjM2MjAsImV4cCI6MjA1MzczOTYyMH0.Lj3HPZnkm-GeClM8OBPtBwF2yo-7IUF9vhJJBTVbX8A';

// Student web OAuth callback URL - update when deploying
const REDIRECT_URL = import.meta.env.VITE_REDIRECT_URL || 'https://student-b1pthddk5-thaitai824s-projects.vercel.app/auth/callback';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export const SITE_NAME = 'Lan Anh - Student Portal';
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://student-web-sigma.vercel.app';

export const getSupabaseSession = () => {
  return supabase.auth.getSession();
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
