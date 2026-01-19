import type { Agent } from '@/lib/types'
import { AgentFactory } from '../agent-factory'
import { CapabilityCatalog } from '../capabilities'

/** Orchestration agent specialization (MASTERLINC). */
export class OrchestrationAgentFactory {
  constructor(private readonly base: AgentFactory) {}

  createMasterlinc(): Agent {
    return this.base.createBase({
      agent_id: 'masterlinc',
      name: 'MASTERLINC',
      name_ar: 'ماسترلينك',
      description: 'Central orchestration brain (routing, policy, workflows)',
      description_ar: 'العقل المركزي للتنسيق (التوجيه، السياسات، سير العمل)',
      category: 'automation',
      status: 'online',
      endpoint: 'http://masterlinc:8000',
      capabilities: [
        CapabilityCatalog.registry(true),
        CapabilityCatalog.routing(true),
        CapabilityCatalog.workflows(true),
        CapabilityCatalog.policy(true)
      ],
      priority: 0,
      created_offset_days: 120,
      last_heartbeat_offset_ms: 2000
    })
  }
}
