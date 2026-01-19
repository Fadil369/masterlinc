import type { Agent, SystemHealth } from '@/lib/types'
import type { AgentRegistryService, HealthCheckService } from './contracts'

/**
 * HealthCheckService
 *
 * Aggregates agent states into a SystemHealth model.
 * Intended for dashboard display (UI).
 */
export class DefaultHealthCheckService implements HealthCheckService {
  constructor(private readonly registry: AgentRegistryService) {}

  async aggregate(): Promise<SystemHealth> {
    const agents = await this.registry.listAgents()

    const offline = agents.filter((a) => a.status === 'offline').length
    const degraded = agents.filter((a) => a.status === 'degraded' || a.status === 'maintenance').length

    const status: SystemHealth['status'] = offline > 0 ? 'degraded' : degraded > 0 ? 'degraded' : 'healthy'

    return {
      status,
      timestamp: new Date().toISOString(),
      services: [
        { name: 'Agent Mesh', status: status === 'healthy' ? 'healthy' : 'degraded', message: `${agents.length} agents` }
      ],
      agents_registered: agents.length,
      active_connections: 0,
      uptime: 0
    }
  }
}
