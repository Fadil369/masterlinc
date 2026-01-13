import type { Agent, Message, SystemHealth } from '@/lib/types'
import { AgentFactory } from './agent-factory'
import { OrchestrationAgentFactory } from './specialization/orchestration-factory'
import { HealthcareAgentFactory } from './specialization/healthcare-factory'
import { RoutingAgentFactory } from './specialization/routing-factory'
import { MOCK_DATA_VERSION } from './versioning'

export type MockScenario = 'default' | 'degraded-mode' | 'failover'

export interface MockDataBundle {
  version: string
  scenario: MockScenario
  agents: Agent[]
  messages: Message[]
  systemHealth: SystemHealth
}

/**
 * Scenario-based mock data generator.
 * - "degraded-mode": simulates degraded patient-facing agent(s)
 * - "failover": simulates orchestrator maintenance + security/routing emphasis
 */
export class MockDataGenerator {
  private readonly baseFactory: AgentFactory
  private readonly orchestration: OrchestrationAgentFactory
  private readonly healthcare: HealthcareAgentFactory
  private readonly routing: RoutingAgentFactory

  constructor(params?: { now?: Date }) {
    this.baseFactory = new AgentFactory({ now: params?.now })
    this.orchestration = new OrchestrationAgentFactory(this.baseFactory)
    this.healthcare = new HealthcareAgentFactory(this.baseFactory)
    this.routing = new RoutingAgentFactory(this.baseFactory)
  }

  generate(scenario: MockScenario = 'default'): MockDataBundle {
    const agents = this.generateAgents(scenario)
    const messages = this.generateMessages()
    const systemHealth = this.generateSystemHealth(scenario)

    return {
      version: MOCK_DATA_VERSION,
      scenario,
      agents,
      messages,
      systemHealth
    }
  }

  private generateAgents(scenario: MockScenario): Agent[] {
    const masterlinc = this.orchestration.createMasterlinc()
    const authlinc = this.routing.createAuthlinc()
    const doctorlinc = this.healthcare.createDoctorlinc()
    const nurselinc = this.healthcare.createNurselinc()
    const patientlinc = this.healthcare.createPatientlinc({
      status: scenario === 'degraded-mode' ? 'degraded' : 'degraded'
    })
    const bizlinc = this.routing.createBizlinc()
    const contentlinc = this.routing.createContentlinc({
      status: scenario === 'failover' ? 'online' : 'offline'
    })

    if (scenario === 'failover') {
      // In failover, orchestrator is in maintenance but the rest remain available.
      // (In a real system there might be a secondary orchestrator.)
      const masterFailover = this.baseFactory
        .builder(masterlinc)
        .withStatus('maintenance')
        .withDescription('Orchestrator in maintenance (failover mode)', 'المنسق في وضع الصيانة (وضع التحويل)')
        .build()

      return [masterFailover, authlinc, doctorlinc, nurselinc, patientlinc, bizlinc, contentlinc]
    }

    return [masterlinc, authlinc, doctorlinc, nurselinc, patientlinc, bizlinc, contentlinc]
  }

  private generateMessages(): Message[] {
    return [
      {
        message_id: 'msg_001',
        sender_id: 'doctorlinc',
        receiver_id: 'nurselinc',
        content_type: 'application/json',
        content: {
          type: 'patient_referral',
          patient_id: 'p12345',
          priority: 'high',
          notes: 'Patient requires immediate vital monitoring'
        },
        timestamp: new Date(Date.now() - 30000).toISOString(),
        status: 'delivered',
        policy_tags: ['phi']
      },
      {
        message_id: 'msg_002',
        sender_id: 'patientlinc',
        receiver_id: 'doctorlinc',
        content_type: 'application/json',
        content: {
          type: 'appointment_request',
          patient_id: 'p67890',
          preferred_date: '2024-02-15',
          reason: 'Routine checkup'
        },
        timestamp: new Date(Date.now() - 60000).toISOString(),
        status: 'delivered',
        policy_tags: ['phi']
      },
      {
        message_id: 'msg_003',
        sender_id: 'bizlinc',
        receiver_id: 'doctorlinc',
        content_type: 'application/json',
        content: {
          type: 'analytics_report',
          report_id: 'rpt_789',
          summary: 'Patient volume trending upward'
        },
        timestamp: new Date(Date.now() - 90000).toISOString(),
        status: 'delivered',
        policy_tags: ['internal']
      }
    ]
  }

  private generateSystemHealth(scenario: MockScenario): SystemHealth {
    return {
      status: scenario === 'degraded-mode' ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      services: [
        { name: 'Database', status: 'healthy' },
        { name: 'Redis Cache', status: 'healthy' },
        { name: 'Message Queue', status: scenario === 'failover' ? 'degraded' : 'healthy' },
        { name: 'WebSocket Server', status: 'healthy' }
      ],
      agents_registered: 6,
      active_connections: scenario === 'failover' ? 12 : 5,
      uptime: 259200
    }
  }
}
