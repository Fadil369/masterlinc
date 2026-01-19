import type { SystemHealth, Workflow } from '@/lib/types'
import { TimeSeriesBuffer } from './time-series'
import { CircularBuffer } from './circular-buffer'
import type {
  AgentHeartbeatMetric,
  SystemHealthMetric,
  WorkflowRunRecord,
  AggregatedSnapshot,
  MetricsExporter,
  WorkflowPatternInput
} from './types'

export interface AggregatorOptions {
  /** time window for dashboard snapshot calculations */
  windowMs: number
  /** max points per agent for latency time-series */
  agentLatencyCapacity: number
  /** max points for system health time-series */
  systemHealthCapacity: number
  /** how often snapshot can be recomputed (cache TTL) */
  snapshotCacheTtlMs: number
  /** max completed/failed workflow runs to keep */
  workflowRunCapacity: number
}

interface WorkflowStart {
  startedAt: number
  stepsCount: number
  signature?: string
}

export class MasterlincDataAggregator {
  private readonly agentLatency = new Map<string, TimeSeriesBuffer<number>>()
  private readonly systemHealth = new TimeSeriesBuffer<SystemHealthMetric>(this.opts.systemHealthCapacity)

  private readonly workflowStarts = new Map<string, WorkflowStart>()
  private readonly activeWorkflows = new Set<string>()
  private readonly workflowRuns = new CircularBuffer<WorkflowRunRecord>(this.opts.workflowRunCapacity)

  private dirty = true
  private cached?: { at: number; snapshot: AggregatedSnapshot }

  constructor(private readonly opts: AggregatorOptions) {}

  /** Streaming ingestion: agent heartbeats from multiple agents. */
  ingestHeartbeat(hb: AgentHeartbeatMetric): void {
    const series = this.getOrCreateLatencySeries(hb.agent_id)
    series.push(hb.ts, hb.latency_ms)
    this.dirty = true
  }

  /** Streaming ingestion: system health sample (time-series). */
  ingestSystemHealth(sample: SystemHealthMetric): void {
    this.systemHealth.push(sample.ts, sample)
    this.dirty = true
  }

  /** Convenience: convert app's SystemHealth to a metric sample. */
  ingestSystemHealthFromModel(sh: SystemHealth, ts: number = Date.now()): void {
    this.ingestSystemHealth({
      ts,
      status: sh.status,
      active_connections: sh.active_connections,
      agents_registered: sh.agents_registered,
      uptime: sh.uptime
    })
  }

  /** Track workflows in real-time (active count) + execution patterns. */
  ingestWorkflowEvent(ev: WorkflowPatternInput & { type: 'started' | 'completed' | 'failed'; ts?: number }): void {
    const ts = ev.ts ?? Date.now()
    const id = ev.workflow.workflow_id

    if (ev.type === 'started') {
      this.activeWorkflows.add(id)
      this.workflowStarts.set(id, {
        startedAt: ts,
        stepsCount: ev.workflow.steps.length,
        signature: ev.stepAgentSignature
      })
      this.dirty = true
      return
    }

    // completed or failed
    this.activeWorkflows.delete(id)

    const start = this.workflowStarts.get(id)
    if (start) {
      this.workflowStarts.delete(id)
      this.workflowRuns.push({
        workflow_id: id,
        started_at: start.startedAt,
        ended_at: ts,
        duration_ms: Math.max(0, ts - start.startedAt),
        steps_count: start.stepsCount,
        status: ev.type,
        step_agent_signature: start.signature
      })
    }

    this.dirty = true
  }

  /**
   * Returns an aggregated snapshot for dashboard use.
   * Uses caching to avoid recomputation on frequent UI renders.
   */
  getSnapshot(nowMs: number = Date.now()): AggregatedSnapshot {
    const cached = this.cached
    if (!this.dirty && cached && nowMs - cached.at < this.opts.snapshotCacheTtlMs) {
      return cached.snapshot
    }

    if (cached && !this.dirty && nowMs - cached.at >= this.opts.snapshotCacheTtlMs) {
      // cache expired but no new data; regenerate anyway to update generated_at.
    }

    const snapshot = this.computeSnapshot(nowMs)
    this.cached = { at: nowMs, snapshot }
    this.dirty = false
    return snapshot
  }

  exportTo(exporter: MetricsExporter, nowMs: number = Date.now()): void | Promise<void> {
    const snap = this.getSnapshot(nowMs)
    return exporter.export(snap)
  }

  private computeSnapshot(nowMs: number): AggregatedSnapshot {
    const windowMs = this.opts.windowMs

    // System status counts within window
    const statusCounts: Record<SystemHealth['status'], number> = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0
    }

    let latestSystem: SystemHealthMetric | undefined
    this.systemHealth.forEachInWindow(windowMs, nowMs, (p) => {
      statusCounts[p.value.status]++
      if (!latestSystem || p.ts > latestSystem.ts) latestSystem = p.value
    })

    // Agent latency stats
    const agentLatencyStats = Array.from(this.agentLatency.entries()).map(([agent_id, series]) => {
      const s = series.numericStats(windowMs, nowMs)
      return {
        agent_id,
        window_ms: windowMs,
        min_ms: s.min,
        max_ms: s.max,
        avg_ms: s.avg,
        samples: s.count
      }
    })

    // Workflow patterns within window (based on run records)
    const runs: WorkflowRunRecord[] = []
    const sigCounts = new Map<string, number>()
    let sumDuration = 0
    let sumSteps = 0
    let completed = 0
    let failed = 0

    this.workflowRuns.forEach((r) => {
      if (r.ended_at < nowMs - windowMs) return
      runs.push(r)
      sumDuration += r.duration_ms
      sumSteps += r.steps_count
      if (r.status === 'completed') completed++
      else failed++

      const sig = r.step_agent_signature ?? 'unknown'
      sigCounts.set(sig, (sigCounts.get(sig) ?? 0) + 1)
    })

    const signatureCounts = Array.from(sigCounts.entries())
      .map(([signature, count]) => ({ signature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    const totalRuns = completed + failed

    return {
      generated_at: nowMs,
      window_ms: windowMs,
      system: {
        latest: latestSystem,
        statusCounts
      },
      agents: {
        latency: agentLatencyStats
      },
      workflows: {
        activeCount: this.activeWorkflows.size,
        recentRuns: runs.sort((a, b) => b.ended_at - a.ended_at).slice(0, 50),
        patterns: {
          signatureCounts,
          avgDurationMs: totalRuns ? sumDuration / totalRuns : 0,
          avgSteps: totalRuns ? sumSteps / totalRuns : 0,
          completed,
          failed
        }
      }
    }
  }

  private getOrCreateLatencySeries(agentId: string): TimeSeriesBuffer<number> {
    const existing = this.agentLatency.get(agentId)
    if (existing) return existing

    const created = new TimeSeriesBuffer<number>(this.opts.agentLatencyCapacity)
    this.agentLatency.set(agentId, created)
    return created
  }
}
