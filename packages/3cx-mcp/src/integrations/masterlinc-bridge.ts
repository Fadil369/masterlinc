import type { Config } from '../config.js';
import type { ActiveCall } from '../types/3cx-api.js';

interface LincCoordinateRequest {
  event: 'call.incoming' | 'call.answered' | 'call.ended' | 'message.received';
  caller: string;
  callee: string;
  extension: string;
  direction: string;
  metadata?: Record<string, unknown>;
}

interface LincCoordinateResponse {
  action: 'answer' | 'transfer' | 'voicemail' | 'ai_handle' | 'queue';
  agent?: string;
  destination?: string;
  message?: string;
}

export class MasterLincBridge {
  private baseUrl: string | undefined;

  constructor(config: Config) {
    this.baseUrl = config.MASTERLINC_BASE_URL;
  }

  get isConfigured(): boolean {
    return !!this.baseUrl;
  }

  async coordinateCall(call: ActiveCall): Promise<LincCoordinateResponse> {
    if (!this.baseUrl) {
      return { action: 'answer' };
    }

    const request: LincCoordinateRequest = {
      event: call.Status === 'Ringing' ? 'call.incoming' : 'call.answered',
      caller: call.Caller,
      callee: call.Callee,
      extension: call.Extension,
      direction: call.Direction,
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/coordinate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        console.error(`[MasterLinc] Coordinate failed (${res.status})`);
        return { action: 'answer' };
      }

      return (await res.json()) as LincCoordinateResponse;
    } catch (err) {
      console.error('[MasterLinc] Connection error:', err);
      return { action: 'answer' };
    }
  }

  async notifyCallEnd(call: ActiveCall, summary?: string): Promise<void> {
    if (!this.baseUrl) return;

    try {
      await fetch(`${this.baseUrl}/api/v1/coordinate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'call.ended',
          caller: call.Caller,
          callee: call.Callee,
          extension: call.Extension,
          direction: call.Direction,
          metadata: { summary },
        }),
      });
    } catch (err) {
      console.error('[MasterLinc] Notify error:', err);
    }
  }

  async routeMessage(from: string, to: string, body: string, channel: string): Promise<LincCoordinateResponse> {
    if (!this.baseUrl) {
      return { action: 'answer' };
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/coordinate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'message.received',
          caller: from,
          callee: to,
          extension: to,
          direction: 'Inbound',
          metadata: { body, channel },
        }),
      });

      if (!res.ok) return { action: 'answer' };
      return (await res.json()) as LincCoordinateResponse;
    } catch {
      return { action: 'answer' };
    }
  }
}
