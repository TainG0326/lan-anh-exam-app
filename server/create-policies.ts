/**
 * Create storage policies using Supabase API directly
 * Run: npx tsx create-policies.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hvophbiqtpffokpienki.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

// Use service role key with bypass RLS for SQL operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function createPolicies() {
  console.log('🔧 Creating storage policies for avatars bucket...\n');

  // First, let's check current policies
  console.log('📊 Checking current policies...');
  const { data: currentPolicies, error: listError } = await supabaseAdmin
    .from('storage.policies')
    .select('*')
    .eq('name', 'avatars');

  if (listError) {
    console.log('   Note: Could not list policies directly, will create new ones');
  } else {
    console.log(`   Found ${currentPolicies?.length || 0} existing policies for avatars`);
  }

  // Try using direct SQL execution via REST API
  console.log('\n1️⃣ Creating "Allow avatar upload" policy...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: `CREATE POLICY "Allow avatar upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');`
      })
    });
    
    if (response.ok) {
      console.log('   ✅ Created');
    } else {
      const data = await response.json();
      console.log('   ⚠️', data.message || 'Using alternative method...');
    }
  } catch (e: any) {
    console.log('   ⚠️', e.message);
  }

  // Alternative: Use PostgREST directly - but need to do it via SQL
  console.log('\n2️⃣ Attempting to create policies via direct query...');
  
  // This is the fallback - user needs to run SQL manually
  console.log(`
📝 To ensure upload works, please run this SQL in Supabase Dashboard → SQL Editor:

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar read" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar update" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar delete" ON storage.objects;

-- Create policies
CREATE POLICY "Allow avatar upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow avatar read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Allow avatar update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

CREATE POLICY "Allow avatar delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
`);

  // Test if upload works without policies (with service role)
  console.log('🧪 Testing upload with service role key...');
  const testBuffer = Buffer.from('test-' + Date.now());
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(`test-${Date.now()}.txt`, testBuffer, { contentType: 'text/plain' });

  if (uploadError) {
    console.log(`   ❌ Upload failed: ${uploadError.message}`);
    console.log('   📝 Please create policies as shown above');
  } else {
    console.log('   ✅ Upload works with service role key!');
    // Clean up
    const fileName = uploadData.path;
    await supabaseAdmin.storage.from('avatars').remove([fileName]);
    console.log('   🧹 Cleaned up test file');
  }
}

createPolicies().catch(console.error);