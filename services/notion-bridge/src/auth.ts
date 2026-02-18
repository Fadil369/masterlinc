import type { RequestHandler } from 'express'

export function requireApiKey(expected?: string): RequestHandler {
  return (req, res, next) => {
    if (!expected) return next()
    const got = req.header('x-api-key')
    if (!got || got !== expected) return res.status(401).json({ error: 'Unauthorized' })
    next()
  }
}
