
import request from 'supertest';
import express, { type Request, type Response } from 'express';

/**
 * Build a minimal Express app that mirrors the /health route from the orchestrator.
 * This allows testing the response contract without real infrastructure (DB, RabbitMQ).
 */
function createTestApp(overrides: { dbHealthy?: boolean; serviceCount?: number } = {}) {
  const app = express();
  app.use(express.json());

  app.get('/health', async (_req: Request, res: Response) => {
    const dbHealthy = overrides.dbHealthy ?? true;
    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: { healthy: dbHealthy },
      services: { total: overrides.serviceCount ?? 0, healthy: overrides.serviceCount ?? 0 },
    });
  });

  return app;
}

describe('Health Check', () => {
  it('returns 200 with healthy status when database is up', async () => {
    const app = createTestApp({ dbHealthy: true, serviceCount: 5 });
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body.database).toEqual({ healthy: true });
    expect(res.body.services.total).toBe(5);
  });

  it('returns 503 with degraded status when database is down', async () => {
    const app = createTestApp({ dbHealthy: false });
    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database).toEqual({ healthy: false });
  });

  it('includes a valid ISO timestamp in the response', async () => {
    const app = createTestApp();
    const res = await request(app).get('/health');
    const ts = new Date(res.body.timestamp);
    expect(ts.getTime()).not.toBeNaN();
  });
});

