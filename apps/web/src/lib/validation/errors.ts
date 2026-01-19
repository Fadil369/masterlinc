import type { Language, Message } from '@/lib/types'
import type { ValidationErrorCode, LocalizedText } from './i18n'
import { tValidationBoth } from './i18n'
import type { ZodIssue } from 'zod'

export type ValidationErrorType = 'schema_validation' | 'rate_limited' | 'duplicate' | 'batch_rollback'

export interface ValidationErrorDetail {
  /** JSON path in dot notation, e.g. "content.patient_id" */
  path: string
  code: ValidationErrorCode
  message: string
  message_ar: string
  expected?: string
  received?: string
}

export interface ValidationErrorResponse {
  ok: false
  error: {
    type: ValidationErrorType
    message: string
    message_ar: string
    details?: ValidationErrorDetail[]
    retryAfterMs?: number
    duplicateKey?: string
  }
  metrics: ValidationMetrics
}

export interface ValidationSuccessResponse<T> {
  ok: true
  data: T
  metrics: ValidationMetrics
}

export type ValidationResponse<T> = ValidationSuccessResponse<T> | ValidationErrorResponse

export interface ValidationMetrics {
  validationTimeMs: number
  messagesValidated: number
  throughputMsgPerSec: number
}

export function makeMetrics(startMs: number, endMs: number, messagesValidated: number): ValidationMetrics {
  const validationTimeMs = Math.max(0, endMs - startMs)
  const throughputMsgPerSec = validationTimeMs === 0 ? Infinity : (messagesValidated / (validationTimeMs / 1000))
  return { validationTimeMs, messagesValidated, throughputMsgPerSec }
}

function normalizePath(path: (string | number)[]): string {
  if (!path.length) return ''
  return path
    .map((p) => (typeof p === 'number' ? `[${p}]` : p))
    .join('.')
    .replace(/\.\[/g, '[')
}

function mapZodIssueToCode(issue: ZodIssue): ValidationErrorCode {
  // Keep it stable and intentionally coarse.
  switch (issue.code) {
    case 'invalid_type':
      return issue.received === 'undefined' ? 'required' : 'invalid_type'
    case 'invalid_string':
    case 'invalid_enum_value':
    case 'invalid_date':
    case 'invalid_union':
    case 'invalid_union_discriminator':
    case 'unrecognized_keys':
    case 'invalid_literal':
      return 'invalid_format'
    case 'too_small':
      return 'too_small'
    case 'too_big':
      return 'too_big'
    default:
      return 'custom'
  }
}

export function zodIssuesToDetails(issues: ZodIssue[]): ValidationErrorDetail[] {
  return issues.map((issue) => {
    const code = mapZodIssueToCode(issue)
    const base: LocalizedText = tValidationBoth(code)

    return {
      path: normalizePath(issue.path),
      code,
      message: base.en,
      message_ar: base.ar,
      expected: 'expected' in issue ? String((issue as any).expected) : undefined,
      received: 'received' in issue ? String((issue as any).received) : undefined
    }
  })
}

export function schemaErrorResponse(params: {
  language: Language
  issues: ZodIssue[]
  metrics: ValidationMetrics
}): ValidationErrorResponse {
  const base = tValidationBoth('custom')
  return {
    ok: false,
    error: {
      type: 'schema_validation',
      message: base.en,
      message_ar: base.ar,
      details: zodIssuesToDetails(params.issues)
    },
    metrics: params.metrics
  }
}

export function rateLimitedResponse(params: {
  retryAfterMs: number
  metrics: ValidationMetrics
}): ValidationErrorResponse {
  const base = tValidationBoth('rate_limited')
  return {
    ok: false,
    error: {
      type: 'rate_limited',
      message: base.en,
      message_ar: base.ar,
      retryAfterMs: params.retryAfterMs,
      details: [
        {
          path: '',
          code: 'rate_limited',
          message: base.en,
          message_ar: base.ar
        }
      ]
    },
    metrics: params.metrics
  }
}

export function duplicateResponse(params: {
  duplicateKey: string
  metrics: ValidationMetrics
}): ValidationErrorResponse {
  const base = tValidationBoth('duplicate')
  return {
    ok: false,
    error: {
      type: 'duplicate',
      message: base.en,
      message_ar: base.ar,
      duplicateKey: params.duplicateKey,
      details: [
        {
          path: 'message_id',
          code: 'duplicate',
          message: base.en,
          message_ar: base.ar
        }
      ]
    },
    metrics: params.metrics
  }
}

export function batchRollbackResponse(params: {
  metrics: ValidationMetrics
  cause: ValidationErrorResponse
}): ValidationErrorResponse {
  const base = tValidationBoth('batch_rollback')
  return {
    ok: false,
    error: {
      type: 'batch_rollback',
      message: base.en,
      message_ar: base.ar,
      details: params.cause.error.details
    },
    metrics: params.metrics
  }
}

export function isValidationSuccess<T>(res: ValidationResponse<T>): res is { ok: true; data: T; metrics: any } {
  return res.ok
}

export function asToastText(res: ValidationErrorResponse, language: Language): string {
  if (language === 'ar') {
    const d = res.error.details?.[0]
    return d?.message_ar ?? res.error.message_ar
  }
  const d = res.error.details?.[0]
  return d?.message ?? res.error.message
}

// convenience alias for callers
export type ValidMessage = Message
