import express from 'express';
import { adminApiKeyAuth } from '../middleware/adminApiKey.js';
import {
  adminListWhitelist,
  adminManageWhitelist,
  adminGetWhitelistStats,
  adminBulkAddWhitelist,
} from '../controllers/adminWhitelistController.js';

const router = express.Router();

// All admin routes require API key authentication
router.use(adminApiKeyAuth);

// Whitelist management
router.get('/whitelist', adminListWhitelist);
router.post('/whitelist', adminManageWhitelist);
router.post('/whitelist/bulk', adminBulkAddWhitelist);
router.get('/whitelist/stats', adminGetWhitelistStats);

export default router;
