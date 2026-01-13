import { MasterlincDataAggregator } from './masterlinc-aggregator'

export const masterlincAggregator = new MasterlincDataAggregator({
  // 5 minute window for the dashboard time-series
  windowMs: 5 * 60_000,
  // ~10 minutes at 1s sampling (per agent)
  agentLatencyCapacity: 600,
  // ~30 minutes at 10s sampling
  systemHealthCapacity: 180,
  // Cache snapshots for fast UI rerenders
  snapshotCacheTtlMs: 250,
  // Keep last N workflow runs for pattern detection
  workflowRunCapacity: 500
})
