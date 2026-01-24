import type { TokenManager } from '../auth/token-manager.js';
import type { Extension, CallLogEntry, Message, PresenceStatus } from '../types/3cx-api.js';

export class XApiClient {
  private baseUrl: string;

  constructor(
    private fqdn: string,
    private tokenManager: TokenManager,
  ) {
    this.baseUrl = `https://${fqdn}/xapi/v1`;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const headers = await this.tokenManager.getAuthHeaders();
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: { ...headers, Accept: 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`3CX xAPI error ${res.status} on ${path}: ${text}`);
    }

    const json = await res.json() as { value?: T } & T;
    return (json.value ?? json) as T;
  }

  async getExtensions(department?: string): Promise<Extension[]> {
    const params: Record<string, string> = {};
    if (department) {
      params['$filter'] = `Department eq '${department}'`;
    }
    return this.request<Extension[]>('/Extensions', params);
  }

  async getExtension(extensionNumber: string): Promise<Extension | null> {
    const extensions = await this.request<Extension[]>('/Extensions', {
      '$filter': `Number eq '${extensionNumber}'`,
    });
    return extensions[0] ?? null;
  }

  async getPresence(extensionNumber: string): Promise<PresenceStatus> {
    const ext = await this.getExtension(extensionNumber);
    if (!ext) {
      return {
        Extension: extensionNumber,
        Status: 'Offline',
        OnCall: false,
      };
    }
    return {
      Extension: ext.Number,
      Status: ext.CurrentProfile as PresenceStatus['Status'],
      OnCall: ext.QueueStatus === 'LoggedIn',
    };
  }

  async getCallLogs(options: {
    extension?: string;
    direction?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<CallLogEntry[]> {
    const params: Record<string, string> = {
      '$top': String(options.limit ?? 20),
      '$orderby': 'StartTime desc',
    };

    const filters: string[] = [];
    if (options.extension) filters.push(`Extension eq '${options.extension}'`);
    if (options.direction) filters.push(`Direction eq '${options.direction}'`);
    if (options.startDate) filters.push(`StartTime ge ${options.startDate}`);
    if (options.endDate) filters.push(`StartTime le ${options.endDate}`);

    if (filters.length > 0) {
      params['$filter'] = filters.join(' and ');
    }

    return this.request<CallLogEntry[]>('/ReportCallLog', params);
  }

  async getMessages(options?: {
    extension?: string;
    channel?: string;
    limit?: number;
  }): Promise<Message[]> {
    const params: Record<string, string> = {
      '$top': String(options?.limit ?? 50),
      '$orderby': 'Timestamp desc',
    };

    const filters: string[] = [];
    if (options?.extension) filters.push(`From eq '${options.extension}' or To eq '${options.extension}'`);
    if (options?.channel) filters.push(`Channel eq '${options.channel}'`);

    if (filters.length > 0) {
      params['$filter'] = filters.join(' and ');
    }

    return this.request<Message[]>('/Messages', params);
  }

  async sendMessage(from: string, to: string, body: string, channel: string): Promise<{ success: boolean }> {
    const headers = await this.tokenManager.getAuthHeaders();
    const res = await fetch(`${this.baseUrl}/Messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ From: from, To: to, Body: body, Channel: channel }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`3CX send message failed (${res.status}): ${text}`);
    }
    return { success: true };
  }
}
