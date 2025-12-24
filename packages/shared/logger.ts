import type { Env } from './types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function log(level: LogLevel, message: string, extra?: Record<string, any>) {
  const payload = {
    level,
    message,
    ts: Date.now(),
    ...extra,
  };
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](JSON.stringify(payload));
}

export async function writeAudit(env: Env, data: {
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
}) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, changes, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      data.user_id || null,
      data.action,
      data.resource_type,
      data.resource_id,
      data.changes ? JSON.stringify(data.changes) : null,
      data.ip_address || null,
      data.user_agent || null,
      Date.now()
    ).run();
  } catch (e) {
    log('error', 'audit_log_write_failed', { error: String(e) });
  }
}
