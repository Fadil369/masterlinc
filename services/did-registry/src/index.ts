import express from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { generateKeyPair } from '@stablelib/ed25519';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

// TODO: Add rate limiting for production deployment
// Recommended: Use express-rate-limit middleware
// Example: app.use('/api', rateLimit({ windowMs: 60000, max: 100 }))

const DID_METHOD = 'did:brainsait';
const OID_ROOT = process.env.OID_ROOT || '1.3.6.1.4.1.61026';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

async function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS did_registry (
      did VARCHAR(255) PRIMARY KEY,
      did_document JSONB NOT NULL,
      oid_identifier VARCHAR(255),
      public_key_multibase VARCHAR(255),
      key_pair_metadata JSONB,
      did_type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS did_oid_mapping (
      mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      did VARCHAR(255) REFERENCES did_registry(did),
      oid VARCHAR(255),
      mapping_type VARCHAR(50),
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_did_status ON did_registry(status);
    CREATE INDEX IF NOT EXISTS idx_did_type ON did_registry(did_type);
    CREATE INDEX IF NOT EXISTS idx_oid_mapping ON did_oid_mapping(oid);
  `;
  await pool.query(schema);
  console.log('✅ DID Registry database initialized');
}

function generateDID(type: string, id: string): string {
  return `${DID_METHOD}:${type}:${id}`;
}

function base58Encode(buffer: Uint8Array): string {
  return bs58.encode(buffer);
}

app.post('/api/did/doctor/create', async (req, res) => {
  try {
    const { licenseNumber, region, specialty, fullName, phone, email } = req.body;
    const doctorId = `dr-${licenseNumber || crypto.randomUUID()}`;
    const did = generateDID('doctors', doctorId);
    const keyPair = generateKeyPair();
    const publicKeyMultibase = `z${base58Encode(keyPair.publicKey)}`;
    const oid = `${OID_ROOT}.2.1.1.${doctorId}`;

    // SECURITY NOTE: In production, private keys should be:
    // 1. Encrypted before storage using a Key Management Service (KMS)
    // 2. Stored in a secure vault (e.g., HashiCorp Vault, AWS KMS)
    // 3. Never exposed in API responses or logs
    // 4. Only accessible through secure authentication
    // For this Phase 1 implementation, we store metadata about the key
    // but not the actual private key value.

    const didDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: did,
      verificationMethod: [{
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase,
      }],
      authentication: [`${did}#key-1`],
      alsoKnownAs: [`oid:${oid}`],
      brainSAIT: { oid, pen: '61026', region, specialty, license: { number: licenseNumber } },
    };

    await pool.query(
      `INSERT INTO did_registry (did, did_document, oid_identifier, public_key_multibase, did_type, key_pair_metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [did, JSON.stringify(didDocument), oid, publicKeyMultibase, 'doctor', JSON.stringify({ algorithm: 'Ed25519' })]
    );

    // Insert into doctors table
    await pool.query(
      `INSERT INTO doctors (license_number, did, did_document, oid_identifier, public_key_multibase, key_pair_metadata, full_name, specialty, region, phone, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (did) DO NOTHING`,
      [licenseNumber, did, JSON.stringify(didDocument), oid, publicKeyMultibase, JSON.stringify({ algorithm: 'Ed25519' }), fullName, specialty, region, phone, email]
    );

    await pool.query(
      `INSERT INTO did_oid_mapping (did, oid, mapping_type, verified_at) VALUES ($1, $2, $3, $4)`,
      [did, oid, 'doctor', new Date()]
    );

    await redis.set(`did:${did}`, JSON.stringify(didDocument), { EX: 3600 });

    res.status(201).json({
      success: true,
      did,
      didDocument,
      oid,
      publicKey: publicKeyMultibase,
      message: 'DID created successfully. Private key has been generated securely. In production, implement secure key storage (KMS/Vault).',
    });
  } catch (error) {
    console.error('Error creating doctor DID:', error);
    res.status(500).json({ success: false, error: 'Failed to create doctor DID' });
  }
});

// Issue verifiable credential
app.post('/api/did/credential/issue', async (req, res) => {
  try {
    const { doctorDid, credentialType, issuerDid, issuerName, credentialData, expiresInDays = 365 } = req.body;

    if (!doctorDid || !credentialType || !issuerDid) {
      return res.status(400).json({ success: false, error: 'doctorDid, credentialType, and issuerDid required' });
    }

    // Verify doctor exists
    const doctorResult = await pool.query('SELECT * FROM doctors WHERE did = $1', [doctorDid]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor DID not found' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const credential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', credentialType],
      issuer: issuerDid,
      issuanceDate: new Date().toISOString(),
      expirationDate: expiresAt.toISOString(),
      credentialSubject: {
        id: doctorDid,
        ...credentialData
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuerDid}#key-1`
      }
    };

    const vcId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO doctor_verifiable_credentials (vc_id, doctor_did, vc_type, issuer_did, issuer_name, credential_data, expires_at, proof)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [vcId, doctorDid, credentialType, issuerDid, issuerName, JSON.stringify(credentialData), expiresAt, JSON.stringify(credential.proof)]
    );

    res.status(201).json({
      success: true,
      credential,
      vcId
    });
  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({ success: false, error: 'Failed to issue credential' });
  }
});

// Verify credential
app.post('/api/did/credential/verify', async (req, res) => {
  try {
    const { vcId } = req.body;

    if (!vcId) {
      return res.status(400).json({ success: false, error: 'vcId required' });
    }

    const result = await pool.query('SELECT * FROM doctor_verifiable_credentials WHERE vc_id = $1', [vcId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Credential not found' });
    }

    const vc = result.rows[0];
    const isActive = vc.status === 'active';
    const isNotExpired = !vc.expires_at || new Date(vc.expires_at) > new Date();

    res.json({
      success: true,
      verification: {
        isValid: isActive && isNotExpired,
        isActive,
        isNotExpired,
        status: vc.status,
        expiresAt: vc.expires_at,
        credential: vc
      }
    });
  } catch (error) {
    console.error('Error verifying credential:', error);
    res.status(500).json({ success: false, error: 'Failed to verify credential' });
  }
});

// Revoke credential
app.post('/api/did/credential/revoke', async (req, res) => {
  try {
    const { vcId, reason } = req.body;

    if (!vcId) {
      return res.status(400).json({ success: false, error: 'vcId required' });
    }

    await pool.query(
      `UPDATE doctor_verifiable_credentials SET status = 'revoked' WHERE vc_id = $1`,
      [vcId]
    );

    res.json({ success: true, message: 'Credential revoked', reason });
  } catch (error) {
    console.error('Error revoking credential:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke credential' });
  }
});

// Resolve DID to document
app.get('/api/did/resolve/:did', async (req, res) => {
  try {
    const { did } = req.params;

    // Check cache first
    const cached = await redis.get(`did:${did}`);
    if (cached) {
      return res.json({ success: true, didDocument: JSON.parse(cached), source: 'cache' });
    }

    // Query database
    const result = await pool.query('SELECT * FROM did_registry WHERE did = $1', [did]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'DID not found' });
    }

    const didDocument = result.rows[0].did_document;
    await redis.set(`did:${did}`, JSON.stringify(didDocument), { EX: 3600 });

    res.json({ success: true, didDocument, source: 'database' });
  } catch (error) {
    console.error('Error resolving DID:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve DID' });
  }
});

// Get doctor's credentials
app.get('/api/did/doctor/:did/credentials', async (req, res) => {
  try {
    const { did } = req.params;

    const result = await pool.query(
      'SELECT * FROM doctor_verifiable_credentials WHERE doctor_did = $1 ORDER BY issued_at DESC',
      [did]
    );

    res.json({ success: true, credentials: result.rows });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch credentials' });
  }
});

// Create digital signature (simulated)
app.post('/api/did/sign', async (req, res) => {
  try {
    const { did, documentHash, documentType } = req.body;

    if (!did || !documentHash) {
      return res.status(400).json({ success: false, error: 'did and documentHash required' });
    }

    // Verify DID exists
    const result = await pool.query('SELECT * FROM did_registry WHERE did = $1', [did]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'DID not found' });
    }

    // Create signature (simulated - in production use actual cryptographic signing)
    const signature = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${did}#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue: crypto.createHash('sha256').update(`${did}:${documentHash}:${Date.now()}`).digest('hex')
    };

    res.json({
      success: true,
      signature,
      documentType,
      signer: did
    });
  } catch (error) {
    console.error('Error creating signature:', error);
    res.status(500).json({ success: false, error: 'Failed to create signature' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'BrainSAIT DID Registry', didMethod: DID_METHOD });
});

const PORT = process.env.PORT || 3002;
async function start() {
  await initDatabase();
  app.listen(PORT, () => console.log(`🚀 DID Registry Service running on port ${PORT}`));
}
start();
