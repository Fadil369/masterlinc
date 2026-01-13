/**
 * ServiceError
 *
 * Standard error shape for MASTERLINC service layer.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'VALIDATION_ERROR'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'FORBIDDEN'
      | 'UNAUTHORIZED'
      | 'RATE_LIMITED'
      | 'INTERNAL_ERROR',
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export function asServiceError(err: unknown): ServiceError {
  if (err instanceof ServiceError) return err
  return new ServiceError('Unexpected error', 'INTERNAL_ERROR', {
    original: err instanceof Error ? err.message : String(err)
  })
}
