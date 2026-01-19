export interface RateLimitDecision {
  allowed: boolean
  retryAfterMs: number
}

export interface FixedWindowRateLimitOptions {
  /** max number of messages allowed per window per key */
  limit: number
  /** window size in ms */
  windowMs: number
}

interface Bucket {
  windowStartMs: number
  count: number
}

/**
 * Simple fixed-window limiter with batch "dry-run" support.
 * - Fast and deterministic
 * - Not intended as a security boundary (client-side)
 */
export class FixedWindowRateLimiter {
  private buckets = new Map<string, Bucket>()

  constructor(private readonly options: FixedWindowRateLimitOptions) {}

  peek(key: string, nowMs: number, additionalCount: number): RateLimitDecision {
    const b = this.getBucket(key, nowMs)
    const projected = b.count + additionalCount
    if (projected <= this.options.limit) {
      return { allowed: true, retryAfterMs: 0 }
    }

    const windowEnd = b.windowStartMs + this.options.windowMs
    return { allowed: false, retryAfterMs: Math.max(0, windowEnd - nowMs) }
  }

  commit(key: string, nowMs: number, increment: number): void {
    const b = this.getBucket(key, nowMs)
    b.count += increment
    this.buckets.set(key, b)
  }

  private getBucket(key: string, nowMs: number): Bucket {
    const existing = this.buckets.get(key)
    if (!existing) {
      return { windowStartMs: nowMs, count: 0 }
    }

    const windowEnd = existing.windowStartMs + this.options.windowMs
    if (nowMs >= windowEnd) {
      return { windowStartMs: nowMs, count: 0 }
    }

    return existing
  }
}
