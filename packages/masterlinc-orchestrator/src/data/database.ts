/**
 * Unified Database Layer
 * PostgreSQL for relational data, Redis for caching, MongoDB for documents
 */

import { Pool, type PoolClient } from 'pg';
import Redis from 'ioredis';
import { MongoClient, type Db } from 'mongodb';
import { pino } from 'pino';

const logger = pino({ name: 'database' });

export class DatabaseManager {
  private pgPool: Pool;
  private redis: Redis;
  private mongoClient: MongoClient;
  private mongodb: Db | null = null;

  constructor() {
    // PostgreSQL configuration
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'masterlinc',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Redis configuration
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    // MongoDB configuration
    this.mongoClient = new MongoClient(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        maxPoolSize: 10,
        minPoolSize: 2,
      },
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.pgPool.on('error', (err) => {
      logger.error({ error: err.message }, 'PostgreSQL pool error');
    });

    this.redis.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }

  /**
   * Initialize database connections and schemas
   */
  async initialize(): Promise<void> {
    logger.info('Initializing database connections');

    try {
      // Test PostgreSQL connection
      const pgClient = await this.pgPool.connect();
      await pgClient.query('SELECT NOW()');
      pgClient.release();
      logger.info('PostgreSQL connected');

      // Initialize MongoDB
      await this.mongoClient.connect();
      this.mongodb = this.mongoClient.db(process.env.MONGODB_DB || 'masterlinc');
      logger.info('MongoDB connected');

      // Create schemas
      await this.createSchemas();

      logger.info('Database initialization complete');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize databases');
      throw error;
    }
  }

  /**
   * Create database schemas
   */
  private async createSchemas(): Promise<void> {
    logger.info('Creating database schemas');

    const schemas = [
      // Patients table
      `CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        oid VARCHAR(255) UNIQUE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) NOT NULL,
        phone VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        national_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Appointments table
      `CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID REFERENCES patients(id),
        doctor_id VARCHAR(255) NOT NULL,
        datetime TIMESTAMP NOT NULL,
        duration INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Claims table
      `CREATE TABLE IF NOT EXISTS claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        claim_id VARCHAR(255) UNIQUE NOT NULL,
        patient_oid VARCHAR(255) NOT NULL,
        provider_oid VARCHAR(255) NOT NULL,
        facility_oid VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        nphies_id VARCHAR(255),
        submitted_at TIMESTAMP,
        reviewed_at TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Call logs table
      `CREATE TABLE IF NOT EXISTS call_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        call_id VARCHAR(255) UNIQUE NOT NULL,
        from_number VARCHAR(50) NOT NULL,
        to_number VARCHAR(50) NOT NULL,
        direction VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        patient_id UUID REFERENCES patients(id),
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Workflow states table
      `CREATE TABLE IF NOT EXISTS workflow_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_id VARCHAR(255) UNIQUE NOT NULL,
        patient_id UUID REFERENCES patients(id),
        current_phase VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Audit logs table
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        actor VARCHAR(255) NOT NULL,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone)`,
      `CREATE INDEX IF NOT EXISTS idx_patients_oid ON patients(oid)`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)`,
      `CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(datetime)`,
      `CREATE INDEX IF NOT EXISTS idx_claims_patient_oid ON claims(patient_oid)`,
      `CREATE INDEX IF NOT EXISTS idx_claims_nphies ON claims(nphies_id)`,
      `CREATE INDEX IF NOT EXISTS idx_call_logs_patient ON call_logs(patient_id)`,
      `CREATE INDEX IF NOT EXISTS idx_workflow_states_patient ON workflow_states(patient_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`,
    ];

    const client = await this.pgPool.connect();
    try {
      for (const schema of schemas) {
        await client.query(schema);
      }
      logger.info('PostgreSQL schemas created');
    } finally {
      client.release();
    }

    // Create MongoDB collections and indexes
    if (this.mongodb) {
      await this.mongodb.collection('call_transcripts').createIndex({ call_id: 1 });
      await this.mongodb.collection('medical_records').createIndex({ patient_oid: 1 });
      await this.mongodb.collection('ai_conversations').createIndex({ session_id: 1 });
      logger.info('MongoDB indexes created');
    }
  }

  /**
   * PostgreSQL operations
   */
  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pgPool.query(text, params);
      const duration = Date.now() - start;
      logger.debug({ query: text, duration }, 'PostgreSQL query executed');
      return result;
    } catch (error: any) {
      logger.error({ error: error.message, query: text }, 'PostgreSQL query failed');
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pgPool.connect();
  }

  /**
   * Redis caching operations
   */
  async cacheGet(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error: any) {
      logger.error({ error: error.message, key }, 'Redis get failed');
      return null;
    }
  }

  async cacheSet(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error: any) {
      logger.error({ error: error.message, key }, 'Redis set failed');
    }
  }

  async cacheDel(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error: any) {
      logger.error({ error: error.message, key }, 'Redis delete failed');
    }
  }

  async cacheGetJSON<T>(key: string): Promise<T | null> {
    const value = await this.cacheGet(key);
    return value ? JSON.parse(value) : null;
  }

  async cacheSetJSON(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheSet(key, JSON.stringify(value), ttl);
  }

  /**
   * MongoDB operations
   */
  getMongoDb(): Db {
    if (!this.mongodb) {
      throw new Error('MongoDB not initialized');
    }
    return this.mongodb;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    postgres: boolean;
    redis: boolean;
    mongodb: boolean;
  }> {
    const health = {
      postgres: false,
      redis: false,
      mongodb: false,
    };

    try {
      await this.pgPool.query('SELECT 1');
      health.postgres = true;
    } catch (error) {
      logger.error('PostgreSQL health check failed');
    }

    try {
      await this.redis.ping();
      health.redis = true;
    } catch (error) {
      logger.error('Redis health check failed');
    }

    try {
      if (this.mongodb) {
        await this.mongodb.command({ ping: 1 });
        health.mongodb = true;
      }
    } catch (error) {
      logger.error('MongoDB health check failed');
    }

    return health;
  }

  /**
   * Cleanup connections
   */
  async close(): Promise<void> {
    logger.info('Closing database connections');
    await this.pgPool.end();
    await this.redis.quit();
    await this.mongoClient.close();
    logger.info('Database connections closed');
  }
}
