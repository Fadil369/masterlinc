export type AgentStatus = 'online' | 'offline' | 'degraded' | 'maintenance'

export type AgentCategory = 'healthcare' | 'business' | 'automation' | 'content' | 'security'

export interface AgentCapability {
  name: string
  description: string
  version: string
  enabled: boolean
}

export interface Agent {
  agent_id: string
  name: string
  name_ar?: string
  description: string
  description_ar?: string
  category: AgentCategory
  status: AgentStatus
  endpoint: string
  capabilities: AgentCapability[]
  last_heartbeat?: string
  created_at: string
  updated_at: string
  languages: string[]
  priority: number
}

export interface Message {
  message_id: string
  sender_id: string
  receiver_id: string
  content_type: string
  content: Record<string, unknown>
  timestamp: string
  status: 'pending' | 'delivered' | 'failed'
}

export interface WorkflowStep {
  step_id: string
  agent_id: string
  action: string
  parameters: Record<string, unknown>
  timeout: number
}

export interface Workflow {
  workflow_id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  created_at: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    name: string
    status: string
    message?: string
  }[]
  agents_registered: number
  active_connections: number
  uptime: number
}

export type Language = 'en' | 'ar'
