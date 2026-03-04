import type { MiddlewareHandler } from 'hono';
import type { Env } from '../index';

/** Validates session token from KV and attaches user info to context */
export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') ??
                c.req.header('X-API-Key');

  if (!token) return c.json({ error: 'Unauthorized', code: 'MISSING_TOKEN' }, 401);

  const session = await c.env.SESSIONS.get(`session:${token}`);
  if (!session) return c.json({ error: 'Unauthorized', code: 'INVALID_TOKEN' }, 401);

  const payload = JSON.parse(session) as { sub: string; role: string; sid: string; exp: number };
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    await c.env.SESSIONS.delete(`session:${token}`);
    return c.json({ error: 'Session expired' }, 401);
  }

  // Attach to context for downstream use
  (c as any).user = { id: payload.sub, role: payload.role, sessionId: payload.sid };
  await next();
};
