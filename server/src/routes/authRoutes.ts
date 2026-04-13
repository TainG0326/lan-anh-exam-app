import express from 'express';
import { register, login, getMe, updateProfile, uploadAvatar, forgotPassword, resetPassword, verifyLoginOTP, request2FA, manageWhitelist, listWhitelist, googleLogin, revokeTrustedDevices, sendRegisterOTP, verifyRegisterOTP } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { avatarUploadMiddleware } from '../utils/avatarUpload.js';

const router = express.Router();

router.post('/register', register);
router.post('/register/send-otp', sendRegisterOTP);
router.post('/register/verify-otp', verifyRegisterOTP);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/request-2fa', request2FA);
router.get('/whitelist', protect, authorize('admin'), listWhitelist);
router.post('/whitelist', protect, authorize('admin'), manageWhitelist);
router.delete('/whitelist/:email', protect, authorize('admin'), manageWhitelist);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, avatarUploadMiddleware, uploadAvatar);
router.post('/trusted-devices/revoke', protect, revokeTrustedDevices);

export default router;





