import { Hono } from 'hono';
import type { Env } from '../index';

export const sbsRoutes = new Hono<{ Bindings: Env }>();

/** Proxy to SBS NPHIES bridge with audit logging */
const proxy = async (env: Env, path: string, req: Request, ctx: ExecutionContext) => {
  const url = `${env.SBS_URL}${path}`;
  const resp = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Gateway': 'brainsait-gateway',
      ...(env.NPHIES_API_KEY ? { 'Authorization': `Bearer ${env.NPHIES_API_KEY}` } : {}),
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    signal: AbortSignal.timeout(30000),
  });
  return resp;
};

sbsRoutes.get('/health', async (c) => {
  const resp = await proxy(c.env, '/health', c.req.raw, c.executionCtx);
  return c.json(await resp.json() as Record<string, unknown>, resp.status as 200);
});

sbsRoutes.post('/submit-claim', async (c) => {
  const body = await c.req.json();
  const resp = await proxy(c.env, '/submit-claim', new Request(c.req.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }), c.executionCtx);
  const result = await resp.json() as Record<string, unknown>;

  c.executionCtx?.waitUntil(
    c.env.DB.prepare(
      'INSERT INTO audit_logs (action, service, http_status, metadata) VALUES (?, ?, ?, ?)'
    ).bind('sbs_submit_claim', 'sbs', resp.status, JSON.stringify({ tx: result.transaction_uuid })).run()
  );

  return c.json(result, resp.status as 200);
});

sbsRoutes.post('/submit-preauth', async (c) => {
  const body = await c.req.json();
  const resp = await proxy(c.env, '/submit-preauth', new Request(c.req.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }), c.executionCtx);
  return c.json(await resp.json() as Record<string, unknown>, resp.status as 200);
});

sbsRoutes.get('/transaction/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  const resp = await fetch(`${c.env.SBS_URL}/transaction/${uuid}`, {
    headers: { 'X-Gateway': 'brainsait-gateway' },
  });
  return c.json(await resp.json() as Record<string, unknown>, resp.status as 200);
});

sbsRoutes.get('/terminology/summary', async (c) => {
  const cacheKey = 'sbs:terminology:summary';
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached));
  const resp = await fetch(`${c.env.SBS_URL}/terminology/summary`);
  const body = await resp.json() as unknown;
  if (resp.ok) await c.env.CACHE.put(cacheKey, JSON.stringify(body), { expirationTtl: 300 });
  return c.json(body as Record<string, unknown>);
});
