import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Check if session exists and is active
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    if (!session.user.isActive) {
      return res.status(403).json({ error: 'User account is deactivated' });
    }

    // Attach user to request
    req.user = session.user;
    req.session = session;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (session && session.isActive && new Date() <= session.expiresAt && session.user.isActive) {
        req.user = session.user;
        req.session = session;
      }
    }
  } catch (error) {
    // Continue without authentication
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
