import type { Agent, AgentCapability, AgentCategory, AgentStatus } from '@/lib/types'

/**
 * Fluent Builder for Agent objects.
 * Use factories for defaults, then override fields using this builder.
 */
export class AgentBuilder {
  private agent: Agent

  constructor(seed: Agent) {
    // clone to avoid mutating seeds
    this.agent = { ...seed, capabilities: [...seed.capabilities] }
  }

  static from(seed: Agent): AgentBuilder {
    return new AgentBuilder(seed)
  }

  withId(agent_id: string): this {
    this.agent.agent_id = agent_id
    return this
  }

  withName(name: string, name_ar?: string): this {
    this.agent.name = name
    this.agent.name_ar = name_ar
    return this
  }

  withDescription(description: string, description_ar?: string): this {
    this.agent.description = description
    this.agent.description_ar = description_ar
    return this
  }

  withCategory(category: AgentCategory): this {
    this.agent.category = category
    return this
  }

  withStatus(status: AgentStatus): this {
    this.agent.status = status
    return this
  }

  withEndpoint(endpoint: string): this {
    this.agent.endpoint = endpoint
    return this
  }

  withPriority(priority: number): this {
    this.agent.priority = priority
    return this
  }

  withLanguages(languages: string[]): this {
    this.agent.languages = [...languages]
    return this
  }

  withCapabilities(capabilities: AgentCapability[]): this {
    this.agent.capabilities = [...capabilities]
    return this
  }

  addCapability(cap: AgentCapability): this {
    this.agent.capabilities = [...this.agent.capabilities, cap]
    return this
  }

  setCapabilityEnabled(name: string, enabled: boolean): this {
    this.agent.capabilities = this.agent.capabilities.map((c) => (c.name === name ? { ...c, enabled } : c))
    return this
  }

  withHeartbeat(last_heartbeat?: string): this {
    this.agent.last_heartbeat = last_heartbeat
    return this
  }

  withTimestamps(created_at: string, updated_at: string): this {
    this.agent.created_at = created_at
    this.agent.updated_at = updated_at
    return this
  }

  build(): Agent {
    return { ...this.agent, capabilities: [...this.agent.capabilities] }
  }
}
