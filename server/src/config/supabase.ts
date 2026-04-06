import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env file if not already loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// Backend must bypass RLS on tables like email_whitelist / users — use service role in production.
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('📝 Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY');
  console.error('Current values:');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error(
    '  SUPABASE_SERVICE_ROLE_KEY:',
    process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'
  );
  console.error('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    '[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set. Using anon key — RLS may block reads (e.g. email_whitelist) and Google login will fail even if the email exists in the table.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Test connection
export const testConnection = async () => {
  try {
    // First, test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.error('❌ Table "users" does not exist!');
        console.error('📝 Please run the SQL schema from server/src/database/schema.sql in Supabase SQL Editor');
        return false;
      }
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        console.error('❌ Row Level Security (RLS) is blocking access!');
        console.error('📝 Please disable RLS or create policies. See SETUP_SUPABASE_NOW.md');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    if (error.message?.includes('Invalid API key')) {
      console.error('📝 Please check SUPABASE_ANON_KEY in .env file');
    }
    return false;
  }
};

