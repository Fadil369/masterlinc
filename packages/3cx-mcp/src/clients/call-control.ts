import type { TokenManager } from '../auth/token-manager.js';
import type { ActiveCall, CallControlResponse, Participant } from '../types/3cx-api.js';

export class CallControlClient {
  private baseUrl: string;

  constructor(
    private fqdn: string,
    private tokenManager: TokenManager,
  ) {
    this.baseUrl = `https://${fqdn}/callcontrol`;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.tokenManager.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`3CX API error ${res.status} on ${path}: ${text}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json() as Promise<T>;
    }
    return { success: true } as T;
  }

  async makeCall(extension: string, destination: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/makecall`, {
      method: 'POST',
      body: JSON.stringify({ destination }),
    });
  }

  async answerCall(extension: string, participantId: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/answer`, {
      method: 'POST',
    });
  }

  async dropCall(extension: string, participantId: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/drop`, {
      method: 'POST',
    });
  }

  async holdCall(extension: string, participantId: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/hold`, {
      method: 'POST',
    });
  }

  async resumeCall(extension: string, participantId: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/resume`, {
      method: 'POST',
    });
  }

  async transferBlind(extension: string, participantId: string, destination: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/transfer/blind`, {
      method: 'POST',
      body: JSON.stringify({ destination }),
    });
  }

  async transferAttended(extension: string, participantId: string, destination: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/transfer/attended`, {
      method: 'POST',
      body: JSON.stringify({ destination }),
    });
  }

  async startRecording(extension: string, participantId: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/record/start`, {
      method: 'POST',
    });
  }

  async stopRecording(extension: string, participantId: string): Promise<CallControlResponse> {
    return this.request<CallControlResponse>(`/${extension}/${participantId}/record/stop`, {
      method: 'POST',
    });
  }

  async getActiveCalls(extension: string): Promise<ActiveCall[]> {
    return this.request<ActiveCall[]>(`/${extension}/calls`);
  }

  async getParticipants(extension: string): Promise<Participant[]> {
    return this.request<Participant[]>(`/${extension}/participants`);
  }
}
