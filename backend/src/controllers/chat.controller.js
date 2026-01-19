import prisma from '../config/database.js';
import logger from '../config/logger.js';
import fetch from 'node-fetch';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export const sendMessage = async (req, res) => {
  try {
    const { message, domain, language, save_only } = req.body;
    const userId = req.user?.id || 'anonymous';
    const sessionId = req.session?.sessionId || `anon_${Date.now()}`;

    if (!message || !domain) {
      return res.status(400).json({ error: 'Message and domain are required' });
    }

    // Validate message content
    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message must be a non-empty string' });
    }

    if (message.length > 10000) {
      return res.status(400).json({ error: 'Message too long. Maximum 10,000 characters allowed' });
    }

    // Validate domain
    const allowedDomains = ['healthcare', 'business', 'development', 'personal'];
    if (!allowedDomains.includes(domain)) {
      return res.status(400).json({ error: 'Invalid domain specified' });
    }

    // Validate language if provided
    if (language && !['en', 'ar'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language. Only "en" and "ar" are supported' });
    }

    // Sanitize message content (remove potential harmful content)
    const sanitizedMessage = message.trim().replace(/[\x00-\x1F\x7F]/g, '');

    // Save user message
    if (req.user) {
      await prisma.chatMessage.create({
        data: {
          userId,
          sessionId,
          domain,
          role: 'user',
          content: message,
        },
      });
    }

    // If save_only, just save and return
    if (save_only) {
      return res.json({ success: true, message: 'Message saved' });
    }

    // Call Claude API
    const startTime = Date.now();
    const response = await callClaudeAPI(message, domain, language);
    const responseTime = Date.now() - startTime;

    // Save assistant message
    if (req.user) {
      await prisma.chatMessage.create({
        data: {
          userId,
          sessionId,
          domain,
          role: 'assistant',
          content: response.message,
          tokens: response.tokens,
          responseTime,
        },
      });

      // Update usage stats
      await prisma.usageStats.update({
        where: { userId },
        data: {
          totalMessages: { increment: 1 },
          totalTokens: { increment: response.tokens || 0 },
          lastActivityAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      message: response.message,
      metadata: {
        tokens: response.tokens,
        responseTime,
        domain,
      },
    });
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
};

async function callClaudeAPI(userMessage, domain, language = 'en') {
  const domainConfigs = {
    healthcare: {
      title: 'Healthcare & Medical Intelligence',
      agent: 'HealthcareLinc',
      desc: 'Specialized in evidence-based medicine, NPHIES compliance, claims optimization, and clinical decision support.',
    },
    business: {
      title: 'Business & Operations Intelligence',
      agent: 'BusinessLinc',
      desc: 'Expert in business strategy, market analysis, financial modeling, and operational optimization.',
    },
    development: {
      title: 'Development & Technology Intelligence',
      agent: 'DevLinc',
      desc: 'Master programmer across languages, frameworks, cloud platforms, and system architecture.',
    },
    personal: {
      title: 'Personal Growth Intelligence',
      agent: 'GrowthLinc',
      desc: 'Personal development coach for skills, productivity, health, and creative pursuits.',
    },
  };

  const config = domainConfigs[domain] || domainConfigs.healthcare;

  const systemPrompt = `You are ${config.agent}, a specialized AI assistant for ${config.title}.

${config.desc}

Guidelines:
- Provide expert, actionable guidance
- Use domain-specific terminology appropriately
- Be concise but comprehensive
- Include examples when helpful
- Format with markdown for clarity
- If query suits another domain better, mention it

Language: ${language === 'en' ? 'English' : 'Arabic'}`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      message: data.content?.[0]?.text || 'No response',
      tokens: data.usage?.total_tokens || 0,
    };
  } catch (error) {
    logger.error('Claude API error:', error);
    // Return fallback response
    return {
      message: `I'm ${config.agent}, ready to help with your query. However, I'm currently experiencing connectivity issues. Please try again in a moment.`,
      tokens: 0,
    };
  }
}

export const getChatHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, domain } = req.query;

    // Validate and sanitize query parameters
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ error: 'Offset must be a non-negative number' });
    }

    // Validate domain if provided
    if (domain && !['healthcare', 'business', 'development', 'personal'].includes(domain)) {
      return res.status(400).json({ error: 'Invalid domain specified' });
    }

    const where = {
      userId: req.user.id,
    };

    if (domain) {
      where.domain = domain;
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ success: true, messages });
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    await prisma.chatMessage.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    logger.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};
