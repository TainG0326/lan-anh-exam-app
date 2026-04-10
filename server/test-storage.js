// Quick test for avatar upload
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvophbiqtpffokpienki.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2b3BoYmlxdHBmZm9rcGllbmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjg0ODYsImV4cCI6MjA4MzY0NDQ4Nn0.y7U3MrJVIjYy_VlD8YR3eQdtJ3-HYybXl3PRJdOvICk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('Checking storage buckets...');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  
  console.log('Buckets found:', buckets?.map(b => b.name) || 'none');
  
  // Check if avatars bucket exists
  const avatarsBucket = buckets?.find(b => b.name === 'avatars');
  
  if (!avatarsBucket) {
    console.log('❌ Avatars bucket does not exist!');
    console.log('💡 Solution: Create bucket in Supabase Dashboard → Storage → New Bucket');
    return;
  }
  
  console.log('✅ Avatars bucket exists');
  
  // Try to upload test file
  console.log('\nTesting upload...');
  const testBuffer = Buffer.from('test');
  const { data, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload('test.txt', testBuffer, { contentType: 'text/plain' });
    
  if (uploadError) {
    console.error('Upload error:', uploadError);
    console.error('Status:', uploadError.status);
    return;
  }
  
  console.log('✅ Upload successful!');
}

checkStorage();