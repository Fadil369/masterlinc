export interface CacheStats {
  hits: number
  misses: number
  sets: number
  evictions: number
}

export interface CacheGetResult<T> {
  hit: boolean
  value?: T
}

interface Entry<T> {
  value: T
  expiresAt: number
}

/**
 * LRU + TTL cache (in-memory).
 * - O(1) get/set
 * - TTL per entry
 * - Maintains LRU order via Map insertion order
 */
export class LruTtlCache<K, V> {
  private readonly map = new Map<K, Entry<V>>()
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0 }

  constructor(private readonly options: { maxSize: number; defaultTtlMs: number }) {}

  get(key: K, nowMs: number = Date.now()): CacheGetResult<V> {
    const entry = this.map.get(key)
    if (!entry) {
      this.stats.misses++
      return { hit: false }
    }

    if (entry.expiresAt <= nowMs) {
      this.map.delete(key)
      this.stats.misses++
      return { hit: false }
    }

    // touch
    this.map.delete(key)
    this.map.set(key, entry)

    this.stats.hits++
    return { hit: true, value: entry.value }
  }

  set(key: K, value: V, ttlMs?: number, nowMs: number = Date.now()): void {
    this.stats.sets++
    this.map.set(key, { value, expiresAt: nowMs + (ttlMs ?? this.options.defaultTtlMs) })
    this.trim()
  }

  delete(key: K): void {
    this.map.delete(key)
  }

  clear(): void {
    this.map.clear()
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 }
  }

  snapshotStats(): CacheStats {
    return { ...this.stats }
  }

  size(): number {
    return this.map.size
  }

  private trim(): void {
    while (this.map.size > this.options.maxSize) {
      const oldest = this.map.keys().next().value as K | undefined
      if (oldest === undefined) return
      this.map.delete(oldest)
      this.stats.evictions++
    }
  }
}
