import express from 'express';
import {
  trackEvent,
  getStats,
  getSessionAnalytics,
  getDashboardMetrics,
} from '../controllers/analytics.controller.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/track', optionalAuth, trackEvent);
router.get('/stats', authenticate, getStats);
router.get('/session/:sessionId', authenticate, getSessionAnalytics);
router.get('/dashboard', authenticate, getDashboardMetrics);

export default router;
