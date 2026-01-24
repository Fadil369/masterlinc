import type { TokenResponse } from '../types/3cx-api.js';

export class TokenManager {
  private token: string | null = null;
  private expiresAt = 0;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fqdn: string,
    private username: string,
    private password: string,
  ) {}

  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt) {
      return this.token;
    }
    return this.authenticate();
  }

  private async authenticate(): Promise<string> {
    const url = `https://${this.fqdn}/connect/token`;
    const body = new URLSearchParams({
      grant_type: 'password',
      username: this.username,
      password: this.password,
      client_id: '3CXPhoneSystem',
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`3CX auth failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.token = data.access_token;
    // Refresh 5 minutes before expiry
    const ttlMs = (data.expires_in - 300) * 1000;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.authenticate(), Math.max(ttlMs, 60000));

    return this.token;
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.token = null;
  }
}
