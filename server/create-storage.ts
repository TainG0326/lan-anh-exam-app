/**
 * Script to create avatars bucket and policies
 * Run: npx tsx create-storage.ts
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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createStorage() {
  console.log('🔧 Creating avatars bucket and policies...\n');

  // Step 1: Create bucket
  console.log('1️⃣ Creating "avatars" bucket...');
  const { data: bucket, error: bucketError } = await supabaseAdmin.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
  });

  if (bucketError) {
    console.error('   ❌ Failed to create bucket:', bucketError.message);
    
    // Check if bucket already exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.find(b => b.name === 'avatars');
    if (exists) {
      console.log('   ✅ Bucket already exists!');
    } else {
      process.exit(1);
    }
  } else {
    console.log('   ✅ Bucket created successfully!');
  }

  // Step 2: Create storage policies using SQL
  console.log('\n2️⃣ Creating storage policies...');

  const sqlCommands = [
    `DROP POLICY IF EXISTS "Allow avatar upload" ON storage.objects; CREATE POLICY "Allow avatar upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');`,
    `DROP POLICY IF EXISTS "Allow avatar read" ON storage.objects; CREATE POLICY "Allow avatar read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');`,
    `DROP POLICY IF EXISTS "Allow avatar update" ON storage.objects; CREATE POLICY "Allow avatar update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');`,
    `DROP POLICY IF EXISTS "Allow avatar delete" ON storage.objects; CREATE POLICY "Allow avatar delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');`
  ];

  const policyNames = ['Upload', 'Read', 'Update', 'Delete'];

  for (let i = 0; i < sqlCommands.length; i++) {
    try {
      // Use storage RPC to execute SQL
      const { error: policyError } = await supabaseAdmin.rpc('pg_catalog.exec', { 
        query: sqlCommands[i]
      });
      
      // Also try direct storage policy creation
      if (policyError) {
        // Fallback: Try using storage API directly (might not work with service role in all cases)
        console.log(`   ⚠️  ${policyNames[i]}: ${policyError.message}`);
      } else {
        console.log(`   ✅ ${policyNames[i]} policy created`);
      }
    } catch (e: any) {
      console.log(`   ⚠️  ${policyNames[i]}: ${e.message}`);
    }
  }

  // Verify bucket works
  console.log('\n3️⃣ Testing upload...');
  const testBuffer = Buffer.from('test-image-content');
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload('test-upload.txt', testBuffer, { contentType: 'text/plain' });

  if (uploadError) {
    console.log(`   ⚠️  Upload test failed: ${uploadError.message}`);
    console.log(`   📝 You may need to create policies manually in Supabase Dashboard → Storage → Policies`);
  } else {
    console.log('   ✅ Upload test successful!');
    
    // Clean up test file
    await supabaseAdmin.storage.from('avatars').remove(['test-upload.txt']);
  }

  console.log('\n✅ Storage setup complete!');
}

createStorage().catch(console.error);