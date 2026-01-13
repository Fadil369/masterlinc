import { z } from 'zod'
import type { ConfigLoader, EnvironmentName, MasterlincConfig } from './contracts'

const LocalizedLabelSchema = z.object({ en: z.string().min(1), ar: z.string().min(1) })

const AgentTypeBaseSchema = z.object({
  type: z.string().min(1),
  category: z.enum(['healthcare', 'business', 'automation', 'content', 'security']),
  labels: LocalizedLabelSchema,
  defaultEndpoint: z.string().min(1),
  defaultCapabilities: z.array(z.string().min(1)).min(1),
  limits: z.object({
    maxRps: z.number().int().min(1),
    maxConcurrentWorkflows: z.number().int().min(1)
  })
})

const OrchestrationAgentConfigSchema = AgentTypeBaseSchema.extend({
  type: z.literal('orchestration'),
  routingStrategy: z.enum(['priority', 'round_robin'])
})

const HealthcareAgentConfigSchema = AgentTypeBaseSchema.extend({
  type: z.literal('healthcare'),
  phiMode: z.enum(['strict', 'permissive'])
})

const RoutingAgentConfigSchema = AgentTypeBaseSchema.extend({
  type: z.literal('routing'),
  cacheTtlMs: z.number().int().min(0)
})

const AgentTypeConfigSchema = z.discriminatedUnion('type', [
  OrchestrationAgentConfigSchema,
  HealthcareAgentConfigSchema,
  RoutingAgentConfigSchema
])

const MasterlincConfigSchema = z.object({
  version: z.string().min(1),
  environment: z.enum(['dev', 'staging', 'prod']),
  language: z.enum(['en', 'ar']),
  agents: z.record(z.object({
    agentType: z.enum(['orchestration', 'healthcare', 'routing']),
    endpoint: z.string().min(1),
    enabled: z.boolean()
  })),
  agentTypes: z.array(AgentTypeConfigSchema).min(1)
})

export class ZodConfigLoader implements ConfigLoader {
  constructor(private readonly sources: Record<EnvironmentName, unknown>) {}

  load(env: EnvironmentName): MasterlincConfig {
    const src = this.sources[env]
    const parsed = MasterlincConfigSchema.safeParse(src)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`Config validation failed: ${msg}`)
    }
    return parsed.data as MasterlincConfig
  }

  validate(cfg: unknown): { ok: true; data: MasterlincConfig } | { ok: false; error: string } {
    const parsed = MasterlincConfigSchema.safeParse(cfg)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
    }
    return { ok: true, data: parsed.data as MasterlincConfig }
  }
}
