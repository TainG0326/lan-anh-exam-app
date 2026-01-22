// Script to create default users
// Note: This requires RLS to be disabled
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config();

// Use service role key if available, otherwise anon key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDefaultUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Check teacher
    const { data: teacherData } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'teacher@example.com')
      .single();

    if (!teacherData) {
      console.log('📝 Creating default teacher...');
      const hashedPassword = await bcrypt.hash('teacher123', 12);
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: 'teacher@example.com',
          password: hashedPassword,
          name: 'Giáo viên Mẫu',
          role: 'teacher',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating teacher:', error);
      } else {
        console.log('✅ Default teacher created: teacher@example.com / teacher123');
      }
    } else {
      console.log('✅ Teacher already exists');
    }

    // Check student
    const { data: studentData } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'student@example.com')
      .single();

    if (!studentData) {
      console.log('📝 Creating default student...');
      const hashedPassword = await bcrypt.hash('student123', 12);
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: 'student@example.com',
          password: hashedPassword,
          name: 'Học sinh Mẫu',
          role: 'student',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating student:', error);
      } else {
        console.log('✅ Default student created: student@example.com / student123');
      }
    } else {
      console.log('✅ Student already exists');
    }

    console.log('\n🎉 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createDefaultUsers();

