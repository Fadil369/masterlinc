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
  /** Optional policy metadata (e.g., "phi", "hipaa", "internal") */
  policy_tags?: string[]
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

/**
 * RBAC roles for MASTERLINC (4-tier healthcare model).
 */
export type UserRole = 'doctor' | 'nurse' | 'admin' | 'researcher'

export type PermissionAction = 'create' | 'read' | 'update' | 'execute' | 'delete' | 'approve'
export type PermissionResource = 'workflow' | 'message' | 'agent' | 'policy' | 'user' | 'audit_log'

export interface Permission {
  resource: PermissionResource
  action: PermissionAction
  scope: 'system' | 'team' | 'patient' | 'self'
  conditions?: Record<string, unknown>
}

export interface User {
  user_id: string
  name: string
  role: UserRole
  email: string
  /** for doctors/nurses */
  specialty?: string
  /** for nurses */
  assigned_patients?: string[]
  permissions: Permission[]
  created_at: string
  updated_at: string
}

/**
 * Role-to-permissions mapping (reference defaults).
 *
 * Notes:
 * - These are defaults; real deployments typically load from policy/config.
 * - This is used by PolicyEnforcementService.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  doctor: [
    { resource: 'workflow', action: 'create', scope: 'team' },
    { resource: 'workflow', action: 'execute', scope: 'patient' },
    { resource: 'message', action: 'create', scope: 'patient' },
    { resource: 'agent', action: 'read', scope: 'system' }
  ],
  nurse: [
    { resource: 'workflow', action: 'read', scope: 'patient' },
    { resource: 'workflow', action: 'execute', scope: 'team' },
    { resource: 'message', action: 'create', scope: 'patient' }
  ],
  admin: [
    { resource: 'agent', action: 'create', scope: 'system' },
    { resource: 'agent', action: 'update', scope: 'system' },
    { resource: 'policy', action: 'create', scope: 'system' },
    { resource: 'user', action: 'create', scope: 'system' }
  ],
  researcher: [
    { resource: 'workflow', action: 'read', scope: 'system' },
    { resource: 'agent', action: 'read', scope: 'system' }
  ]
}
