import express from 'express';
import { register, login, getMe, updateProfile, uploadAvatar } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { avatarUploadMiddleware } from '../utils/avatarUpload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, avatarUploadMiddleware, uploadAvatar);

export default router;





