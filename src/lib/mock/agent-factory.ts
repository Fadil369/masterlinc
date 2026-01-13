import type { Agent, AgentCapability, AgentCategory, AgentStatus } from '@/lib/types'
import { AgentBuilder } from './agent-builder'
import { validateAgent } from './validation'

export interface AgentFactoryOptions {
  now?: Date
}

/**
 * Base factory responsible for consistent Agent object construction.
 * Specialization factories should call createBase() then customize.
 */
export class AgentFactory {
  constructor(private readonly opts: AgentFactoryOptions = {}) {}

  createBase(params: {
    agent_id: string
    name: string
    description: string
    category: AgentCategory
    endpoint: string
    capabilities: AgentCapability[]
    status?: AgentStatus
    name_ar?: string
    description_ar?: string
    languages?: string[]
    priority?: number
    last_heartbeat_offset_ms?: number
    created_offset_days?: number
  }): Agent {
    const now = this.opts.now ?? new Date()
    const createdAt = new Date(now.getTime() - (params.created_offset_days ?? 1) * 86400000)
    const updatedAt = new Date(now.getTime() - (params.last_heartbeat_offset_ms ?? 0))

    const agent: Agent = {
      agent_id: params.agent_id,
      name: params.name,
      name_ar: params.name_ar,
      description: params.description,
      description_ar: params.description_ar,
      category: params.category,
      status: params.status ?? 'online',
      endpoint: params.endpoint,
      capabilities: params.capabilities,
      last_heartbeat: params.last_heartbeat_offset_ms !== undefined ? updatedAt.toISOString() : undefined,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
      languages: params.languages ?? ['en', 'ar'],
      priority: params.priority ?? 99
    }

    const parsed = validateAgent(agent)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new Error(`AgentFactory validation failed for ${params.agent_id}: ${msg}`)
    }

    return agent
  }

  builder(seed: Agent): AgentBuilder {
    return AgentBuilder.from(seed)
  }
}
