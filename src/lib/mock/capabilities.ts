import type { AgentCapability } from '@/lib/types'

/**
 * Centralized capability definitions so all factories share consistent metadata.
 */
export const CapabilityCatalog = {
  registry: (enabled = true, version = '1.0.0'): AgentCapability => ({
    name: 'registry',
    description: 'Agent registry and capability discovery',
    version,
    enabled
  }),
  routing: (enabled = true, version = '1.0.0'): AgentCapability => ({
    name: 'routing',
    description: 'Message routing and delivery tracking',
    version,
    enabled
  }),
  workflows: (enabled = true, version = '1.0.0'): AgentCapability => ({
    name: 'workflows',
    description: 'Workflow definition and step execution',
    version,
    enabled
  }),
  policy: (enabled = true, version = '1.0.0'): AgentCapability => ({
    name: 'policy',
    description: 'Policy enforcement, audit, and safety guardrails',
    version,
    enabled
  }),
  authentication: (enabled = true, version = '1.0.0'): AgentCapability => ({
    name: 'authentication',
    description: 'User authentication and session management',
    version,
    enabled
  }),
  authorization: (enabled = true, version = '1.0.0'): AgentCapability => ({
    name: 'authorization',
    description: 'Role-based access control',
    version,
    enabled
  }),
  diagnosis: (enabled = true, version = '2.1.0'): AgentCapability => ({
    name: 'diagnosis',
    description: 'AI-powered diagnostic assistance',
    version,
    enabled
  }),
  treatment: (enabled = true, version = '2.1.0'): AgentCapability => ({
    name: 'treatment',
    description: 'Treatment recommendations',
    version,
    enabled
  }),
  fhir: (enabled = true, version = '1.5.0'): AgentCapability => ({
    name: 'fhir',
    description: 'FHIR integration for healthcare data',
    version,
    enabled
  }),
  care_plans: (enabled = true, version = '1.8.0'): AgentCapability => ({
    name: 'care_plans',
    description: 'Patient care plan management',
    version,
    enabled
  }),
  medication: (enabled = true, version = '1.8.0'): AgentCapability => ({
    name: 'medication',
    description: 'Medication administration tracking',
    version,
    enabled
  }),
  vitals: (enabled = true, version = '1.8.0'): AgentCapability => ({
    name: 'vitals',
    description: 'Vital signs monitoring',
    version,
    enabled
  }),
  appointments: (enabled = true, version = '1.3.0'): AgentCapability => ({
    name: 'appointments',
    description: 'Appointment scheduling',
    version,
    enabled
  }),
  communication: (enabled = true, version = '1.3.0'): AgentCapability => ({
    name: 'communication',
    description: 'Patient-provider messaging',
    version,
    enabled
  }),
  analytics: (enabled = true, version = '3.0.0'): AgentCapability => ({
    name: 'analytics',
    description: 'Business analytics and reporting',
    version,
    enabled
  }),
  forecasting: (enabled = true, version = '3.0.0'): AgentCapability => ({
    name: 'forecasting',
    description: 'Predictive analytics',
    version,
    enabled
  }),
  generation: (enabled = true, version = '2.5.0'): AgentCapability => ({
    name: 'generation',
    description: 'AI content generation',
    version,
    enabled
  }),
  translation: (enabled = true, version = '2.5.0'): AgentCapability => ({
    name: 'translation',
    description: 'Multilingual translation',
    version,
    enabled
  })
} as const
