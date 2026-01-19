import type { Language, Message } from '@/lib/types'
import { MessageSchema } from './message-schema'
import { nowMs } from './metrics'
import { FixedWindowRateLimiter } from './rate-limiter'
import { LruTtlDeduplicator } from './deduplicator'
import {
  batchRollbackResponse,
  duplicateResponse,
  makeMetrics,
  rateLimitedResponse,
  schemaErrorResponse,
  type ValidationResponse
} from './errors'

export interface MasterlincValidatorOptions {
  rateLimit: {
    limit: number
    windowMs: number
  }
  dedup: {
    ttlMs: number
    maxSize: number
  }
}

export class MasterlincMessageValidator {
  private readonly limiter: FixedWindowRateLimiter
  private readonly dedup: LruTtlDeduplicator

  constructor(private readonly opts: MasterlincValidatorOptions) {
    this.limiter = new FixedWindowRateLimiter(opts.rateLimit)
    this.dedup = new LruTtlDeduplicator(opts.dedup)
  }

  /**
   * Validates a single incoming message:
   * - Zod schema validation
   * - rate limiting check (per sender_id)
   * - deduplication check (message_id)
   */
  validate(message: unknown, language: Language): ValidationResponse<Message> {
    const start = nowMs()

    const parsed = MessageSchema.safeParse(message)
    const endParse = nowMs()

    if (!parsed.success) {
      return schemaErrorResponse({
        language,
        issues: parsed.error.issues,
        metrics: makeMetrics(start, endParse, 1)
      })
    }

    const m = parsed.data as Message

    // Dedup (no side effects on error)
    const endDedup = nowMs()
    if (this.dedup.has(m.message_id, endDedup)) {
      return duplicateResponse({
        duplicateKey: m.message_id,
        metrics: makeMetrics(start, endDedup, 1)
      })
    }

    // Rate limit (no side effects on error)
    const endRL = nowMs()
    const decision = this.limiter.peek(m.sender_id, endRL, 1)
    if (!decision.allowed) {
      return rateLimitedResponse({
        retryAfterMs: decision.retryAfterMs,
        metrics: makeMetrics(start, endRL, 1)
      })
    }

    // Commit side effects once everything is valid
    this.dedup.add(m.message_id, endRL)
    this.limiter.commit(m.sender_id, endRL, 1)

    const end = nowMs()
    return {
      ok: true,
      data: m,
      metrics: makeMetrics(start, end, 1)
    }
  }

  /**
   * Batch validation with rollback semantics:
   * - validates all messages
   * - checks intra-batch duplicates
   * - performs dry-run rate limit accounting per sender_id
   * - if any error occurs: returns batch_rollback and commits NOTHING
   */
  validateBatch(messages: unknown[], language: Language): ValidationResponse<Message[]> {
    const start = nowMs()

    // 1) schema validation first
    const parsed: Message[] = []
    for (let i = 0; i < messages.length; i++) {
      const res = MessageSchema.safeParse(messages[i])
      if (!res.success) {
        const metrics = makeMetrics(start, nowMs(), messages.length)
        const cause = schemaErrorResponse({ language, issues: res.error.issues, metrics })
        return batchRollbackResponse({ metrics, cause })
      }
      parsed.push(res.data as Message)
    }

    // 2) dedup: global cache + intra-batch
    const seen = new Set<string>()
    const now = nowMs()
    for (const m of parsed) {
      if (seen.has(m.message_id) || this.dedup.has(m.message_id, now)) {
        const metrics = makeMetrics(start, nowMs(), messages.length)
        const cause = duplicateResponse({ duplicateKey: m.message_id, metrics })
        return batchRollbackResponse({ metrics, cause })
      }
      seen.add(m.message_id)
    }

    // 3) rate limit dry-run per sender
    const countsBySender = new Map<string, number>()
    for (const m of parsed) {
      countsBySender.set(m.sender_id, (countsBySender.get(m.sender_id) ?? 0) + 1)
    }

    for (const [sender, count] of countsBySender) {
      const decision = this.limiter.peek(sender, now, count)
      if (!decision.allowed) {
        const metrics = makeMetrics(start, nowMs(), messages.length)
        const cause = rateLimitedResponse({ retryAfterMs: decision.retryAfterMs, metrics })
        return batchRollbackResponse({ metrics, cause })
      }
    }

    // 4) commit side effects
    for (const m of parsed) {
      this.dedup.add(m.message_id, now)
    }
    for (const [sender, count] of countsBySender) {
      this.limiter.commit(sender, now, count)
    }

    const end = nowMs()
    return {
      ok: true,
      data: parsed,
      metrics: makeMetrics(start, end, messages.length)
    }
  }
}
