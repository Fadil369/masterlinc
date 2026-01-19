export interface DedupOptions {
  ttlMs: number
  maxSize: number
}

interface Entry {
  expiresAt: number
}

/**
 * In-memory TTL + LRU-ish deduplicator.
 * - Maintains insertion order via Map.
 * - Not a security boundary; suitable for client-side protection and UX.
 */
export class LruTtlDeduplicator {
  private map = new Map<string, Entry>()

  constructor(private readonly options: DedupOptions) {}

  has(key: string, nowMs: number): boolean {
    this.evictExpired(nowMs)
    const e = this.map.get(key)
    if (!e) return false
    if (e.expiresAt <= nowMs) {
      this.map.delete(key)
      return false
    }

    // touch
    this.map.delete(key)
    this.map.set(key, e)
    return true
  }

  /** Adds without checking. Call has() first if needed. */
  add(key: string, nowMs: number): void {
    this.evictExpired(nowMs)
    this.map.set(key, { expiresAt: nowMs + this.options.ttlMs })
    this.trimToSize()
  }

  private evictExpired(nowMs: number) {
    for (const [k, e] of this.map) {
      if (e.expiresAt > nowMs) continue
      this.map.delete(k)
    }
  }

  private trimToSize() {
    while (this.map.size > this.options.maxSize) {
      const first = this.map.keys().next().value as string | undefined
      if (!first) return
      this.map.delete(first)
    }
  }
}
