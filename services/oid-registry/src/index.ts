import express from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import crypto from 'crypto';

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

// Generate FHIR code for OID
app.post('/api/oid/generate-fhir', async (req, res) => {
  try {
    const { oid, resourceType = 'Identifier' } = req.body;
    
    if (!oid) {
      return res.status(400).json({ success: false, error: 'OID required' });
    }

    const fhirCode = {
      resourceType,
      system: `urn:oid:${oid}`,
      value: oid,
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'OID',
          display: 'Object Identifier'
        }],
        text: 'BrainSAIT OID Identifier'
      },
      assigner: {
        display: `BrainSAIT Healthcare Platform (PEN ${PEN})`
      }
    };

    res.json({ success: true, fhir: fhirCode });
  } catch (error) {
    console.error('Error generating FHIR code:', error);
    res.status(500).json({ success: false, error: 'Failed to generate FHIR code' });
  }
});

// Generate QR code for OID (IoT devices)
app.post('/api/oid/generate-qr', async (req, res) => {
  try {
    const { oid, assetName, location, metadata = {} } = req.body;
    
    if (!oid) {
      return res.status(400).json({ success: false, error: 'OID required' });
    }

    const qrData = {
      oid,
      pen: PEN,
      asset: assetName || 'Unknown',
      location: location || 'Unknown',
      type: metadata.type || 'Device',
      timestamp: new Date().toISOString(),
      ...metadata
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      data: qrData
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ success: false, error: 'Failed to generate QR code' });
  }
});

// Validate OID format and structure
app.post('/api/oid/validate', async (req, res) => {
  try {
    const { oid } = req.body;
    
    if (!oid) {
      return res.status(400).json({ success: false, error: 'OID required' });
    }

    // OID format validation
    const oidPattern = /^([0-2])((\.0)|(\.[1-9][0-9]*))+$/;
    const isValidFormat = oidPattern.test(oid);
    
    // Check if it's under our PEN
    const isOurOID = oid.startsWith(ROOT_OID);

    // Check if exists in registry
    let exists = false;
    let metadata = null;
    if (isValidFormat) {
      const result = await pool.query('SELECT * FROM oid_registry WHERE oid = $1', [oid]);
      exists = result.rows.length > 0;
      metadata = exists ? result.rows[0] : null;
    }

    res.json({
      success: true,
      validation: {
        isValidFormat,
        isOurOID,
        existsInRegistry: exists,
        metadata
      }
    });
  } catch (error) {
    console.error('Error validating OID:', error);
    res.status(500).json({ success: false, error: 'Failed to validate OID' });
  }
});

// Register asset with OID (for IoT devices)
app.post('/api/oid/register-asset', async (req, res) => {
  try {
    const { assetName, assetType, location, manufacturer, model, serialNumber } = req.body;
    
    if (!assetName || !assetType) {
      return res.status(400).json({ success: false, error: 'Asset name and type required' });
    }

    // Generate OID for asset (branch 4.3 = infrastructure.iot_devices)
    const assetId = crypto.randomUUID();
    const oid = generateOID('4.3', assetId);

    // Register in OID registry
    const oidResult = await pool.query(
      `INSERT INTO oid_registry (oid, oid_branch, service_name, service_type, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        oid,
        '4.3',
        assetName,
        'iot_device',
        `IoT Device: ${assetType}`,
        JSON.stringify({ assetType, location, manufacturer, model, serialNumber })
      ]
    );

    // Register in assets table
    await pool.query(
      `INSERT INTO assets (asset_id, oid_identifier, asset_name, asset_type, manufacturer, model, serial_number, location, metadata, registered_by_service_oid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [assetId, oid, assetName, assetType, manufacturer, model, serialNumber, location, JSON.stringify({ registeredAt: new Date() }), oid]
    );

    // Generate QR code for asset
    const qrData = {
      oid,
      pen: PEN,
      asset: assetName,
      type: assetType,
      location,
      assetId
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300
    });

    res.status(201).json({
      success: true,
      oid,
      assetId,
      qrCode: qrCodeDataURL,
      data: oidResult.rows[0]
    });
  } catch (error) {
    console.error('Error registering asset:', error);
    res.status(500).json({ success: false, error: 'Failed to register asset' });
  }
});

// Get OID hierarchy/tree
app.get('/api/oid/hierarchy', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT oid_branch, COUNT(*) as count FROM oid_registry GROUP BY oid_branch ORDER BY oid_branch'
    );

    const hierarchy = {
      root: ROOT_OID,
      pen: PEN,
      branches: {
        '1': 'Geographic Divisions',
        '2': 'Organizational Units',
        '3': 'Products & Services',
        '4': 'Infrastructure',
        '5': 'Doctor Workspace',
        '6': 'Patient Workflow'
      },
      statistics: result.rows
    };

    res.json({ success: true, hierarchy });
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hierarchy' });
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
