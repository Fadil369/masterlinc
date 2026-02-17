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
    const { licenseNumber, region, specialty } = req.body;
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

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'BrainSAIT DID Registry', didMethod: DID_METHOD });
});

const PORT = process.env.PORT || 3002;
async function start() {
  await initDatabase();
  app.listen(PORT, () => console.log(`🚀 DID Registry Service running on port ${PORT}`));
}
start();
