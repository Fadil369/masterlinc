import type { MasterlincConfig } from './contracts'

/**
 * AgentConfigBuilder
 *
 * Safe, composable config mutations.
 * Produces new immutable config objects.
 */
export class AgentConfigBuilder {
  constructor(private cfg: MasterlincConfig) {}

  static from(cfg: MasterlincConfig): AgentConfigBuilder {
    return new AgentConfigBuilder(cfg)
  }

  setAgentEndpoint(agentId: string, endpoint: string): this {
    const existing = this.cfg.agents[agentId]
    if (!existing) throw new Error(`Unknown agent: ${agentId}`)

    this.cfg = {
      ...this.cfg,
      agents: {
        ...this.cfg.agents,
        [agentId]: { ...existing, endpoint }
      }
    }
    return this
  }

  setAgentEnabled(agentId: string, enabled: boolean): this {
    const existing = this.cfg.agents[agentId]
    if (!existing) throw new Error(`Unknown agent: ${agentId}`)

    this.cfg = {
      ...this.cfg,
      agents: {
        ...this.cfg.agents,
        [agentId]: { ...existing, enabled }
      }
    }
    return this
  }

  bumpVersion(nextVersion: string): this {
    this.cfg = { ...this.cfg, version: nextVersion }
    return this
  }

  build(): MasterlincConfig {
    return this.cfg
  }
}
