import multer, { FileFilterCallback } from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure avatars directory exists
const avatarDir = path.join(__dirname, '../../uploads/avatars');
fs.mkdir(avatarDir, { recursive: true }).catch(console.error);

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: async (req: any, file: any, cb: (error: Error | null, destination: string) => void) => {
    await fs.mkdir(avatarDir, { recursive: true });
    cb(null, avatarDir);
  },
  filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename: userId-timestamp.extension
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: FileFilterCallback) => {
    // Accept only image files
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
    }
  },
});

export const avatarUploadMiddleware = avatarUpload.single('avatar');

// Get avatar URL (relative path for serving)
export const getAvatarUrl = (filename: string): string => {
  if (!filename) return '';
  // Return path relative to uploads folder
  return `/uploads/avatars/${filename}`;
};


