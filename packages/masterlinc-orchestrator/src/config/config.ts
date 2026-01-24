/**
 * Configuration
 * Centralized configuration management
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  // Server
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database - PostgreSQL
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432'),
  POSTGRES_DB: z.string().default('masterlinc'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  
  // Database - Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // Database - MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017'),
  MONGODB_DB: z.string().default('masterlinc'),
  
  // Services
  BASMA_URL: z.string().default('https://basma-voice-chat-app--fadil369.github.app'),
  HEALTHCARE_URL: z.string().default('https://brainsait-healthcare--fadil369.github.app'),
  OID_URL: z.string().default('https://brainsait-oid-integr--fadil369.github.app'),
  SBS_URL: z.string().default('https://sbs--fadil369.github.app'),
  
  // AI & NLP
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Monitoring
  HEALTH_CHECK_INTERVAL: z.string().default('30000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Failed to load configuration');
  }
}
