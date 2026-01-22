import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env file if not already loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('📝 Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
  console.error('Current values:');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('  SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

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

