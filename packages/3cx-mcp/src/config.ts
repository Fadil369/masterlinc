import { z } from 'zod';

const envSchema = z.object({
  PBX_FQDN: z.string().min(1),
  PBX_USERNAME: z.string().email(),
  PBX_PASSWORD: z.string().min(1),
  PBX_DEFAULT_EXTENSION: z.string().default('12310'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  MASTERLINC_BASE_URL: z.string().url().optional(),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map(i => i.path.join('.')).join(', ');
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  return result.data;
}
