import type { Agent } from '@/lib/types'
import { AgentFactory } from '../agent-factory'
import { CapabilityCatalog } from '../capabilities'

export class HealthcareAgentFactory {
  constructor(private readonly base: AgentFactory) {}

  createDoctorlinc(): Agent {
    return this.base.createBase({
      agent_id: 'doctorlinc',
      name: 'DoctorLINC',
      name_ar: 'دكتورلينك',
      description: 'Clinical Decision Support System',
      description_ar: 'نظام دعم القرارات السريرية',
      category: 'healthcare',
      status: 'online',
      endpoint: 'http://doctorlinc:8010',
      capabilities: [CapabilityCatalog.diagnosis(true), CapabilityCatalog.treatment(true), CapabilityCatalog.fhir(true)],
      priority: 2,
      created_offset_days: 60,
      last_heartbeat_offset_ms: 3000
    })
  }

  createNurselinc(): Agent {
    return this.base.createBase({
      agent_id: 'nurselinc',
      name: 'NurseLINC',
      name_ar: 'نرسلينك',
      description: 'Nursing Workflow Automation',
      description_ar: 'أتمتة سير عمل التمريض',
      category: 'healthcare',
      status: 'online',
      endpoint: 'http://nurselinc:8011',
      capabilities: [CapabilityCatalog.care_plans(true), CapabilityCatalog.medication(true), CapabilityCatalog.vitals(true)],
      priority: 2,
      created_offset_days: 45,
      last_heartbeat_offset_ms: 8000
    })
  }

  createPatientlinc(params?: { status?: 'online' | 'degraded' | 'offline' }): Agent {
    return this.base.createBase({
      agent_id: 'patientlinc',
      name: 'PatientLINC',
      name_ar: 'باتيانتلينك',
      description: 'Patient Engagement Platform',
      description_ar: 'منصة تفاعل المرضى',
      category: 'healthcare',
      status: params?.status ?? 'degraded',
      endpoint: 'http://patientlinc:8012',
      capabilities: [CapabilityCatalog.appointments(true), CapabilityCatalog.communication(false)],
      priority: 3,
      created_offset_days: 20,
      last_heartbeat_offset_ms: 45000
    })
  }
}
