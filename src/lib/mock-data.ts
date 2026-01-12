import type { Agent, Message, SystemHealth } from './types'

export const mockAgents: Agent[] = [
  {
    agent_id: 'authlinc',
    name: 'AuthLINC',
    name_ar: 'أوثلينك',
    description: 'Authentication & Security Gateway',
    description_ar: 'بوابة المصادقة والأمان',
    category: 'security',
    status: 'online',
    endpoint: 'http://authlinc:8001',
    capabilities: [
      {
        name: 'authentication',
        description: 'User authentication and session management',
        version: '1.0.0',
        enabled: true
      },
      {
        name: 'authorization',
        description: 'Role-based access control',
        version: '1.0.0',
        enabled: true
      }
    ],
    last_heartbeat: new Date(Date.now() - 5000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 5000).toISOString(),
    languages: ['en', 'ar'],
    priority: 1
  },
  {
    agent_id: 'doctorlinc',
    name: 'DoctorLINC',
    name_ar: 'دكتورلينك',
    description: 'Clinical Decision Support System',
    description_ar: 'نظام دعم القرارات السريرية',
    category: 'healthcare',
    status: 'online',
    endpoint: 'http://doctorlinc:8010',
    capabilities: [
      {
        name: 'diagnosis',
        description: 'AI-powered diagnostic assistance',
        version: '2.1.0',
        enabled: true
      },
      {
        name: 'treatment',
        description: 'Treatment recommendations',
        version: '2.1.0',
        enabled: true
      },
      {
        name: 'fhir',
        description: 'FHIR integration for healthcare data',
        version: '1.5.0',
        enabled: true
      }
    ],
    last_heartbeat: new Date(Date.now() - 3000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    updated_at: new Date(Date.now() - 3000).toISOString(),
    languages: ['en', 'ar'],
    priority: 2
  },
  {
    agent_id: 'nurselinc',
    name: 'NurseLINC',
    name_ar: 'نرسلينك',
    description: 'Nursing Workflow Automation',
    description_ar: 'أتمتة سير عمل التمريض',
    category: 'healthcare',
    status: 'online',
    endpoint: 'http://nurselinc:8011',
    capabilities: [
      {
        name: 'care_plans',
        description: 'Patient care plan management',
        version: '1.8.0',
        enabled: true
      },
      {
        name: 'medication',
        description: 'Medication administration tracking',
        version: '1.8.0',
        enabled: true
      },
      {
        name: 'vitals',
        description: 'Vital signs monitoring',
        version: '1.8.0',
        enabled: true
      }
    ],
    last_heartbeat: new Date(Date.now() - 8000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    updated_at: new Date(Date.now() - 8000).toISOString(),
    languages: ['en', 'ar'],
    priority: 2
  },
  {
    agent_id: 'patientlinc',
    name: 'PatientLINC',
    name_ar: 'باتيانتلينك',
    description: 'Patient Engagement Platform',
    description_ar: 'منصة تفاعل المرضى',
    category: 'healthcare',
    status: 'degraded',
    endpoint: 'http://patientlinc:8012',
    capabilities: [
      {
        name: 'appointments',
        description: 'Appointment scheduling',
        version: '1.3.0',
        enabled: true
      },
      {
        name: 'communication',
        description: 'Patient-provider messaging',
        version: '1.3.0',
        enabled: false
      }
    ],
    last_heartbeat: new Date(Date.now() - 45000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 45000).toISOString(),
    languages: ['en', 'ar'],
    priority: 3
  },
  {
    agent_id: 'bizlinc',
    name: 'BizLINC',
    name_ar: 'بيزلينك',
    description: 'Business Intelligence & Analytics',
    description_ar: 'ذكاء الأعمال والتحليلات',
    category: 'business',
    status: 'online',
    endpoint: 'http://bizlinc:8020',
    capabilities: [
      {
        name: 'analytics',
        description: 'Business analytics and reporting',
        version: '3.0.0',
        enabled: true
      },
      {
        name: 'forecasting',
        description: 'Predictive analytics',
        version: '3.0.0',
        enabled: true
      }
    ],
    last_heartbeat: new Date(Date.now() - 6000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 6000).toISOString(),
    languages: ['en', 'ar'],
    priority: 4
  },
  {
    agent_id: 'contentlinc',
    name: 'ContentLINC',
    name_ar: 'كونتنتلينك',
    description: 'Content Generation & Management',
    description_ar: 'إنشاء وإدارة المحتوى',
    category: 'content',
    status: 'offline',
    endpoint: 'http://contentlinc:8030',
    capabilities: [
      {
        name: 'generation',
        description: 'AI content generation',
        version: '2.5.0',
        enabled: true
      },
      {
        name: 'translation',
        description: 'Multilingual translation',
        version: '2.5.0',
        enabled: true
      }
    ],
    last_heartbeat: new Date(Date.now() - 300000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 300000).toISOString(),
    languages: ['en', 'ar'],
    priority: 5
  }
]

export const mockMessages: Message[] = [
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
    status: 'delivered'
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
    status: 'delivered'
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
    status: 'delivered'
  }
]

export const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  services: [
    { name: 'Database', status: 'healthy' },
    { name: 'Redis Cache', status: 'healthy' },
    { name: 'Message Queue', status: 'healthy' },
    { name: 'WebSocket Server', status: 'healthy' }
  ],
  agents_registered: 6,
  active_connections: 5,
  uptime: 259200
}
