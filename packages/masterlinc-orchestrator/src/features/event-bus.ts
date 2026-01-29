/**
 * Event Bus (Redis Streams)
 * Handles pub/sub messaging between services.
 *
 * Note: This implementation always notifies in-process subscribers.
 * It also persists events to a Redis Stream for observability/replay.
 */

import { Redis } from 'ioredis';
import { pino } from 'pino';

const logger = pino({ name: 'event-bus' });

export interface Event {
  type: string;
  source: string;
  data: unknown;
  timestamp: Date;
  correlationId?: string;
}

export class EventBus {
  private redis: Redis | null = null;
  private streamName = 'masterlinc:events';
  private subscribers: Map<string, Array<(event: Event) => void>> = new Map();

  constructor(
    private redisOptions: {
      host?: string;
      port?: number;
      password?: string;
    } = {},
  ) {}

  async initialize(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.redisOptions.host || process.env.REDIS_HOST || 'localhost',
        port: this.redisOptions.port || parseInt(process.env.REDIS_PORT || '6379'),
        password: this.redisOptions.password || process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
      });

      this.redis.on('error', (err: Error) => {
        logger.error({ error: err.message }, 'Redis error');
      });

      await this.redis.ping();
      logger.info({ stream: this.streamName }, 'EventBus initialized (Redis Streams)');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize EventBus');
      // Continue without Redis (graceful degradation)
      this.redis = null;
    }
  }

  async publish(event: Event): Promise<void> {
    // Always notify in-process subscribers
    this.notifyLocalSubscribers(event);

    if (!this.redis) return;

    try {
      await this.redis.xadd(
        this.streamName,
        '*',
        'type',
        event.type,
        'source',
        event.source,
        'timestamp',
        event.timestamp.toISOString(),
        'correlationId',
        event.correlationId || '',
        'data',
        JSON.stringify(event.data ?? null),
      );
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to persist event to Redis stream');
    }
  }

  async subscribe(pattern: string, handler: (event: Event) => void): Promise<void> {
    if (!this.subscribers.has(pattern)) this.subscribers.set(pattern, []);
    this.subscribers.get(pattern)!.push(handler);
  }

  private notifyLocalSubscribers(event: Event): void {
    this.subscribers.forEach((handlers, pattern) => {
      if (this.matchPattern(event.type, pattern)) {
        handlers.forEach((handler) => {
          try {
            handler(event);
          } catch (error: any) {
            logger.error({ error: error.message }, 'Subscriber handler failed');
          }
        });
      }
    });
  }

  private matchPattern(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    if (pattern.endsWith('.*') && eventType.startsWith(pattern.slice(0, -2))) return true;
    return false;
  }

  async publishWorkflowEvent(workflowId: string, phase: string, status: string, data: unknown): Promise<void> {
    await this.publish({
      type: 'workflow.phase.changed',
      source: 'workflow-engine',
      data: { workflowId, phase, status, ...(data as any) },
      timestamp: new Date(),
      correlationId: workflowId,
    });
  }

  async publishHealthEvent(serviceId: string, status: 'healthy' | 'unhealthy'): Promise<void> {
    await this.publish({
      type: 'service.health.changed',
      source: 'service-registry',
      data: { serviceId, status },
      timestamp: new Date(),
    });
  }

  async publishClaimEvent(
    claimId: string,
    action: 'created' | 'submitted' | 'approved' | 'rejected' | 'paid',
    data: Record<string, unknown>
  ): Promise<void> {
    await this.publish({
      type: `claim.${action}`,
      source: 'sbs-integration',
      data: { claimId, ...data },
      timestamp: new Date(),
      correlationId: claimId,
    });
  }

  async publishPatientEvent(
    patientOID: string,
    action: 'registered' | 'updated' | 'appointment_scheduled',
    data: Record<string, unknown>
  ): Promise<void> {
    await this.publish({
      type: `patient.${action}`,
      source: 'healthcare-integration',
      data: { patientOID, ...data },
      timestamp: new Date(),
      correlationId: patientOID,
    });
  }

  /**
   * Consume events from Redis Stream (for consumers/workers)
   */
  async consumeEvents(
    consumerGroup: string,
    consumerName: string,
    handler: (event: Event) => Promise<void>,
    options: { count?: number; block?: number } = {}
  ): Promise<void> {
    if (!this.redis) {
      logger.warn('Redis not available, cannot consume events');
      return;
    }

    try {
      // Create consumer group if it doesn't exist
      await this.redis.xgroup('CREATE', this.streamName, consumerGroup, '0', 'MKSTREAM').catch(() => {
        // Group already exists, ignore error
      });

      const count = options.count || 10;
      const block = options.block || 5000;

      // Read events from stream
      const results = await this.redis.xreadgroup(
        'GROUP',
        consumerGroup,
        consumerName,
        'COUNT',
        count,
        'BLOCK',
        block,
        'STREAMS',
        this.streamName,
        '>'
      ) as [string, [string, string[]][]][] | null;

      if (results) {
        for (const [, messages] of results) {
          for (const [messageId, fields] of messages) {
            const event = this.parseEventFromFields(fields);
            if (event) {
              try {
                await handler(event);
                // Acknowledge message after successful processing
                await this.redis.xack(this.streamName, consumerGroup, messageId);
              } catch (error: any) {
                logger.error({ error: error.message, messageId }, 'Failed to process event');
              }
            }
          }
        }
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to consume events');
    }
  }

  private parseEventFromFields(fields: string[]): Event | null {
    try {
      const fieldMap: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        fieldMap[fields[i]] = fields[i + 1];
      }

      return {
        type: fieldMap.type,
        source: fieldMap.source,
        timestamp: new Date(fieldMap.timestamp),
        correlationId: fieldMap.correlationId || undefined,
        data: JSON.parse(fieldMap.data || 'null'),
      };
    } catch (error) {
      logger.warn('Failed to parse event from fields');
      return null;
    }
  }

  async close(): Promise<void> {
    try {
      await this.redis?.quit();
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Error closing EventBus connections');
    }
  }
}
