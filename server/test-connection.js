// Quick test script for Supabase connection
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing environment variables!');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('\n📡 Testing connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.error('\n❌ Table "users" does not exist!');
        console.error('📝 Solution: Run schema.sql in Supabase SQL Editor');
        console.error('   File: server/src/database/schema.sql');
        return;
      }
      
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        console.error('\n❌ Row Level Security (RLS) is blocking access!');
        console.error('📝 Solution: Disable RLS in Supabase SQL Editor:');
        console.error('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
        return;
      }
      
      if (error.message?.includes('Invalid API key')) {
        console.error('\n❌ Invalid API key!');
        console.error('📝 Solution: Check SUPABASE_ANON_KEY in .env file');
        return;
      }
      
      throw error;
    }
    
    console.log('✅ Connection successful!');
    console.log('✅ Table "users" exists');
    console.log('\n🎉 Supabase is ready to use!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    process.exit(1);
  }
}

test();






