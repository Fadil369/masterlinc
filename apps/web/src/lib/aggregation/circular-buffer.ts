export class CircularBuffer<T> {
  private readonly buffer: Array<T | undefined>
  private head = 0
  private length = 0

  constructor(public readonly capacity: number) {
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error('CircularBuffer capacity must be a positive number')
    }
    this.buffer = new Array<T | undefined>(capacity)
  }

  size(): number {
    return this.length
  }

  isEmpty(): boolean {
    return this.length === 0
  }

  clear(): void {
    this.head = 0
    this.length = 0
    this.buffer.fill(undefined)
  }

  /** Pushes an item and overwrites the oldest item when full. */
  push(item: T): void {
    const idx = (this.head + this.length) % this.capacity
    this.buffer[idx] = item

    if (this.length < this.capacity) {
      this.length++
      return
    }

    // full; overwrite oldest
    this.head = (this.head + 1) % this.capacity
  }

  /** Returns newest item (or undefined if empty). */
  latest(): T | undefined {
    if (this.length === 0) return undefined
    const idx = (this.head + this.length - 1) % this.capacity
    return this.buffer[idx]
  }

  /** Iterate oldest -> newest without allocating. */
  forEach(fn: (item: T, index: number) => void): void {
    for (let i = 0; i < this.length; i++) {
      const idx = (this.head + i) % this.capacity
      const v = this.buffer[idx]
      if (v !== undefined) fn(v, i)
    }
  }

  /** Materialize to array (oldest -> newest). Use sparingly. */
  toArray(): T[] {
    const out: T[] = []
    out.length = this.length
    let o = 0
    this.forEach((v) => {
      out[o++] = v
    })
    return out
  }
}
