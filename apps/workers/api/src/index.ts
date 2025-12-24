import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '@basma/shared/types';
import { transcribeAudio, synthesizeSpeech } from '@basma/shared/speech';
import { createRequestId, log, writeAudit } from '@basma/shared/logger';

const app = new Hono<{ Bindings: Env }>();
app.use('/*', cors());

// Structured logging middleware
app.use('*', async (c, next) => {
  const rid = c.req.header('x-request-id') || createRequestId();
  (c as any).reqId = rid;
  const start = Date.now();
  log('info', 'request_start', { rid, method: c.req.method, path: new URL(c.req.url).pathname });
  try {
    await next();
  } finally {
    const ms = Date.now() - start;
    log('info', 'request_end', { rid, status: c.res.status, ms });
  }
});

app.get('/health', (c) => c.json({ ok: true, env: c.env.ENVIRONMENT }));

app.get('/version', (c) => c.json({ name: 'basma-api', version: '1.0.0' }));

app.get('/time', (c) => c.json({ now: Date.now() }));

// Appointments CRUD
app.get('/appointments', async (c) => {
  const userId = c.req.query('user_id');
  let stmt = `SELECT * FROM appointments`;
  const params: any[] = [];
  if (userId) {
    stmt += ` WHERE user_id = ? ORDER BY start_time DESC`;
    params.push(userId);
  } else {
    stmt += ` ORDER BY start_time DESC`;
  }
  const result = await c.env.DB.prepare(stmt).bind(...params).all();
  return c.json(result.results || []);
});

app.get('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT * FROM appointments WHERE id = ?`).bind(id).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  return c.json(row);
});

app.post('/appointments', async (c) => {
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  const now = Date.now();
  const required = ['user_id', 'title', 'type', 'start_time', 'end_time', 'timezone'];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null) {
      return c.json({ error: `Missing field: ${k}` }, 400);
    }
  }
  await c.env.DB.prepare(`
    INSERT INTO appointments (
      id, user_id, visitor_id, title, description, type,
      start_time, end_time, timezone, status, meeting_link, location,
      attendees, reminders_sent, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.user_id,
    body.visitor_id || null,
    body.title,
    body.description || null,
    body.type,
    body.start_time,
    body.end_time,
    body.timezone,
    body.meeting_link || null,
    body.location || null,
    body.attendees ? JSON.stringify(body.attendees) : null,
    body.reminders_sent ? JSON.stringify(body.reminders_sent) : null,
    body.notes || null,
    now,
    now
  ).run();
  await writeAudit(c.env, { action: 'create', resource_type: 'appointment', resource_id: id, changes: body });
  return c.json({ id }, 201);
});

app.patch('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<any>();
  const fields: string[] = [];
  const values: any[] = [];
  const allowed = ['title', 'description', 'type', 'start_time', 'end_time', 'timezone', 'status', 'meeting_link', 'location', 'attendees', 'reminders_sent', 'notes'];
  for (const k of allowed) {
    if (k in body) {
      fields.push(`${k} = ?`);
      if (k === 'attendees' || k === 'reminders_sent') values.push(body[k] ? JSON.stringify(body[k]) : null);
      else values.push(body[k]);
    }
  }
  if (!fields.length) return c.json({ error: 'No fields to update' }, 400);
  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);
  await c.env.DB.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  await writeAudit(c.env, { action: 'update', resource_type: 'appointment', resource_id: id, changes: body });
  return c.json({ id });
});

app.delete('/appointments/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM appointments WHERE id = ?`).bind(id).run();
  await writeAudit(c.env, { action: 'delete', resource_type: 'appointment', resource_id: id });
  return c.body(null, 204);
});

// Visitor / Leads CRUD
app.get('/visitors', async (c) => {
  const userId = c.req.query('user_id');
  let stmt = `SELECT * FROM visitors`;
  const params: any[] = [];
  if (userId) {
    stmt += ` WHERE user_id = ? ORDER BY last_contact DESC`;
    params.push(userId);
  } else {
    stmt += ` ORDER BY last_contact DESC`;
  }
  const result = await c.env.DB.prepare(stmt).bind(...params).all();
  return c.json(result.results || []);
});

app.post('/visitors', async (c) => {
  const body = await c.req.json<any>();
  const id = body.id || crypto.randomUUID();
  const now = Date.now();
  
  // Check if visitor exists
  const existing = await c.env.DB.prepare('SELECT id FROM visitors WHERE phone = ? OR email = ?').bind(body.phone, body.email).first();
  
  if (existing) {
    await c.env.DB.prepare(`
      UPDATE visitors SET 
        name = coalesce(?, name),
        email = coalesce(?, email),
        last_contact = ?,
        total_interactions = total_interactions + 1,
        lead_score = ?,
        status = coalesce(?, status)
      WHERE id = ?
    `).bind(body.name, body.email, now, body.lead_score || 0, body.status, existing.id).run();
    return c.json({ id: existing.id, updated: true });
  }

  await c.env.DB.prepare(`
    INSERT INTO visitors (
      id, user_id, name, phone, email, source, lead_score, status, first_contact, last_contact, total_interactions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(
    id,
    body.user_id || 'system', // Default to system user if not provided
    body.name,
    body.phone,
    body.email,
    body.source || 'manual',
    body.lead_score || 0,
    body.status || 'new',
    now,
    now
  ).run();
  return c.json({ id }, 201);
});

// Call Logs
app.get('/logs', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 50').all();
  return c.json(result.results || []);
});

app.post('/logs', async (c) => {
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  const now = Date.now();
  await c.env.DB.prepare(`
    INSERT INTO call_logs (
      id, user_id, visitor_id, call_type, direction, duration_seconds, 
      status, summary, sentiment, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.user_id || 'system',
    body.visitor_id,
    body.call_type || 'inbound',
    'incoming',
    body.duration,
    'completed',
    body.summary,
    body.sentiment,
    now
  ).run();
  
  // Update visitor stats if visitor_id provided
  if (body.visitor_id) {
     await c.env.DB.prepare('UPDATE visitors SET last_contact = ?, total_interactions = total_interactions + 1 WHERE id = ?').bind(now, body.visitor_id).run();
  }
  
  return c.json({ id }, 201);
});

// Messages (WhatsApp/SMS) -- Mock sending, just store
app.post('/messages', async (c) => {
  const body = await c.req.json<any>();
  const id = crypto.randomUUID();
  const now = Date.now();
  // In a real app, calls Twilio/Meta API here
  
  await c.env.DB.prepare(`
    INSERT INTO messages (
      id, conversation_id, visitor_id, channel, direction, content, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    'conv_' + id, // Simple conversation ID generation
    body.visitor_id,
    body.channel || 'sms',
    'outbound',
    body.content,
    'sent',
    now
  ).run();
  
  return c.json({ id, status: 'sent' }, 201);
});

// Dashboard Aggregation
app.get('/dashboard', async (c) => {
  const [appointments, logs, visitors, leads] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM appointments ORDER BY start_time DESC LIMIT 5').all(),
    c.env.DB.prepare('SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 5').all(),
    c.env.DB.prepare('SELECT * FROM visitors ORDER BY last_contact DESC LIMIT 5').all(),
    c.env.DB.prepare("SELECT * FROM visitors WHERE status IN ('qualified', 'converted') OR lead_score > 50 ORDER BY last_contact DESC LIMIT 5").all()
  ]);
  
  return c.json({
    appointments: appointments.results,
    logs: logs.results,
    visitors: visitors.results,
    leads: leads.results
  });
});

// Simple STT endpoint: accepts JSON { audioBase64, mimeType }
app.post('/stt', async (c) => {
  const body = await c.req.json<{ audioBase64: string; mimeType?: string }>();
  const bytes = base64ToUint8Array(body.audioBase64);
  const result = await transcribeAudio(c.env, bytes, { mimeType: body.mimeType || 'audio/wav' });
  return c.json(result);
});

// Simple TTS endpoint: accepts JSON { text, voice, format }
app.post('/tts', async (c) => {
  const body = await c.req.json<{ text: string; voice?: string; format?: 'wav' | 'mp3' | 'mulaw' | 'pcm' }>();
  const audio = await synthesizeSpeech(c.env, body.text, { voice: body.voice, format: body.format });
  return new Response(uint8ToBlob(audio, body.format || 'mp3'), {
    headers: { 'Content-Type': contentTypeForFormat(body.format || 'mp3') }
  });
});

function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes;
}

function uint8ToBlob(bytes: Uint8Array, format: string): Blob {
  const type = contentTypeForFormat(format);
  return new Blob([bytes], { type });
}

function contentTypeForFormat(format: string): string {
  switch (format) {
    case 'wav': return 'audio/wav';
    case 'mp3': return 'audio/mpeg';
    case 'mulaw': return 'audio/basic';
    case 'pcm': return 'audio/L16';
    default: return 'application/octet-stream';
  }
}

export default app;