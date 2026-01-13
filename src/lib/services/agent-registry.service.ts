import type { Agent } from '@/lib/types'
import type { AgentRegistryService } from './contracts'
import { ServiceError } from './errors'

/**
 * AgentRegistryService
 *
 * In-memory implementation used for local UI/demo.
 * Replace with a persistence-backed implementation in production.
 */
export class InMemoryAgentRegistryService implements AgentRegistryService {
  private readonly map = new Map<string, Agent>()

  constructor(seedAgents: Agent[] = []) {
    for (const a of seedAgents) this.map.set(a.agent_id, a)
  }

  async listAgents(): Promise<Agent[]> {
    return Array.from(this.map.values())
  }

  async getAgent(agentId: string): Promise<Agent | undefined> {
    return this.map.get(agentId)
  }

  async upsertAgent(agent: Agent): Promise<Agent> {
    if (!agent?.agent_id) throw new ServiceError('agent_id is required', 'VALIDATION_ERROR')
    this.map.set(agent.agent_id, agent)
    return agent
  }

  async deleteAgent(agentId: string): Promise<void> {
    if (!this.map.has(agentId)) throw new ServiceError('Agent not found', 'NOT_FOUND', { agentId })
    this.map.delete(agentId)
  }
}
