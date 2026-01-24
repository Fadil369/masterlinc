/**
 * WebSocket Server for Real-time Notifications
 * Sends workflow updates, call events, and system notifications to connected clients
 */

import { WebSocketServer, WebSocket } from 'ws';
import { pino } from 'pino';
import type { Server } from 'http';

const logger = pino({ name: 'websocket-server' });

export interface WebSocketMessage {
  type: 'workflow.update' | 'call.event' | 'system.notification' | 'health.update';
  data: any;
  timestamp: Date;
}

export class RealtimeServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      logger.info({ clientId, ip: req.socket.remoteAddress }, 'WebSocket client connected');

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'system.notification',
        data: { message: 'Connected to MasterLinc Orchestrator', clientId },
        timestamp: new Date(),
      });

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(clientId, data);
        } catch (error: any) {
          logger.error({ error: error.message }, 'Failed to parse WebSocket message');
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        logger.info({ clientId }, 'WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        logger.error({ error: error.message, clientId }, 'WebSocket error');
        this.clients.delete(clientId);
      });
    });

    logger.info('WebSocket server initialized');
  }

  private handleClientMessage(clientId: string, data: any): void {
    logger.debug({ clientId, data }, 'Received message from client');

    // Handle client subscriptions
    if (data.type === 'subscribe') {
      // Store subscription preferences
      logger.info({ clientId, topics: data.topics }, 'Client subscribed to topics');
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast workflow update to all connected clients
   */
  broadcastWorkflowUpdate(workflowId: string, phase: string, status: string, data: any): void {
    const message: WebSocketMessage = {
      type: 'workflow.update',
      data: { workflowId, phase, status, ...data },
      timestamp: new Date(),
    };

    this.broadcast(message);
  }

  /**
   * Broadcast call event
   */
  broadcastCallEvent(callId: string, event: string, data: any): void {
    const message: WebSocketMessage = {
      type: 'call.event',
      data: { callId, event, ...data },
      timestamp: new Date(),
    };

    this.broadcast(message);
  }

  /**
   * Broadcast system notification
   */
  broadcastSystemNotification(severity: 'info' | 'warning' | 'error', message: string): void {
    const msg: WebSocketMessage = {
      type: 'system.notification',
      data: { severity, message },
      timestamp: new Date(),
    };

    this.broadcast(msg);
  }

  /**
   * Broadcast health update
   */
  broadcastHealthUpdate(serviceId: string, status: 'healthy' | 'unhealthy'): void {
    const message: WebSocketMessage = {
      type: 'health.update',
      data: { serviceId, status },
      timestamp: new Date(),
    };

    this.broadcast(message);
  }

  /**
   * Broadcast to all connected clients
   */
  private broadcast(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    let sent = 0;

    this.clients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
          sent++;
        } catch (error: any) {
          logger.error({ error: error.message, clientId }, 'Failed to send message');
        }
      }
    });

    logger.debug({ type: message.type, clientsSent: sent }, 'Broadcast message');
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Close all connections
   */
  close(): void {
    this.wss.close();
    this.clients.clear();
    logger.info('WebSocket server closed');
  }
}
