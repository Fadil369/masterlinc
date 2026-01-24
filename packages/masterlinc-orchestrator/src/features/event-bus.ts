/**
 * Event Bus with RabbitMQ
 * Handles pub/sub messaging between services
 */

import amqp, { type Connection, type Channel } from 'amqplib';
import { pino } from 'pino';

const logger = pino({ name: 'event-bus' });

export interface Event {
  type: string;
  source: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
}

export class EventBus {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private exchangeName = 'masterlinc.events';
  private subscribers: Map<string, Array<(event: Event) => void>> = new Map();

  constructor(private rabbitUrl: string = 'amqp://localhost') {}

  /**
   * Initialize connection to RabbitMQ
   */
  async initialize(): Promise<void> {
    try {
      logger.info({ url: this.rabbitUrl }, 'Connecting to RabbitMQ');
      
      this.connection = await amqp.connect(this.rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Create exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });

      // Handle connection events
      this.connection.on('error', (err) => {
        logger.error({ error: err.message }, 'RabbitMQ connection error');
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.reconnect();
      });

      logger.info('EventBus initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize EventBus');
      // Continue without RabbitMQ (graceful degradation)
    }
  }

  private async reconnect(): Promise<void> {
    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error: any) {
        logger.error({ error: error.message }, 'Reconnection failed');
      }
    }, 5000);
  }

  /**
   * Publish event
   */
  async publish(event: Event): Promise<void> {
    if (!this.channel) {
      logger.warn('EventBus not initialized, event not published');
      // Notify local subscribers anyway
      this.notifyLocalSubscribers(event);
      return;
    }

    try {
      const routingKey = event.type.replace('.', '_');
      const message = Buffer.from(JSON.stringify(event));

      this.channel.publish(this.exchangeName, routingKey, message, {
        persistent: true,
        timestamp: Date.now(),
        contentType: 'application/json',
      });

      logger.debug({ eventType: event.type, source: event.source }, 'Event published');

      // Also notify local subscribers
      this.notifyLocalSubscribers(event);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to publish event');
    }
  }

  /**
   * Subscribe to events by pattern
   */
  async subscribe(pattern: string, handler: (event: Event) => void): Promise<void> {
    // Store local subscriber
    if (!this.subscribers.has(pattern)) {
      this.subscribers.set(pattern, []);
    }
    this.subscribers.get(pattern)!.push(handler);

    if (!this.channel) {
      logger.warn('EventBus not initialized, subscription stored locally only');
      return;
    }

    try {
      // Create queue for this subscriber
      const queue = await this.channel.assertQueue('', { exclusive: true });
      const routingKey = pattern.replace('.', '_');

      await this.channel.bindQueue(queue.queue, this.exchangeName, routingKey);

      await this.channel.consume(
        queue.queue,
        (msg) => {
          if (msg) {
            try {
              const event: Event = JSON.parse(msg.content.toString());
              handler(event);
              this.channel!.ack(msg);
            } catch (error: any) {
              logger.error({ error: error.message }, 'Failed to handle event');
              this.channel!.nack(msg, false, false);
            }
          }
        },
        { noAck: false },
      );

      logger.info({ pattern }, 'Subscribed to event pattern');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to subscribe');
    }
  }

  /**
   * Notify local subscribers (in-process)
   */
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
    // Simple pattern matching (exact or wildcard)
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    if (pattern.endsWith('.*') && eventType.startsWith(pattern.slice(0, -2))) return true;
    return false;
  }

  /**
   * Publish workflow event
   */
  async publishWorkflowEvent(
    workflowId: string,
    phase: string,
    status: string,
    data: any,
  ): Promise<void> {
    await this.publish({
      type: 'workflow.phase.changed',
      source: 'workflow-engine',
      data: { workflowId, phase, status, ...data },
      timestamp: new Date(),
      correlationId: workflowId,
    });
  }

  /**
   * Publish service health event
   */
  async publishHealthEvent(serviceId: string, status: 'healthy' | 'unhealthy'): Promise<void> {
    await this.publish({
      type: 'service.health.changed',
      source: 'service-registry',
      data: { serviceId, status },
      timestamp: new Date(),
    });
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    logger.info('EventBus closed');
  }
}
