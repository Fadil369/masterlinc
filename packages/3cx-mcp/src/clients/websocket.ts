import WebSocket from 'ws';
import type { TokenManager } from '../auth/token-manager.js';
import type { WebSocketEvent } from '../types/3cx-api.js';

type EventHandler = (event: WebSocketEvent) => void;

export class PBXWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;

  constructor(
    private fqdn: string,
    private tokenManager: TokenManager,
    private extension: string,
  ) {}

  async connect(): Promise<void> {
    if (this.connected) return;

    const token = await this.tokenManager.getToken();
    const url = `wss://${this.fqdn}/callcontrol/${this.extension}/ws?access_token=${token}`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.connected = true;
        console.error('[3CX WS] Connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString()) as WebSocketEvent;
          this.dispatch(event);
        } catch (e) {
          console.error('[3CX WS] Parse error:', e);
        }
      });

      this.ws.on('close', (code: number) => {
        this.connected = false;
        console.error(`[3CX WS] Disconnected (${code})`);
        if (code === 1008 || code === 4001) {
          // Auth failure, reconnect with fresh token
          this.scheduleReconnect(2000);
        } else {
          this.scheduleReconnect(5000);
        }
      });

      this.ws.on('error', (err: Error) => {
        console.error('[3CX WS] Error:', err.message);
        if (!this.connected) reject(err);
      });
    });
  }

  on(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event) || [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  off(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event) || [];
    this.handlers.set(event, existing.filter(h => h !== handler));
  }

  private dispatch(event: WebSocketEvent): void {
    const handlers = this.handlers.get(event.event) || [];
    handlers.forEach(h => h(event));

    const wildcardHandlers = this.handlers.get('*') || [];
    wildcardHandlers.forEach(h => h(event));
  }

  private scheduleReconnect(delayMs: number): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (e) {
        console.error('[3CX WS] Reconnect failed:', e);
        this.scheduleReconnect(Math.min(delayMs * 2, 30000));
      }
    }, delayMs);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
