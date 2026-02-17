/**
 * Shared middleware for Cloudflare Workers
 * Provides error handling, rate limiting, and validation
 */

import { Context, Next } from 'hono'

export interface WorkerEnv {
  ENVIRONMENT?: string
  DB?: D1Database
  RATE_LIMITER?: RateLimit
}

// Error handling middleware
export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    const error = err as Error
    console.error('Worker Error:', {
      message: error.message,
      stack: error.stack,
      path: c.req.path,
      method: c.req.method
    })

    const status = (err as any).status || 500
    const message = status === 500 ? 'Internal Server Error' : error.message

    return c.json(
      {
        error: message,
        requestId: (c as any).reqId,
        timestamp: new Date().toISOString()
      },
      status
    )
  }
}

// Request validation middleware
export function validateBody(schema: any) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json()
      const validated = await schema.parseAsync(body)
      ;(c as any).validatedBody = validated
      await next()
    } catch (err) {
      return c.json({ error: 'Invalid request body', details: err }, 400)
    }
  }
}

// Rate limiting middleware
export async function rateLimiter(c: Context<{ Bindings: WorkerEnv }>, next: Next) {
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const key = `rate:${ip}`

  if (c.env.RATE_LIMITER) {
    const { success } = await c.env.RATE_LIMITER.limit({ key })
    if (!success) {
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }
  }

  await next()
}

// Request ID middleware
export async function requestId(c: Context, next: Next) {
  const rid = c.req.header('x-request-id') || crypto.randomUUID()
  ;(c as any).reqId = rid
  c.header('x-request-id', rid)
  await next()
}

// Performance timing middleware
export async function timing(c: Context, next: Next) {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  c.header('x-response-time', `${duration}ms`)
}

// Security headers middleware
export async function securityHeaders(c: Context, next: Next) {
  await next()
  
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  if (c.env.ENVIRONMENT === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
}
