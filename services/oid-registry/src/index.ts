import express from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// TODO: Add rate limiting for production deployment
// Recommended: Use express-rate-limit middleware
// Example: app.use('/api', rateLimit({ windowMs: 60000, max: 100 }))

const PEN = process.env.OID_PEN || '61026';
const ROOT_OID = `1.3.6.1.4.1.${PEN}`;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Redis connection
const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.connect();

// Initialize database
async function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS oid_registry (
      oid VARCHAR(255) PRIMARY KEY,
      oid_branch VARCHAR(100),
      service_name VARCHAR(255),
      service_type VARCHAR(50),
      description TEXT,
      pen_number INTEGER DEFAULT ${PEN},
      is_active BOOLEAN DEFAULT true,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_oid_branch ON oid_registry(oid_branch);
    CREATE INDEX IF NOT EXISTS idx_service_name ON oid_registry(service_name);
    CREATE INDEX IF NOT EXISTS idx_service_type ON oid_registry(service_type);
  `;
  await pool.query(schema);
  console.log('✅ OID Registry database initialized');
}

// Generate OID
function generateOID(branch: string, id: string): string {
  return `${ROOT_OID}.${branch}.${id}`;
}

// Register OID endpoint
app.post('/api/oid/register', async (req, res) => {
  try {
    const { branch, serviceName, serviceType, description, metadata } = req.body;
    const timestamp = Date.now();
    const oid = generateOID(branch, timestamp.toString());

    const result = await pool.query(
      `INSERT INTO oid_registry (oid, oid_branch, service_name, service_type, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [oid, branch, serviceName, serviceType, description, JSON.stringify(metadata)]
    );

    await redis.set(`oid:${oid}`, JSON.stringify(result.rows[0]), { EX: 3600 });

    res.status(201).json({ success: true, oid, data: result.rows[0] });
  } catch (error) {
    console.error('Error registering OID:', error);
    res.status(500).json({ success: false, error: 'Failed to register OID' });
  }
});

// Resolve OID endpoint
app.get('/api/oid/resolve/:oid', async (req, res) => {
  try {
    const { oid } = req.params;
    const cached = await redis.get(`oid:${oid}`);
    
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
    }

    const result = await pool.query('SELECT * FROM oid_registry WHERE oid = $1', [oid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'OID not found' });
    }

    await redis.set(`oid:${oid}`, JSON.stringify(result.rows[0]), { EX: 3600 });
    res.json({ success: true, data: result.rows[0], source: 'database' });
  } catch (error) {
    console.error('Error resolving OID:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve OID' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BrainSAIT OID Registry',
    pen: PEN,
    root_oid: ROOT_OID,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 OID Registry Service running on port ${PORT}`);
      console.log(`📍 Root OID: ${ROOT_OID}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
