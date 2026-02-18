import { z } from 'zod'

export const configSchema = z.object({
  PORT: z.coerce.number().default(7400),
  NODE_ENV: z.string().default('development'),

  // Notion
  NOTION_TOKEN: z.string().min(10),

  // optional API-key for this bridge
  NOTION_BRIDGE_API_KEY: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = configSchema.safeParse(env)
  if (!parsed.success) {
    // Do NOT print token; only print schema errors.
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid configuration:\n${msg}`)
  }
  return parsed.data
}
