import type { Agent } from '@/lib/types'
import { AgentFactory } from '../agent-factory'
import { CapabilityCatalog } from '../capabilities'

/** Routing + security edge agents. */
export class RoutingAgentFactory {
  constructor(private readonly base: AgentFactory) {}

  createAuthlinc(): Agent {
    return this.base.createBase({
      agent_id: 'authlinc',
      name: 'AuthLINC',
      name_ar: 'أوثلينك',
      description: 'Authentication & Security Gateway',
      description_ar: 'بوابة المصادقة والأمان',
      category: 'security',
      status: 'online',
      endpoint: 'http://authlinc:8001',
      capabilities: [CapabilityCatalog.authentication(true), CapabilityCatalog.authorization(true)],
      priority: 1,
      created_offset_days: 30,
      last_heartbeat_offset_ms: 5000
    })
  }

  createBizlinc(): Agent {
    return this.base.createBase({
      agent_id: 'bizlinc',
      name: 'BizLINC',
      name_ar: 'بيزلينك',
      description: 'Business Intelligence & Analytics',
      description_ar: 'ذكاء الأعمال والتحليلات',
      category: 'business',
      status: 'online',
      endpoint: 'http://bizlinc:8020',
      capabilities: [CapabilityCatalog.analytics(true), CapabilityCatalog.forecasting(true)],
      priority: 4,
      created_offset_days: 15,
      last_heartbeat_offset_ms: 6000
    })
  }

  createContentlinc(params?: { status?: 'online' | 'offline' | 'degraded' }): Agent {
    return this.base.createBase({
      agent_id: 'contentlinc',
      name: 'ContentLINC',
      name_ar: 'كونتنتلينك',
      description: 'Content Generation & Management',
      description_ar: 'إنشاء وإدارة المحتوى',
      category: 'content',
      status: params?.status ?? 'offline',
      endpoint: 'http://contentlinc:8030',
      capabilities: [CapabilityCatalog.generation(true), CapabilityCatalog.translation(true)],
      priority: 5,
      created_offset_days: 10,
      last_heartbeat_offset_ms: 300000
    })
  }
}
