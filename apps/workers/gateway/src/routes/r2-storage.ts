import { Hono } from 'hono';
import type { Env } from '../index';

export const r2Routes = new Hono<{ Bindings: Env }>();

const ALLOWED_TYPES = new Set([
  'application/dicom', 'application/pdf', 'image/jpeg', 'image/png',
  'image/tiff', 'text/plain', 'application/json', 'application/x-ndjson',
]);

/** Upload a medical file to R2 */
r2Routes.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const patientId = formData.get('patient_id') as string | null;
  const studyId = formData.get('study_id') as string | null;
  const fileType = formData.get('file_type') as string ?? 'other';

  if (!file) return c.json({ error: 'No file provided' }, 400);
  if (!ALLOWED_TYPES.has(file.type)) return c.json({ error: 'File type not allowed' }, 415);
  if (file.size > 500 * 1024 * 1024) return c.json({ error: 'File too large (max 500MB)' }, 413);

  const fileId = crypto.randomUUID();
  const r2Key = `${patientId ?? 'unassigned'}/${studyId ?? 'misc'}/${fileId}/${file.name}`;

  await c.env.MEDICAL_FILES.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
    customMetadata: {
      patient_id: patientId ?? '',
      study_id: studyId ?? '',
      file_type: fileType,
      original_name: file.name,
    },
  });

  await c.env.DB.prepare(`
    INSERT INTO file_registry (id, r2_key, filename, mime_type, size_bytes, patient_id, study_id, file_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(fileId, r2Key, file.name, file.type, file.size, patientId, studyId, fileType).run();

  return c.json({ id: fileId, r2_key: r2Key, size: file.size }, 201);
});

/** Download / get presigned-like URL for a file */
r2Routes.get('/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const row = await c.env.DB.prepare(
    'SELECT * FROM file_registry WHERE id = ?'
  ).bind(fileId).first() as Record<string, unknown> | null;
  if (!row) return c.json({ error: 'File not found' }, 404);

  const obj = await c.env.MEDICAL_FILES.get(row.r2_key as string);
  if (!obj) return c.json({ error: 'File missing from storage' }, 404);

  return new Response(obj.body, {
    headers: {
      'Content-Type': row.mime_type as string,
      'Content-Disposition': `inline; filename="${row.filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
});

/** List files for a patient */
r2Routes.get('/', async (c) => {
  const patientId = c.req.query('patient_id');
  const studyId = c.req.query('study_id');
  let stmt = 'SELECT id, filename, mime_type, size_bytes, file_type, uploaded_at, iris_ref FROM file_registry';
  const params: string[] = [];
  const where: string[] = [];
  if (patientId) { where.push('patient_id = ?'); params.push(patientId); }
  if (studyId) { where.push('study_id = ?'); params.push(studyId); }
  if (where.length) stmt += ' WHERE ' + where.join(' AND ');
  stmt += ' ORDER BY uploaded_at DESC LIMIT 50';
  const rows = await c.env.DB.prepare(stmt).bind(...params).all();
  return c.json({ files: rows.results });
});

/** Delete a file */
r2Routes.delete('/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const row = await c.env.DB.prepare('SELECT r2_key FROM file_registry WHERE id = ?').bind(fileId).first() as Record<string, unknown> | null;
  if (!row) return c.json({ error: 'Not found' }, 404);
  await Promise.all([
    c.env.MEDICAL_FILES.delete(row.r2_key as string),
    c.env.DB.prepare('DELETE FROM file_registry WHERE id = ?').bind(fileId).run(),
  ]);
  return c.json({ deleted: true });
});
