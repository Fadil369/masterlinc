import type { ConfigChange, ConfigStore, MasterlincConfig } from './contracts'

function uid(): string {
  return `cfg_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

/**
 * Versioned config store with rollback + audit trail + hot-reload subscriptions.
 */
export class InMemoryConfigStore implements ConfigStore {
  private versions = new Map<string, MasterlincConfig>()
  private current: MasterlincConfig
  private audit: ConfigChange[] = []
  private listeners = new Set<(cfg: MasterlincConfig, change: ConfigChange) => void>()

  constructor(initial: MasterlincConfig) {
    this.current = initial
    this.versions.set(initial.version, initial)
  }

  getCurrent(): MasterlincConfig {
    return this.current
  }

  listVersions(): string[] {
    return Array.from(this.versions.keys())
  }

  rollback(toVersion: string, reason?: string): void {
    const target = this.versions.get(toVersion)
    if (!target) throw new Error(`Unknown config version: ${toVersion}`)

    const change: ConfigChange = {
      id: uid(),
      ts: Date.now(),
      fromVersion: this.current.version,
      toVersion: target.version,
      reason
    }

    this.current = target
    this.audit.unshift(change)
    this.emit(change)
  }

  commit(next: MasterlincConfig, reason?: string): void {
    const change: ConfigChange = {
      id: uid(),
      ts: Date.now(),
      fromVersion: this.current.version,
      toVersion: next.version,
      reason
    }

    this.versions.set(next.version, next)
    this.current = next
    this.audit.unshift(change)
    this.emit(change)
  }

  onChange(listener: (cfg: MasterlincConfig, change: ConfigChange) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getAuditTrail(): ConfigChange[] {
    return [...this.audit]
  }

  private emit(change: ConfigChange): void {
    for (const l of this.listeners) l(this.current, change)
  }
}
