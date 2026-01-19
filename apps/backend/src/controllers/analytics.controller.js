import prisma from '../config/database.js';
import logger from '../config/logger.js';

export const trackEvent = async (req, res) => {
  try {
    const { sessionId, events } = req.body;
    const userId = req.user?.id;

    if (!sessionId || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid tracking data' });
    }

    // Bulk insert events
    const analyticsEvents = events.map((event) => ({
      userId,
      sessionId,
      eventName: event.name,
      eventData: event.data || {},
      timestamp: new Date(event.timestamp),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }));

    await prisma.analyticsEvent.createMany({
      data: analyticsEvents,
    });

    // Update session count if needed
    if (userId && events.some((e) => e.name === 'session_start')) {
      await prisma.usageStats.update({
        where: { userId },
        data: { totalSessions: { increment: 1 } },
      });
    }

    res.json({ success: true, message: 'Events tracked' });
  } catch (error) {
    logger.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track events' });
  }
};

export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get usage stats
    const usageStats = await prisma.usageStats.findUnique({
      where: { userId },
    });

    // Get recent activity
    const recentMessages = await prisma.chatMessage.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
    });

    // Get domain breakdown
    const domainStats = await prisma.chatMessage.groupBy({
      by: ['domain'],
      where: { userId },
      _count: { domain: true },
    });

    // Get session stats
    const sessions = await prisma.session.count({
      where: { userId, isActive: true },
    });

    // Calculate average response time
    const avgResponseTime = await prisma.chatMessage.aggregate({
      where: {
        userId,
        role: 'assistant',
        responseTime: { not: null },
      },
      _avg: { responseTime: true },
    });

    res.json({
      success: true,
      stats: {
        totalMessages: usageStats?.totalMessages || 0,
        totalSessions: usageStats?.totalSessions || 0,
        totalTokens: usageStats?.totalTokens || 0,
        recentMessages,
        activeSessions: sessions,
        averageResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
        domainBreakdown: domainStats.map((d) => ({
          domain: d.domain,
          count: d._count.domain,
        })),
        lastActivity: usageStats?.lastActivityAt,
      },
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getSessionAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get events for session
    const events = await prisma.analyticsEvent.findMany({
      where: { sessionId, userId },
      orderBy: { timestamp: 'asc' },
    });

    // Get messages for session
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId, userId },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate session metrics
    const sessionStart = events.find((e) => e.eventName === 'session_start');
    const sessionEnd = events.find((e) => e.eventName === 'session_end');

    const duration = sessionEnd && sessionStart
      ? new Date(sessionEnd.timestamp) - new Date(sessionStart.timestamp)
      : null;

    const domainSwitches = events.filter((e) => e.eventName === 'domain_switched').length;

    res.json({
      success: true,
      analytics: {
        sessionId,
        events: events.length,
        messages: messages.length,
        duration,
        domainSwitches,
        timeline: events,
      },
    });
  } catch (error) {
    logger.error('Get session analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch session analytics' });
  }
};

export const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const startDate = new Date(now - daysBack * 24 * 60 * 60 * 1000);

    // Messages over time
    const messagesOverTime = await prisma.chatMessage.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });

    // Top domains
    const topDomains = await prisma.chatMessage.groupBy({
      by: ['domain'],
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      _count: { domain: true },
      orderBy: { _count: { domain: 'desc' } },
    });

    // Event breakdown
    const eventBreakdown = await prisma.analyticsEvent.groupBy({
      by: ['eventName'],
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _count: { eventName: true },
    });

    res.json({
      success: true,
      metrics: {
        timeRange,
        messagesOverTime: messagesOverTime.map((m) => ({
          date: m.createdAt,
          count: m._count.id,
        })),
        topDomains: topDomains.map((d) => ({
          domain: d.domain,
          count: d._count.domain,
        })),
        events: eventBreakdown.map((e) => ({
          event: e.eventName,
          count: e._count.eventName,
        })),
      },
    });
  } catch (error) {
    logger.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};
