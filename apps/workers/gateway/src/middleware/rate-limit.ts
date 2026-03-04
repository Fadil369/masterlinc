import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index';

const WINDOW_MS = 60_000;       // 1-minute sliding window
const DEFAULT_LIMIT = 60;        // requests per window per IP

export const rateLimitMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
  const key = `rl:${ip}:${Math.floor(Date.now() / WINDOW_MS)}`;

  const current = await c.env.RATE_LIMIT.get(key);
  const count = parseInt(current ?? '0') + 1;

  if (count > DEFAULT_LIMIT) {
    c.header('Retry-After', '60');
    return c.json({ error: 'Rate limit exceeded', retry_after: 60 }, 429);
  }

  await c.env.RATE_LIMIT.put(key, String(count), { expirationTtl: 120 });
  c.header('X-RateLimit-Limit', String(DEFAULT_LIMIT));
  c.header('X-RateLimit-Remaining', String(DEFAULT_LIMIT - count));

  await next();
};
