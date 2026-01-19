import express from 'express';
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
} from '../controllers/chat.controller.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/send', optionalAuth, sendMessage);
router.get('/history', authenticate, getChatHistory);
router.delete('/clear', authenticate, clearChatHistory);

export default router;
