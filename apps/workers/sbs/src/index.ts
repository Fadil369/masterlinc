import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SbsClaim, ClaimCreateRequest } from '@brainsait/sbs-types';

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Health Check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'SBS Dynamic Claims Management',
    timestamp: new Date().toISOString(),
    env: c.env.ENVIRONMENT
  });
});

/**
 * Create a new claim (Dynamic persistence)
 */
app.post('/api/claims/create', async (c) => {
  const body = await c.req.json<ClaimCreateRequest>();
  const claimId = `claim_${Date.now()}`;
  
  // Calculate total amount
  const totalAmount = body.services.reduce((sum, s) => sum + (s.quantity * s.unitPrice), 0);

  try {
    // 1. Insert Claim Record
    await c.env.DB.prepare(`
      INSERT INTO claims (claim_id, patient_oid, provider_oid, facility_oid, total_amount, status)
      VALUES (?, ?, ?, ?, ?, 'draft')
    `).bind(
      claimId, 
      body.patient_oid, 
      body.provider_oid, 
      body.facility_oid, 
      totalAmount
    ).run();

    // 2. Insert Services (Batch)
    const serviceStatements = body.services.map(s => {
      const totalPrice = s.quantity * s.unitPrice;
      return c.env.DB.prepare(`
        INSERT INTO claim_services (claim_id, code, description, quantity, unit_price, total_price, provider_id, service_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(claimId, s.code, s.description, s.quantity, s.unitPrice, totalPrice, s.providerId);
    });

    await c.env.DB.batch(serviceStatements);

    return c.json({
      success: true,
      claimId,
      totalAmount,
      message: 'Claim created and persisted in D1'
    }, 201);

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get Claim Details
 */
app.get('/api/claims/:claimId', async (c) => {
  const claimId = c.req.param('claimId');
  
  try {
    const claim = await c.env.DB.prepare('SELECT * FROM claims WHERE claim_id = ?')
      .bind(claimId)
      .first();

    if (!claim) return c.json({ error: 'Claim not found' }, 404);

    const services = await c.env.DB.prepare('SELECT * FROM claim_services WHERE claim_id = ?')
      .bind(claimId)
      .all();

    return c.json({
      ...claim,
      services: services.results
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Submit Claim to NPHIES (Simulated Dynamic Call)
 */
app.post('/api/claims/:claimId/submit-nphies', async (c) => {
  const claimId = c.req.param('claimId');
  const nphiesId = `NPH-${Math.random().toString(36).substring(7).toUpperCase()}`;

  try {
    await c.env.DB.prepare(`
      UPDATE claims 
      SET status = 'submitted', nphies_id = ?, submitted_at = CURRENT_TIMESTAMP 
      WHERE claim_id = ?
    `).bind(nphiesId, claimId).run();

    return c.json({
      success: true,
      nphiesId,
      message: 'Claim successfully submitted to simulated NPHIES gateway'
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * List Claims by Patient OID
 */
app.get('/api/claims/patient/:oid', async (c) => {
  const oid = c.req.param('oid');
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM claims WHERE patient_oid = ? ORDER BY created_at DESC')
      .bind(oid)
      .all();
    return c.json(results);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
