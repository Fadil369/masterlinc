import { CircularBuffer } from './circular-buffer'

export interface TimePoint<T> {
  ts: number
  value: T
}

/**
 * Memory-efficient time-series storage backed by a circular buffer.
 * Window queries are performed by scanning from newest backwards.
 */
export class TimeSeriesBuffer<T> {
  private readonly buf: CircularBuffer<TimePoint<T>>

  constructor(capacity: number) {
    this.buf = new CircularBuffer<TimePoint<T>>(capacity)
  }

  push(ts: number, value: T): void {
    this.buf.push({ ts, value })
  }

  latest(): TimePoint<T> | undefined {
    return this.buf.latest()
  }

  size(): number {
    return this.buf.size()
  }

  /**
   * Iterates points inside the last windowMs (newest -> oldest) without allocating.
   */
  forEachInWindow(windowMs: number, nowMs: number, fn: (p: TimePoint<T>) => void): void {
    // We only have oldest->newest iteration; scan and filter still O(n) but bounded by capacity.
    const cutoff = nowMs - windowMs
    this.buf.forEach((p) => {
      if (p.ts >= cutoff) fn(p)
    })
  }

  /**
   * Returns summary stats for numeric series within a time window.
   */
  numericStats(windowMs: number, nowMs: number): { min: number; max: number; avg: number; count: number } {
    const cutoff = nowMs - windowMs
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    let sum = 0
    let count = 0

    this.buf.forEach((p) => {
      if (p.ts < cutoff) return
      const v = p.value as unknown as number
      if (!Number.isFinite(v)) return
      if (v < min) min = v
      if (v > max) max = v
      sum += v
      count++
    })

    if (count === 0) return { min: 0, max: 0, avg: 0, count: 0 }
    return { min, max, avg: sum / count, count }
  }
}
