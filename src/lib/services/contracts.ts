import type { Agent, Message, Workflow, SystemHealth, User, PermissionAction, PermissionResource } from '@/lib/types'

/**
 * Dependency injection friendly contracts for MASTERLINC services.
 */

export interface AgentRegistryService {
  listAgents(): Promise<Agent[]>
  getAgent(agentId: string): Promise<Agent | undefined>
  upsertAgent(agent: Agent): Promise<Agent>
  deleteAgent(agentId: string): Promise<void>
}

export interface WorkflowOrchestrationService {
  startWorkflow(workflow: Workflow, actor: User): Promise<Workflow>
  runWorkflow(workflowId: string, actor: User): Promise<void>
  getActiveWorkflowCount(): Promise<number>
}

export interface MessageRoutingService {
  /**
   * Routes a message to its destination (smart delivery).
   * Implementations may reorder or prioritize based on agent priority.
   */
  routeMessage(message: Message, actor: User): Promise<Message>
  routeBatch(messages: Message[], actor: User): Promise<Message[]>
}

export interface PolicyEnforcementService {
  /**
   * Returns true/false for permission checks.
   * Implementations should throw on invalid inputs.
   */
  can(actor: User, resource: PermissionResource, action: PermissionAction, context?: Record<string, unknown>): boolean

  /**
   * Enforces permission checks and throws a ServiceError on failure.
   */
  require(actor: User, resource: PermissionResource, action: PermissionAction, context?: Record<string, unknown>): void
}

export interface HealthCheckService {
  /**
   * Aggregates health for dashboard use.
   */
  aggregate(): Promise<SystemHealth>
}
