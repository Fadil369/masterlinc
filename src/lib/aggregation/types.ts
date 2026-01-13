import type { SystemHealth, Workflow, AgentStatus } from '@/lib/types'

export interface AgentHeartbeatMetric {
  agent_id: string
  ts: number
  /** Observed round-trip or processing latency in milliseconds */
  latency_ms: number
  status?: AgentStatus
}

export interface SystemHealthMetric {
  ts: number
  status: SystemHealth['status']
  active_connections: number
  agents_registered: number
  uptime: number
}

export type WorkflowEventType = 'created' | 'started' | 'completed' | 'failed'

export interface WorkflowEvent {
  ts: number
  type: WorkflowEventType
  workflow_id: string
  steps_count: number
}

export interface WorkflowRunRecord {
  workflow_id: string
  started_at: number
  ended_at: number
  duration_ms: number
  steps_count: number
  status: 'completed' | 'failed'
  /** A stable signature of the sequence of agent_ids involved */
  step_agent_signature?: string
}

export interface AgentLatencyStats {
  agent_id: string
  window_ms: number
  min_ms: number
  max_ms: number
  avg_ms: number
  samples: number
}

export interface AggregatedSnapshot {
  generated_at: number
  window_ms: number

  system: {
    latest?: SystemHealthMetric
    /** counts of status samples in the window */
    statusCounts: Record<SystemHealth['status'], number>
  }

  agents: {
    latency: AgentLatencyStats[]
  }

  workflows: {
    activeCount: number
    recentRuns: WorkflowRunRecord[]
    patterns: {
      /** number of runs per signature within the window */
      signatureCounts: Array<{ signature: string; count: number }>
      avgDurationMs: number
      avgSteps: number
      completed: number
      failed: number
    }
  }
}

export interface MetricsExporter {
  export(snapshot: AggregatedSnapshot): Promise<void> | void
}

export interface WorkflowPatternInput {
  workflow: Workflow
  /** optional stable representation of step agents for pattern tracking */
  stepAgentSignature?: string
}
