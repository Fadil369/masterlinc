/**
 * PresenceDO — Durable Object for real-time user presence.
 * Tracks who is online in a given room (e.g. "patient-123", "ward-A").
 * Clients connect via WebSocket; presence updates broadcast to all peers.
 */
export class PresenceDO {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, { userId: string; role: string; joinedAt: number }> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? 'anonymous';
    const role = url.searchParams.get('role') ?? 'user';

    const { 0: client, 1: server } = new WebSocketPair();
    this.state.acceptWebSocket(server);

    const session = { userId, role, joinedAt: Date.now() };
    this.sessions.set(server, session);
    this.broadcast({ type: 'presence', event: 'join', userId, role, ts: session.joinedAt });

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
    try {
      const data = JSON.parse(typeof msg === 'string' ? msg : new TextDecoder().decode(msg));
      const session = this.sessions.get(ws);
      if (session) {
        this.broadcast({ ...data, from: session.userId, ts: Date.now() }, ws);
      }
    } catch {}
  }

  webSocketClose(ws: WebSocket) {
    const session = this.sessions.get(ws);
    if (session) {
      this.sessions.delete(ws);
      this.broadcast({ type: 'presence', event: 'leave', userId: session.userId, ts: Date.now() });
    }
  }

  private broadcast(msg: unknown, exclude?: WebSocket) {
    const text = JSON.stringify(msg);
    for (const [ws] of this.sessions) {
      if (ws !== exclude) {
        try { ws.send(text); } catch {}
      }
    }
  }

  /** HTTP: list current presence */
  async currentPresence(): Promise<Array<{ userId: string; role: string; joinedAt: number }>> {
    return Array.from(this.sessions.values());
  }
}

/**
 * NotificationsDO — Durable Object for per-user push notifications.
 * Buffers notifications when the user is offline; delivers on reconnect.
 */
export class NotificationsDO {
  private state: DurableObjectState;
  private socket: WebSocket | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade — client connecting to receive notifications
    if (request.headers.get('Upgrade') === 'websocket') {
      const { 0: client, 1: server } = new WebSocketPair();
      this.state.acceptWebSocket(server);
      this.socket = server;

      // Deliver any buffered notifications
      const buffered = (await this.state.storage.get<unknown[]>('buffer')) ?? [];
      for (const n of buffered) {
        try { server.send(JSON.stringify(n)); } catch {}
      }
      await this.state.storage.delete('buffer');

      return new Response(null, { status: 101, webSocket: client });
    }

    // POST — push a notification (called from other workers/services)
    if (request.method === 'POST') {
      const notification = await request.json();
      const ts = Date.now();
      const msg = { ...notification as object, ts };

      if (this.socket) {
        try {
          this.socket.send(JSON.stringify(msg));
          return new Response(JSON.stringify({ delivered: true }), { headers: { 'Content-Type': 'application/json' } });
        } catch {}
      }

      // Buffer for later delivery (max 100 notifications)
      const buffer = (await this.state.storage.get<unknown[]>('buffer')) ?? [];
      buffer.push(msg);
      await this.state.storage.put('buffer', buffer.slice(-100));
      return new Response(JSON.stringify({ buffered: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not found', { status: 404 });
  }

  webSocketClose() {
    this.socket = null;
  }
}
