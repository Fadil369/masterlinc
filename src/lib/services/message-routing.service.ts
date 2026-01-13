import type { Agent, Message, User } from '@/lib/types'
import type { AgentRegistryService, MessageRoutingService, PolicyEnforcementService } from './contracts'
import { ServiceError } from './errors'
import { LruTtlCache } from '@/lib/cache/lru-ttl-cache'

/**
 * MessageRoutingService
 *
 * Smart routing with:
 * - RBAC enforcement (PolicyEnforcementService)
 * - Capability query caching (TTL)
 * - Message dedup cache
 *
 * NOTE: This is a UI/local implementation. Production routing will be server-side.
 */
export class DefaultMessageRoutingService implements MessageRoutingService {
  private readonly capabilityCache = new LruTtlCache<string, string[]>({ maxSize: 1000, defaultTtlMs: 30_000 })
  private readonly dedupCache = new LruTtlCache<string, true>({ maxSize: 20_000, defaultTtlMs: 5 * 60_000 })

  constructor(
    private readonly registry: AgentRegistryService,
    private readonly policy: PolicyEnforcementService
  ) {}

  async routeMessage(message: Message, actor: User): Promise<Message> {
    this.policy.require(actor, 'message', 'create', {
      patient_allowed: true
    })

    // Dedup
    const dedupKey = message.message_id
    if (this.dedupCache.get(dedupKey).hit) {
      throw new ServiceError('Duplicate message', 'CONFLICT', { message_id: message.message_id })
    }
    this.dedupCache.set(dedupKey, true)

    // Validate receiver exists
    const receiver = await this.registry.getAgent(message.receiver_id)
    if (!receiver) throw new ServiceError('Receiver agent not found', 'NOT_FOUND', { receiver_id: message.receiver_id })

    // Smart priority handling: if receiver offline, try next best candidate in same category.
    // (Placeholder strategy; real routing would be based on capability + policy + availability.)
    if (receiver.status === 'offline') {
      const fallback = await this.findFallback(receiver)
      if (fallback) {
        return { ...message, receiver_id: fallback.agent_id }
      }
    }

    return message
  }

  async routeBatch(messages: Message[], actor: User): Promise<Message[]> {
    // simple sequential for now; can be parallelized
    const out: Message[] = []
    for (const m of messages) out.push(await this.routeMessage(m, actor))
    return out
  }

  private async findFallback(receiver: Agent): Promise<Agent | undefined> {
    const agents = await this.registry.listAgents()
    const candidates = agents
      .filter((a) => a.category === receiver.category)
      .filter((a) => a.status === 'online')
      .sort((a, b) => a.priority - b.priority)

    return candidates[0]
  }

  /** Cached query of agent capabilities (for routing decisions). */
  async getAgentCapabilities(agentId: string): Promise<string[]> {
    const cached = this.capabilityCache.get(agentId)
    if (cached.hit) return cached.value ?? []

    const agent = await this.registry.getAgent(agentId)
    if (!agent) return []

    const caps = agent.capabilities.filter((c) => c.enabled).map((c) => c.name)
    this.capabilityCache.set(agentId, caps)
    return caps
  }
}
