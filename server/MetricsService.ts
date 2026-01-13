import { Counter, Gauge, Histogram, Registry } from 'prom-client'
import type { UserRole } from '@/lib/types'

/**
 * MetricsService
 *
 * Prometheus metrics registry for MASTERLINC.
 *
 * Notes:
 * - This module is intended to run in Node.js (prom-client is Node-focused).
 * - In production, expose the registry via an HTTP /metrics endpoint.
 */
export class MetricsService {
  private static registry = new Registry()

  // Agent health metrics
  static agentStatus = new Gauge({
    name: 'masterlinc_agent_status',
    help: 'Agent status (1=online, 0=offline, 0.5=degraded, 0.2=maintenance)',
    labelNames: ['agent_id', 'agent_name'],
    registers: [MetricsService.registry]
  })

  static agentLatency = new Histogram({
    name: 'masterlinc_agent_latency_ms',
    help: 'Agent response time in milliseconds',
    labelNames: ['agent_id', 'capability'],
    buckets: [10, 50, 100, 250, 500, 1000, 2500],
    registers: [MetricsService.registry]
  })

  // Workflow metrics
  static workflowExecutions = new Counter({
    name: 'masterlinc_workflow_executions_total',
    help: 'Total workflow executions',
    labelNames: ['status', 'agent_id'],
    registers: [MetricsService.registry]
  })

  static activeWorkflows = new Gauge({
    name: 'masterlinc_active_workflows',
    help: 'Number of currently active workflows',
    registers: [MetricsService.registry]
  })

  // Message metrics
  static messagesProcessed = new Counter({
    name: 'masterlinc_messages_processed_total',
    help: 'Total messages processed',
    labelNames: ['sender_id', 'receiver_id', 'status'],
    registers: [MetricsService.registry]
  })

  static messageQueueDepth = new Gauge({
    name: 'masterlinc_message_queue_depth',
    help: 'Current message queue depth',
    registers: [MetricsService.registry]
  })

  // RBAC & Security metrics
  static authAttempts = new Counter({
    name: 'masterlinc_auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['role', 'status'],
    registers: [MetricsService.registry]
  })

  static policyViolations = new Counter({
    name: 'masterlinc_policy_violations_total',
    help: 'Total policy violations detected',
    labelNames: ['policy_type', 'role'],
    registers: [MetricsService.registry]
  })

  // System health
  static systemHealthScore = new Gauge({
    name: 'masterlinc_system_health_score',
    help: 'Overall system health (0-100 score)',
    registers: [MetricsService.registry]
  })

  static metricsRegistry(): Registry {
    return MetricsService.registry
  }

  /** Helper to record agent execution */
  static recordAgentCall(agentId: string, capability: string, durationMs: number): void {
    MetricsService.agentLatency.labels(agentId, capability).observe(durationMs)
  }

  /** Helper to update workflow count */
  static updateWorkflowCount(count: number): void {
    MetricsService.activeWorkflows.set(count)
  }

  /** Helper for security events */
  static recordAuthAttempt(role: UserRole, success: boolean): void {
    MetricsService.authAttempts.labels(role, success ? 'success' : 'failed').inc()
  }

  static recordPolicyViolation(policyType: string, role: UserRole): void {
    MetricsService.policyViolations.labels(policyType, role).inc()
  }
}
