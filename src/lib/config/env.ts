import type { MasterlincConfig } from './contracts'

export const devConfig: MasterlincConfig = {
  version: '2026.01.13-dev',
  environment: 'dev',
  language: 'en',
  agents: {
    masterlinc: { agentType: 'orchestration', endpoint: 'http://masterlinc:8000', enabled: true },
    doctorlinc: { agentType: 'healthcare', endpoint: 'http://doctorlinc:8010', enabled: true },
    nurselinc: { agentType: 'healthcare', endpoint: 'http://nurselinc:8011', enabled: true },
    authlinc: { agentType: 'routing', endpoint: 'http://authlinc:8001', enabled: true }
  },
  agentTypes: [
    {
      type: 'orchestration',
      category: 'automation',
      labels: { en: 'Orchestrator', ar: 'المنسق' },
      defaultEndpoint: 'http://masterlinc:8000',
      defaultCapabilities: ['registry', 'routing', 'workflows', 'policy'],
      limits: { maxRps: 200, maxConcurrentWorkflows: 50 },
      routingStrategy: 'priority'
    },
    {
      type: 'healthcare',
      category: 'healthcare',
      labels: { en: 'Healthcare Agent', ar: 'وكيل صحي' },
      defaultEndpoint: 'http://agent:8010',
      defaultCapabilities: ['diagnosis', 'treatment', 'fhir'],
      limits: { maxRps: 60, maxConcurrentWorkflows: 10 },
      phiMode: 'strict'
    },
    {
      type: 'routing',
      category: 'security',
      labels: { en: 'Routing/Security Gateway', ar: 'بوابة التوجيه/الأمان' },
      defaultEndpoint: 'http://authlinc:8001',
      defaultCapabilities: ['authentication', 'authorization', 'routing'],
      limits: { maxRps: 500, maxConcurrentWorkflows: 100 },
      cacheTtlMs: 30_000
    }
  ]
}

export const stagingConfig: MasterlincConfig = {
  ...devConfig,
  version: '2026.01.13-staging',
  environment: 'staging'
}

export const prodConfig: MasterlincConfig = {
  ...devConfig,
  version: '2026.01.13',
  environment: 'prod'
}
