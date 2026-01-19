import { z } from 'zod'

// Custom validators requested by spec
export const AgentIdSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z][a-z0-9_-]*$/i, 'agent_id must be alphanumeric with _ or -')

export const SenderIdSchema = AgentIdSchema
export const ReceiverIdSchema = AgentIdSchema

export const PolicyTagsSchema = z
  .array(
    z
      .string()
      .min(1)
      .max(64)
      // allow Arabic/Latin letters, digits, underscore, dash, colon, dot
      .regex(/^[\p{L}\p{N}_:.-]+$/u, 'policy tag contains invalid characters')
  )
  .max(64)

export const MessageSchema = z
  .object({
    message_id: z.string().min(1).max(128),
    sender_id: SenderIdSchema,
    receiver_id: ReceiverIdSchema,
    content_type: z.string().min(1).max(128),
    content: z.record(z.unknown()),
    timestamp: z.string().datetime(),
    status: z.enum(['pending', 'delivered', 'failed']),
    // Optional extra metadata (does not break existing UI)
    policy_tags: PolicyTagsSchema.optional()
  })
  .strict()

export type MessageInput = z.input<typeof MessageSchema>
export type MessageParsed = z.output<typeof MessageSchema>
