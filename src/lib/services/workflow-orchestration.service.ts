import type { User, Workflow } from '@/lib/types'
import type { WorkflowOrchestrationService, PolicyEnforcementService } from './contracts'
import { ServiceError } from './errors'

/**
 * WorkflowOrchestrationService
 *
 * Responsible for workflow start/run operations.
 * In production this would:
 * - build an execution plan (dependency graph)
 * - run steps in parallel when safe
 * - retry with exponential backoff
 * - circuit-break failing agents
 */
export class DefaultWorkflowOrchestrationService implements WorkflowOrchestrationService {
  private readonly active = new Set<string>()
  private readonly store = new Map<string, Workflow>()

  constructor(private readonly policy: PolicyEnforcementService) {}

  async startWorkflow(workflow: Workflow, actor: User): Promise<Workflow> {
    this.policy.require(actor, 'workflow', 'create', { team_allowed: true })

    if (!workflow.workflow_id) throw new ServiceError('workflow_id required', 'VALIDATION_ERROR')
    this.store.set(workflow.workflow_id, workflow)
    return workflow
  }

  async runWorkflow(workflowId: string, actor: User): Promise<void> {
    this.policy.require(actor, 'workflow', 'execute', { patient_allowed: true })

    const wf = this.store.get(workflowId)
    if (!wf) throw new ServiceError('Workflow not found', 'NOT_FOUND', { workflowId })

    if (this.active.has(workflowId)) throw new ServiceError('Workflow already running', 'CONFLICT', { workflowId })

    this.active.add(workflowId)
    try {
      // Placeholder execution: mark as running for a brief time.
      await new Promise((r) => setTimeout(r, 10))
    } finally {
      this.active.delete(workflowId)
    }
  }

  async getActiveWorkflowCount(): Promise<number> {
    return this.active.size
  }
}
