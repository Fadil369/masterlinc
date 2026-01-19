import { z } from 'zod'

export const AgentCapabilitySchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().min(1).max(256),
  version: z.string().min(1).max(32),
  enabled: z.boolean()
})

export const AgentSchema = z.object({
  agent_id: z.string().min(3).max(64).regex(/^[a-z][a-z0-9_-]*$/i),
  name: z.string().min(1).max(64),
  name_ar: z.string().min(1).max(64).optional(),
  description: z.string().min(1).max(256),
  description_ar: z.string().min(1).max(256).optional(),
  category: z.enum(['healthcare', 'business', 'automation', 'content', 'security']),
  status: z.enum(['online', 'offline', 'degraded', 'maintenance']),
  endpoint: z.string().url(),
  capabilities: z.array(AgentCapabilitySchema).min(1),
  last_heartbeat: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  languages: z.array(z.string().min(2).max(8)).min(1),
  priority: z.number().int().min(0).max(999)
})

export type AgentInput = z.input<typeof AgentSchema>

export function validateAgent(agent: unknown) {
  return AgentSchema.safeParse(agent)
}
