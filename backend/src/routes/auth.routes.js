import express from 'express';
import {
  register,
  login,
  logout,
  refreshTokenHandler,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshTokenHandler);
router.get('/me', authenticate, getMe);

export default router;
