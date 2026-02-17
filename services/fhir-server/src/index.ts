/**
 * FHIR R4 Server Implementation
 * Compliant with HL7 FHIR R4 specification
 * Integrates with OID/DID registries and SBS
 */

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createClient } from 'redis'
import { Pool } from 'pg'
import pino from 'pino'
import pinoHttp from 'pino-http'
import dotenv from 'dotenv'

import { patientRouter } from './resources/patient'
import { practitionerRouter } from './resources/practitioner'
import { organizationRouter } from './resources/organization'
import { appointmentRouter } from './resources/appointment'
import { encounterRouter } from './resources/encounter'
import { claimRouter } from './resources/claim'
import { medicationRequestRouter } from './resources/medication-request'
import { diagnosticReportRouter } from './resources/diagnostic-report'
import { capabilityStatementRouter } from './metadata/capability-statement'
import { searchRouter } from './search/search-handler'

dotenv.config()

const app = express()
const logger = pino({ name: 'fhir-server' })

// Database setup
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
})

// Redis setup
export const redis = createClient({
  url: process.env.REDIS_URL,
})

redis.connect().catch((err) => {
  logger.error({ err }, 'Failed to connect to Redis')
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(pinoHttp({ logger }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
})

app.use('/fhir', limiter)

// FHIR metadata endpoint
app.use('/fhir/metadata', capabilityStatementRouter)

// FHIR resource endpoints
app.use('/fhir/Patient', patientRouter)
app.use('/fhir/Practitioner', practitionerRouter)
app.use('/fhir/Organization', organizationRouter)
app.use('/fhir/Appointment', appointmentRouter)
app.use('/fhir/Encounter', encounterRouter)
app.use('/fhir/Claim', claimRouter)
app.use('/fhir/MedicationRequest', medicationRequestRouter)
app.use('/fhir/DiagnosticReport', diagnosticReportRouter)

// FHIR search
app.use('/fhir', searchRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    fhirVersion: '4.0.1',
  })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path }, 'Unhandled error')
  
  res.status(500).json({
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: 'error',
        code: 'exception',
        diagnostics: err.message,
      },
    ],
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: 'error',
        code: 'not-found',
        diagnostics: `Resource not found: ${req.path}`,
      },
    ],
  })
})

// Database initialization
async function initDatabase() {
  const schema = `
    -- FHIR Resources table
    CREATE TABLE IF NOT EXISTS fhir_resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_type VARCHAR(50) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      version_id INTEGER NOT NULL DEFAULT 1,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      content JSONB NOT NULL,
      deleted BOOLEAN DEFAULT false,
      UNIQUE(resource_type, resource_id, version_id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_resource_type ON fhir_resources(resource_type);
    CREATE INDEX IF NOT EXISTS idx_resource_id ON fhir_resources(resource_id);
    CREATE INDEX IF NOT EXISTS idx_last_updated ON fhir_resources(last_updated);
    CREATE INDEX IF NOT EXISTS idx_content_gin ON fhir_resources USING GIN(content);

    -- Patient identifiers
    CREATE TABLE IF NOT EXISTS patient_identifiers (
      patient_id VARCHAR(255) PRIMARY KEY,
      national_id VARCHAR(100),
      medical_record_number VARCHAR(100),
      did VARCHAR(255),
      oid VARCHAR(255),
      FOREIGN KEY (patient_id) REFERENCES fhir_resources(resource_id)
    );

    -- Search parameters (for fast FHIR searches)
    CREATE TABLE IF NOT EXISTS search_parameters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_type VARCHAR(50) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      param_name VARCHAR(100) NOT NULL,
      param_value TEXT NOT NULL,
      param_type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_search_params ON search_parameters(resource_type, param_name, param_value);

    -- Audit trail
    CREATE TABLE IF NOT EXISTS fhir_audit (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      action VARCHAR(20) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(255),
      ip_address VARCHAR(45),
      changes JSONB
    );
  `

  await pool.query(schema)
  logger.info('FHIR database initialized')
}

// Start server
const PORT = process.env.FHIR_PORT || 8080

async function start() {
  try {
    await initDatabase()
    
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'FHIR server started')
      logger.info(`FHIR endpoint: http://localhost:${PORT}/fhir`)
      logger.info(`Capability statement: http://localhost:${PORT}/fhir/metadata`)
    })
  } catch (error) {
    logger.error({ error }, 'Failed to start FHIR server')
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing connections')
  await pool.end()
  await redis.quit()
  process.exit(0)
})
