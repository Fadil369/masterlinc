import type { AgentCategory, Language } from '@/lib/types'

export type EnvironmentName = 'dev' | 'staging' | 'prod'

export interface LocalizedLabel {
  en: string
  ar: string
}

export interface AgentTypeConfigBase {
  type: string
  category: AgentCategory
  labels: LocalizedLabel
  defaultEndpoint: string
  defaultCapabilities: string[]
  limits: {
    maxRps: number
    maxConcurrentWorkflows: number
  }
}

export interface OrchestrationAgentConfig extends AgentTypeConfigBase {
  type: 'orchestration'
  routingStrategy: 'priority' | 'round_robin'
}

export interface HealthcareAgentConfig extends AgentTypeConfigBase {
  type: 'healthcare'
  /** controls handling of PHI in messages (placeholder for future crypto integration) */
  phiMode: 'strict' | 'permissive'
}

export interface RoutingAgentConfig extends AgentTypeConfigBase {
  type: 'routing'
  cacheTtlMs: number
}

export type AgentTypeConfig = OrchestrationAgentConfig | HealthcareAgentConfig | RoutingAgentConfig

export interface MasterlincConfig {
  version: string
  environment: EnvironmentName
  language: Language
  agents: Record<string, {
    agentType: AgentTypeConfig['type']
    endpoint: string
    enabled: boolean
  }>
  agentTypes: AgentTypeConfig[]
}

export interface ConfigChange {
  id: string
  ts: number
  actor?: string
  fromVersion: string
  toVersion: string
  reason?: string
}

export interface ConfigStore {
  getCurrent(): MasterlincConfig
  listVersions(): string[]
  rollback(toVersion: string, reason?: string): void
  commit(next: MasterlincConfig, reason?: string): void
  onChange(listener: (cfg: MasterlincConfig, change: ConfigChange) => void): () => void
  getAuditTrail(): ConfigChange[]
}

export interface ConfigLoader {
  load(env: EnvironmentName): MasterlincConfig
  validate(cfg: unknown): { ok: true; data: MasterlincConfig } | { ok: false; error: string }
}
