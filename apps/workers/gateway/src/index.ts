/**
 * BrainSAIT Gateway Worker — Cloudflare Worker
 * Unified API gateway integrating MasterLinc, SBS, IRIS for Health, and RAG.
 *
 * Cloudflare resources:
 *   D1       → audit logs, analytics, file registry, RAG index runs
 *   KV       → sessions, response cache, rate limiting counters
 *   R2       → medical files (DICOM, PDFs, reports)
 *   DO       → real-time presence (PresenceDO), push notifications (NotificationsDO)
 *   Secrets  → JWT_SECRET, IRIS_PASSWORD, NPHIES_API_KEY, GEMINI_API_KEY
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PresenceDO } from './durable-objects/presence';
import { NotificationsDO } from './durable-objects/notifications';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { irisRoutes } from './routes/iris';
import { ragRoutes } from './routes/rag';
import { sbsRoutes } from './routes/sbs';
import { masterlincRoutes } from './routes/masterlinc';
import { r2Routes } from './routes/r2-storage';

export { PresenceDO, NotificationsDO };

// ─────────────────────────────────────────────────────────────────────────────
// Environment bindings
// ─────────────────────────────────────────────────────────────────────────────
export interface Env {
  // D1
  DB: D1Database;
  // KV
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  // R2
  MEDICAL_FILES: R2Bucket;
  AUDIT_EXPORTS: R2Bucket;
  // Durable Objects
  PRESENCE: DurableObjectNamespace;
  NOTIFICATIONS: DurableObjectNamespace;
  // Vars
  ENVIRONMENT: string;
  MASTERLINC_URL: string;
  SBS_URL: string;
  IRIS_FHIR_URL: string;
  RAG_URL: string;
  // Secrets
  JWT_SECRET: string;
  IRIS_PASSWORD: string;
  NPHIES_API_KEY: string;
  GEMINI_API_KEY?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

// CORS — allow BrainSAIT origins
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://brainsait.com',
      'https://masterlinc.brainsait.com',
      'https://portal.brainsait.com',
      'https://healthcare.brainsait.com',
    ];
    if (!origin || origin.endsWith('.github.app') || origin.includes('localhost')) return origin ?? '*';
    return allowed.includes(origin) ? origin : '';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-Latency-MS'],
  maxAge: 86400,
}));

// Request ID + latency tracking
app.use('*', async (c, next) => {
  const rid = c.req.header('x-request-id') ?? crypto.randomUUID();
  c.header('X-Request-ID', rid);
  const start = Date.now();
  await next();
  c.header('X-Latency-MS', String(Date.now() - start));
});

// ─────────────────────────────────────────────────────────────────────────────
// Public routes (no auth)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({
  name: 'BrainSAIT Gateway',
  version: '1.0.0',
  services: ['masterlinc', 'sbs', 'iris-health', 'rag'],
  docs: 'https://docs.brainsait.com/gateway',
}));

app.get('/health', async (c) => {
  const [dbRow] = await c.env.DB.prepare('SELECT 1 AS ok').all().then(r => r.results);
  const sessionCount = await c.env.SESSIONS.get('__meta__count').then(v => v ?? '0');
  return c.json({
    status: 'healthy',
    ts: new Date().toISOString(),
    env: c.env.ENVIRONMENT,
    d1: dbRow ? 'connected' : 'error',
    kv_sessions: 'connected',
    cached_sessions: sessionCount,
  });
});

app.get('/health/services', async (c) => {
  const services: Record<string, unknown> = {};

  const check = async (name: string, url: string) => {
    try {
      const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
      services[name] = { ok: r.ok, status: r.status };
    } catch (e) {
      services[name] = { ok: false, error: (e as Error).message };
    }
  };

  await Promise.allSettled([
    check('masterlinc', c.env.MASTERLINC_URL),
    check('sbs', c.env.SBS_URL),
    check('iris', c.env.IRIS_FHIR_URL.replace('/fhir/r4', '')),
    check('rag', c.env.RAG_URL),
  ]);

  const allHealthy = Object.values(services).every((s: any) => s.ok);
  return c.json({ overall: allHealthy ? 'healthy' : 'degraded', services }, allHealthy ? 200 : 207);
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth endpoint — issue session tokens
// ─────────────────────────────────────────────────────────────────────────────
app.post('/auth/token', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();
  // In production: validate against IRIS SuperUser or an identity provider
  if (!username || !password) return c.json({ error: 'Missing credentials' }, 400);

  const sessionId = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24h
  const payload = { sub: username, role: 'user', sid: sessionId, exp: expiresAt };

  // Store session in KV (TTL = 24h) + D1
  await Promise.all([
    c.env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(payload), { expirationTtl: 86400 }),
    c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, role, expires_at, ip) VALUES (?, ?, ?, ?, ?)'
    ).bind(sessionId, username, 'user', expiresAt, c.req.header('cf-connecting-ip') ?? '').run(),
  ]);

  return c.json({ token: sessionId, expires_at: new Date(expiresAt * 1000).toISOString() });
});

app.post('/auth/revoke', authMiddleware, async (c) => {
  const { sessionId } = await c.req.json<{ sessionId: string }>();
  await Promise.all([
    c.env.SESSIONS.delete(`session:${sessionId}`),
    c.env.DB.prepare('UPDATE sessions SET revoked = 1 WHERE id = ?').bind(sessionId).run(),
  ]);
  return c.json({ revoked: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated API routes (rate-limited)
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/*', authMiddleware, rateLimitMiddleware);

// Mount service-specific routes
app.route('/api/iris', irisRoutes);
app.route('/api/rag', ragRoutes);
app.route('/api/sbs', sbsRoutes);
app.route('/api/masterlinc', masterlincRoutes);
app.route('/api/files', r2Routes);

// ─────────────────────────────────────────────────────────────────────────────
// Analytics & Audit (authenticated admin routes)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/analytics', async (c) => {
  const hours = parseInt(c.req.query('hours') ?? '24');
  const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString().slice(0, 13);
  const rows = await c.env.DB.prepare(
    `SELECT service, SUM(requests) requests, SUM(errors) errors,
            AVG(p50_ms) p50, AVG(p95_ms) p95
     FROM analytics_hourly WHERE hour >= ? GROUP BY service`
  ).bind(cutoff).all();
  return c.json({ period_hours: hours, services: rows.results });
});

app.get('/api/audit', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 200);
  const service = c.req.query('service');
  let stmt = 'SELECT * FROM audit_logs';
  const params: string[] = [];
  if (service) { stmt += ' WHERE service = ?'; params.push(service); }
  stmt += ' ORDER BY ts DESC LIMIT ?';
  params.push(String(limit));
  const rows = await c.env.DB.prepare(stmt).bind(...params).all();
  return c.json({ logs: rows.results });
});

// ─────────────────────────────────────────────────────────────────────────────
// Real-time WebSocket (via Durable Objects)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/ws/presence/:room', async (c) => {
  const roomId = c.env.PRESENCE.idFromName(c.req.param('room'));
  const stub = c.env.PRESENCE.get(roomId);
  return stub.fetch(c.req.raw);
});

app.get('/ws/notifications/:userId', async (c) => {
  const doId = c.env.NOTIFICATIONS.idFromName(c.req.param('userId'));
  const stub = c.env.NOTIFICATIONS.get(doId);
  return stub.fetch(c.req.raw);
});

// ─────────────────────────────────────────────────────────────────────────────
// Cron: daily analytics rollup
// ─────────────────────────────────────────────────────────────────────────────
async function dailyRollup(env: Env) {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const rows = await env.DB.prepare(
    `SELECT service, COUNT(*) requests, SUM(CASE WHEN http_status >= 500 THEN 1 ELSE 0 END) errors,
            AVG(latency_ms) p50_ms
     FROM audit_logs WHERE ts >= ? AND ts < ?
     GROUP BY service`
  ).bind(
    new Date(yesterday).getTime(),
    new Date(yesterday).getTime() + 86_400_000
  ).all();

  // Export to R2 as NDJSON
  const ndjson = rows.results.map(r => JSON.stringify(r)).join('\n');
  await env.AUDIT_EXPORTS.put(`analytics/${yesterday}.ndjson`, ndjson, {
    httpMetadata: { contentType: 'application/x-ndjson' },
  });
}

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await dailyRollup(env);
  },
};
