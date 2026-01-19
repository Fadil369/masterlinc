import bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate name (no special characters, reasonable length)
    if (name.length < 2 || name.length > 50 || !/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({ error: 'Name must be 2-50 characters and contain only letters and spaces' });
    }

    // Enhanced password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must be less than 128 characters' });
    }
    
    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({ 
        error: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character' 
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = generateToken({ userId: user.id, sessionId });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionId });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionId,
        token,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Create user preferences
    await prisma.userPreferences.create({
      data: { userId: user.id },
    });

    // Create usage stats
    await prisma.usageStats.create({
      data: { userId: user.id },
    });

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      user,
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = generateToken({ userId: user.id, sessionId });
    const refreshToken = generateRefreshToken({ userId: user.id, sessionId });

    await prisma.session.create({
      data: {
        userId: user.id,
        sessionId,
        token,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      token,
      refreshToken,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    await prisma.session.update({
      where: { id: req.session.id },
      data: { isActive: false },
    });

    logger.info(`User logged out: ${req.user.email}`);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Find session with refresh token
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || !session.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const token = generateToken({ userId: session.userId, sessionId: session.sessionId });
    const newRefreshToken = generateRefreshToken({ userId: session.userId, sessionId: session.sessionId });

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        preferences: true,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
