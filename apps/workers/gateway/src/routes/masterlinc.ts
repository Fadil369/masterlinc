import { Hono } from 'hono';
import type { Env } from '../index';

export const masterlincRoutes = new Hono<{ Bindings: Env }>();

const proxyTo = async (env: Env, path: string, req: Request) => {
  return fetch(`${env.MASTERLINC_URL}${path}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway': 'brainsait-gateway',
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    signal: AbortSignal.timeout(15000),
  });
};

masterlincRoutes.get('/health', async (c) => {
  const resp = await proxyTo(c.env, '/health', c.req.raw);
  return c.json(await resp.json() as Record<string, unknown>, resp.status as 200);
});

masterlincRoutes.get('/api/services', async (c) => {
  const cacheKey = 'masterlinc:services';
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));
  const resp = await proxyTo(c.env, '/api/services', c.req.raw);
  const body = await resp.json() as unknown;
  if (resp.ok) await c.env.CACHE.put(cacheKey, JSON.stringify(body), { expirationTtl: 30 });
  return c.json(body as Record<string, unknown>);
});

masterlincRoutes.get('/api/workflows', async (c) => {
  const resp = await proxyTo(c.env, '/api/workflows', c.req.raw);
  return c.json(await resp.json() as Record<string, unknown>, resp.status as 200);
});

masterlincRoutes.post('/api/workflows/start-from-call', async (c) => {
  const body = await c.req.json();
  const resp = await proxyTo(c.env, '/api/workflows/start-from-call', new Request('', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  }));
  return c.json(await resp.json() as Record<string, unknown>, resp.status as 200);
});
