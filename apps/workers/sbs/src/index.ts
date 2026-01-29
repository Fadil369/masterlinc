import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { ClaimCreateRequest } from '@brainsait/sbs-types';

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
  API_KEY?: string; // Optional API key for authentication
};

type AppContext = Context<{ Bindings: Bindings }>;

const app = new Hono<{ Bindings: Bindings }>();

// CORS configuration - environment-aware
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = [
      'https://brainsait.com',
      'https://healthcare.brainsait.com',
      'https://masterlinc.brainsait.com'
    ];
    
    // Allow requests without origin (e.g., server-to-server)
    if (!origin) return '*';
    
    // Check allowlist
    if (allowedOrigins.includes(origin)) return origin;
    
    // Allow GitHub Spark apps in any environment
    if (origin.endsWith('.github.app')) return origin;
    
    // In production, reject unknown origins; in dev allow all
    const env = (c as any)?.env?.ENVIRONMENT;
    if (env === 'production') {
      return ''; // Reject by returning empty string
    }
    
    return origin; // Development fallback
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Simple API key authentication middleware (optional - enabled when API_KEY is set)
const authenticate = async (c: AppContext, next: () => Promise<void>) => {
  // Skip auth for health endpoint
  if (c.req.path === '/health') {
    return next();
  }
  
  // If API_KEY is configured, enforce authentication
  if (c.env.API_KEY) {
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!apiKey || apiKey !== c.env.API_KEY) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }
  
  return next();
};

app.use('/api/*', authenticate);

// Input validation helpers
const validateOID = (oid: string | undefined): boolean => {
  // OID should be a string with alphanumeric characters, dots, and underscores
  if (typeof oid !== 'string' || oid.length === 0 || oid.length > 255) {
    return false;
  }
  // Basic pattern: alphanumeric, dots, underscores, hyphens
  return /^[a-zA-Z0-9._-]+$/.test(oid);
};

const validateClaimId = (claimId: string | undefined): boolean => {
  // Claim ID must start with 'claim_' and contain only alphanumeric chars and underscores
  if (typeof claimId !== 'string' || !claimId.startsWith('claim_')) {
    return false;
  }
  return /^claim_[a-zA-Z0-9_]+$/.test(claimId);
};

const validateService = (service: any): { valid: boolean; error?: string } => {
  if (!service.code || typeof service.code !== 'string') {
    return { valid: false, error: 'Service code is required' };
  }
  if (typeof service.quantity !== 'number' || service.quantity <= 0 || service.quantity > 10000) {
    return { valid: false, error: 'Service quantity must be a positive number (max 10000)' };
  }
  if (typeof service.unitPrice !== 'number' || service.unitPrice < 0 || service.unitPrice > 1000000) {
    return { valid: false, error: 'Service unit price must be non-negative (max 1000000)' };
  }
  if (!service.providerId || typeof service.providerId !== 'string') {
    return { valid: false, error: 'Service provider ID is required' };
  }
  return { valid: true };
};

// Error logging helper (logs detailed error, returns generic message)
const handleError = (error: any, operation: string): { message: string } => {
  console.error(`[SBS Worker] ${operation} failed:`, error.message || error);
  return { message: 'An internal error occurred' };
};

// Generate unique claim ID using timestamp + crypto random
const generateClaimId = (): string => {
  const timestamp = Date.now();
  const randomPart = crypto.randomUUID().split('-')[0]; // First segment of UUID
  return `claim_${timestamp}_${randomPart}`;
};

// Health Check (public endpoint)
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'SBS Dynamic Claims Management',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Enhanced Claim Creation with validation
app.post('/api/claims/create', async (c) => {
  let body: ClaimCreateRequest;
  
  try {
    body = await c.req.json<ClaimCreateRequest>();
  } catch (e) {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  // Validate required fields
  if (!validateOID(body.patientOID)) {
    return c.json({ success: false, error: 'Invalid patient OID' }, 400);
  }
  if (!validateOID(body.providerOID)) {
    return c.json({ success: false, error: 'Invalid provider OID' }, 400);
  }
  if (!validateOID(body.facilityOID)) {
    return c.json({ success: false, error: 'Invalid facility OID' }, 400);
  }
  
  // Validate services array
  if (!Array.isArray(body.services) || body.services.length === 0) {
    return c.json({ success: false, error: 'At least one service is required' }, 400);
  }
  
  if (body.services.length > 100) {
    return c.json({ success: false, error: 'Maximum 100 services per claim' }, 400);
  }
  
  for (const service of body.services) {
    const validation = validateService(service);
    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }
  }
  
  // Validate diagnosis code format if provided
  if (body.diagnosisCode && (typeof body.diagnosisCode !== 'string' || body.diagnosisCode.length > 20)) {
    return c.json({ success: false, error: 'Invalid diagnosis code format' }, 400);
  }
  
  // Validate scenario if provided
  const validScenarios = ['success', 'normalization_failed', 'bundle_applied', 'high_value_claim', 
                          'multi_service', 'requires_preauth', 'validation_error', 'nphies_rejected'];
  if (body.scenario && !validScenarios.includes(body.scenario)) {
    return c.json({ success: false, error: 'Invalid scenario' }, 400);
  }

  const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  // Calculate total amount with validation
  const totalAmount = body.services.reduce((sum, s) => {
    const serviceTotal = s.quantity * s.unitPrice;
    if (!Number.isFinite(serviceTotal)) return sum;
    return sum + serviceTotal;
  }, 0);
  
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    return c.json({ success: false, error: 'Invalid total amount calculation' }, 400);
  }
  
  const normalizationConfidence = Math.random() * (1 - 0.85) + 0.85;

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
      body.diagnosisCode || null,
      normalizationConfidence,
      body.scenario || 'success'
    ).run();

    const serviceStatements = body.services.map(s => {
      const totalPrice = s.quantity * s.unitPrice;
      return c.env.DB.prepare(`
        INSERT INTO claim_services (claim_id, code, description, quantity, unit_price, total_price, provider_id, service_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(claimId, s.code, s.description || '', s.quantity, s.unitPrice, totalPrice, s.providerId);
    });

    await c.env.DB.batch(serviceStatements);

    return c.json({
      success: true,
      claimId,
      totalAmount,
      normalizationConfidence,
      message: 'Claim created successfully'
    }, 201);

  } catch (error: any) {
    const { message } = handleError(error, 'Claim creation');
    return c.json({ success: false, error: message }, 500);
  }
});

// NPHIES Simulation with Scenarios
app.post('/api/claims/:claimId/submit-nphies', async (c) => {
  const claimId = c.req.param('claimId');
  
  // Validate claim ID format
  if (!claimId || !claimId.startsWith('claim_')) {
    return c.json({ error: 'Invalid claim ID format' }, 400);
  }
  
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
    const { message } = handleError(error, 'NPHIES submission');
    return c.json({ error: message }, 500);
  }
});

/**
 * List Claims by Patient OID
 */
app.get('/api/claims/patient/:oid', async (c) => {
  const oid = c.req.param('oid');
  
  if (!validateOID(oid)) {
    return c.json({ error: 'Invalid patient OID' }, 400);
  }
  
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM claims WHERE patient_oid = ? ORDER BY created_at DESC LIMIT 100')
      .bind(oid)
      .all();
    return c.json(results);
  } catch (error: any) {
    const { message } = handleError(error, 'List patient claims');
    return c.json({ error: message }, 500);
  }
});

/**
 * Get Claim Details by Claim ID
 */
app.get('/api/claims/:claimId', async (c) => {
  const claimId = c.req.param('claimId');
  
  if (!claimId || !claimId.startsWith('claim_')) {
    return c.json({ error: 'Invalid claim ID format' }, 400);
  }
  
  try {
    const claim = await c.env.DB.prepare('SELECT * FROM claims WHERE claim_id = ?')
      .bind(claimId)
      .first<any>();
    
    if (!claim) {
      return c.json({ error: 'Claim not found' }, 404);
    }

    const { results: services } = await c.env.DB.prepare(
      'SELECT * FROM claim_services WHERE claim_id = ? ORDER BY service_date ASC'
    ).bind(claimId).all();

    return c.json({
      ...claim,
      services: services || []
    });
  } catch (error: any) {
    const { message } = handleError(error, 'Get claim details');
    return c.json({ error: message }, 500);
  }
});

/**
 * Update Claim Status - using explicit field mapping (no dynamic SQL)
 */
app.patch('/api/claims/:claimId/status', async (c) => {
  const claimId = c.req.param('claimId');
  
  if (!claimId || !claimId.startsWith('claim_')) {
    return c.json({ error: 'Invalid claim ID format' }, 400);
  }
  
  let body: { status: string; rejectionReason?: string };
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  
  const { status, rejectionReason } = body;
  
  const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'paid'];
  if (!status || !validStatuses.includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }
  
  // Validate rejection reason length if provided
  if (rejectionReason && (typeof rejectionReason !== 'string' || rejectionReason.length > 500)) {
    return c.json({ error: 'Invalid rejection reason' }, 400);
  }

  try {
    const claim = await c.env.DB.prepare('SELECT * FROM claims WHERE claim_id = ?')
      .bind(claimId)
      .first<any>();
    
    if (!claim) {
      return c.json({ error: 'Claim not found' }, 404);
    }

    // Use explicit queries for each status type to avoid dynamic SQL construction
    if (status === 'rejected' && rejectionReason) {
      await c.env.DB.prepare(
        `UPDATE claims SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE claim_id = ?`
      ).bind(status, rejectionReason, claimId).run();
    } else if (status === 'approved' || status === 'partially_approved') {
      await c.env.DB.prepare(
        `UPDATE claims SET status = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE claim_id = ?`
      ).bind(status, claimId).run();
    } else if (status === 'paid') {
      await c.env.DB.prepare(
        `UPDATE claims SET status = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE claim_id = ?`
      ).bind(status, claimId).run();
    } else {
      await c.env.DB.prepare(
        `UPDATE claims SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE claim_id = ?`
      ).bind(status, claimId).run();
    }

    return c.json({ 
      success: true, 
      claimId, 
      status,
      message: `Claim status updated to ${status}` 
    });
  } catch (error: any) {
    const { message } = handleError(error, 'Update claim status');
    return c.json({ error: message }, 500);
  }
});

/**
 * List all claims with optional filters and bounded pagination
 */
app.get('/api/claims', async (c) => {
  const status = c.req.query('status');
  const facilityOid = c.req.query('facility_oid');
  
  // Bound pagination values to prevent DoS
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50') || 50, 1), 100);
  const offset = Math.max(parseInt(c.req.query('offset') || '0') || 0, 0);

  // Validate status if provided
  const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'paid'];
  if (status && !validStatuses.includes(status)) {
    return c.json({ error: 'Invalid status filter' }, 400);
  }
  
  // Validate facility OID if provided
  if (facilityOid && !validateOID(facilityOid)) {
    return c.json({ error: 'Invalid facility OID' }, 400);
  }

  try {
    let query = 'SELECT * FROM claims WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (facilityOid) {
      query += ' AND facility_oid = ?';
      params.push(facilityOid);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    return c.json({
      claims: results || [],
      pagination: { limit, offset }
    });
  } catch (error: any) {
    const { message } = handleError(error, 'List claims');
    return c.json({ error: message }, 500);
  }
});

/**
 * Get claim statistics
 */
app.get('/api/statistics/claims', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_claims,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_amount
      FROM claims
    `).first<any>();

    return c.json(stats);
  } catch (error: any) {
    const { message } = handleError(error, 'Get claim statistics');
    return c.json({ error: message }, 500);
  }
});

export default app;
