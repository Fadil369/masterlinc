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

// Enhanced Claim Creation
app.post('/api/claims/create', async (c) => {
  const body = await c.req.json<ClaimCreateRequest>();
  const claimId = `claim_${Date.now()}`;
  
  // Calculate total amount & Confidence
  const totalAmount = body.services.reduce((sum, s) => sum + (s.quantity * s.unitPrice), 0);
  const normalizationConfidence = Math.random() * (1 - 0.85) + 0.85; // Simulated AI Score

  try {
    await c.env.DB.prepare(`
      INSERT INTO claims (claim_id, patient_oid, provider_oid, facility_oid, total_amount, status, diagnosis_code, normalization_confidence, scenario)
      VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?)
    `).bind(
      claimId, 
      body.patientOID, 
      body.providerOID, 
      body.facilityOID, 
      totalAmount,
      body.diagnosisCode,
      normalizationConfidence,
      body.scenario || 'success'
    ).run();

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
      normalizationConfidence,
      message: 'Enhanced claim created'
    }, 201);

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// NPHIES Simulation with Scenarios
app.post('/api/claims/:claimId/submit-nphies', async (c) => {
  const claimId = c.req.param('claimId');
  const nphiesId = `NPH-${Math.random().toString(36).substring(7).toUpperCase()}`;

  try {
    const claim = await c.env.DB.prepare('SELECT * FROM claims WHERE claim_id = ?').bind(claimId).first<any>();
    if (!claim) return c.json({ error: 'Claim not found' }, 404);

    const scenario = claim.scenario || 'success';
    let status = 'submitted';
    let rejectionReason = null;

    // Simulate Scenarios
    if (scenario === 'nphies_rejected') {
      status = 'rejected';
      rejectionReason = 'Invalid diagnosis code for procedure';
    } else if (scenario === 'validation_error') {
      return c.json({ success: false, error: 'Validation Error: Missing provider signature' }, 400);
    } else if (scenario === 'requires_preauth') {
      status = 'under_review';
    }

    await c.env.DB.prepare(`
      UPDATE claims 
      SET status = ?, nphies_id = ?, submitted_at = CURRENT_TIMESTAMP, rejection_reason = ?
      WHERE claim_id = ?
    `).bind(status, nphiesId, rejectionReason, claimId).run();

    return c.json({
      success: status !== 'rejected',
      nphiesId,
      status,
      rejectionReason,
      message: `Claim processed with scenario: ${scenario}`
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
