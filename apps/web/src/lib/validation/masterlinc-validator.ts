import { MasterlincMessageValidator } from './validator'

// Reasonable defaults for UI/client-side validation layer.
export const masterlincValidator = new MasterlincMessageValidator({
  rateLimit: {
    // 60 msgs / 10s per sender_id
    limit: 60,
    windowMs: 10_000
  },
  dedup: {
    // remember message_ids for 5 minutes
    ttlMs: 5 * 60_000,
    maxSize: 20_000
  }
})
