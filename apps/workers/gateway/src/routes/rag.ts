import { Hono } from 'hono';
import type { Env } from '../index';

export const ragRoutes = new Hono<{ Bindings: Env }>();

/** Search clinical knowledge */
ragRoutes.post('/search', async (c) => {
  const body = await c.req.json<{
    text: string;
    translate_to_en?: boolean;
    top_k?: number;
    include_iris_context?: boolean;
  }>();

  const cacheKey = `rag:search:${JSON.stringify(body)}`;
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached), 200, { 'X-Cache': 'HIT' });

  const resp = await fetch(`${c.env.RAG_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const result = await resp.json() as unknown;
  if (resp.ok) await c.env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 });

  // Log RAG query to D1 audit
  c.executionCtx?.waitUntil(
    c.env.DB.prepare(
      'INSERT INTO audit_logs (action, service, metadata) VALUES (?, ?, ?)'
    ).bind('rag_search', 'rag', JSON.stringify({ query: body.text })).run()
  );

  return c.json(result as Record<string, unknown>, resp.status as 200);
});

/** Trigger IRIS clinical data indexing */
ragRoutes.post('/index/iris', async (c) => {
  const body = await c.req.json<{ resource_types?: string[]; patient_id?: string }>().catch(() => ({}));

  // Record run start in D1
  const runId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO rag_index_runs (id, status) VALUES (?, ?)'
  ).bind(runId, 'running').run();

  // Fire-and-forget to RAG service
  c.executionCtx?.waitUntil((async () => {
    try {
      const resp = await fetch(`${c.env.RAG_URL}/index/iris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
      const result = await resp.json() as Record<string, unknown>;
      await c.env.DB.prepare(
        `UPDATE rag_index_runs SET status=?, finished_at=unixepoch(), total_resources=?, indexed=?, errors=?, resource_counts=? WHERE id=?`
      ).bind(
        resp.ok ? 'done' : 'failed',
        result.total_resources ?? 0,
        result.indexed ?? 0,
        result.errors ?? 0,
        JSON.stringify(result.resource_counts ?? {}),
        runId
      ).run();
    } catch {
      await c.env.DB.prepare(
        `UPDATE rag_index_runs SET status='failed', finished_at=unixepoch() WHERE id=?`
      ).bind(runId).run();
    }
  })());

  return c.json({ run_id: runId, status: 'started' }, 202);
});

/** RAG index run status */
ragRoutes.get('/index/runs', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM rag_index_runs ORDER BY started_at DESC LIMIT 10'
  ).all();
  return c.json({ runs: rows.results });
});

ragRoutes.get('/health', async (c) => {
  const resp = await fetch(`${c.env.RAG_URL}/health`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!resp?.ok) return c.json({ reachable: false }, 503);
  return c.json({ reachable: true, ...(await resp.json() as object) });
});
