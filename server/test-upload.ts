/**
 * Test avatar upload
 * Run: npx tsx test-upload.ts
 */
import * as dotenv from 'dotenv';

dotenv.config();

// Create a simple test
const testUpload = async () => {
  console.log('🧪 Testing avatar upload...\n');
  
  // Create a simple test file (1x1 pixel transparent PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const testBuffer = Buffer.from(testImageBase64, 'base64');
  
  console.log('📤 Uploading test image to:', 'http://localhost:5000/api/auth/avatar');
  console.log('📝 File size:', testBuffer.length, 'bytes');
  
  // We'll test using a simple fetch to the upload endpoint
  // But first, let's check if we can get a token
  
  console.log('\n⚠️  This test requires authentication token.');
  console.log('📝 To test manually:');
  console.log('   1. Login to teacher-web or student-web');
  console.log('   2. Go to Profile page');
  console.log('   3. Click on avatar to upload');
  console.log('   4. Check server logs for upload progress');
  
  // Alternative: Test the upload function directly
  console.log('\n🔄 Testing Supabase upload directly...');
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || 'https://hvophbiqtpffokpienki.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const timestamp = Date.now();
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(`test-${timestamp}.png`, testBuffer, {
      contentType: 'image/png',
    });
    
  if (error) {
    console.log('❌ Upload failed:', error.message);
    console.log('   Status:', error.status);
  } else {
    console.log('✅ Upload successful!');
    console.log('   Path:', data.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`test-${timestamp}.png`);
    
    console.log('   URL:', urlData.publicUrl);
    
    // Clean up
    console.log('\n🧹 Cleaning up test file...');
    await supabase.storage.from('avatars').remove([`test-${timestamp}.png`]);
    console.log('✅ Done!');
  }
};

testUpload();