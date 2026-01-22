/**
 * Supabase Storage Utility
 * Upload files (avatars) to Supabase Storage instead of local filesystem
 */

import { supabase } from '../config/supabase.js';
import { Readable } from 'stream';

const AVATAR_BUCKET = 'avatars';

// Initialize bucket if not exists
export const initStorageBucket = async (): Promise<void> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === AVATAR_BUCKET);

    if (!bucketExists) {
      // Create bucket (requires admin privileges)
      // Note: This should be done manually in Supabase Dashboard
      // Or via SQL: INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
      console.warn(`Bucket '${AVATAR_BUCKET}' does not exist. Please create it in Supabase Dashboard.`);
    }
  } catch (error) {
    console.error('Failed to initialize storage bucket:', error);
  }
};

// Upload avatar to Supabase Storage
export const uploadAvatarToSupabase = async (
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${userId}-${timestamp}.${ext}`;
    const filePath = `${uniqueFileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Failed to upload avatar to Supabase:', error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }
};

// Delete avatar from Supabase Storage
export const deleteAvatarFromSupabase = async (avatarUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = fileName.split('?')[0]; // Remove query params

    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete avatar:', error);
      // Don't throw - file might not exist
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
  }
};

// Get avatar URL (for backward compatibility)
export const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
  if (!avatarUrl) return null;
  
  // If already a full URL (from Supabase), return as is
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // If relative path, assume it's from Supabase Storage
  return avatarUrl;
};



