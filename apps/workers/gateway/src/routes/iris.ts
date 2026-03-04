import { Hono } from 'hono';
import type { Env } from '../index';

export const irisRoutes = new Hono<{ Bindings: Env }>();

// FHIR resource types supported
const FHIR_RESOURCES = ['Patient','Condition','MedicationRequest','Procedure',
  'DiagnosticReport','Observation','ImagingStudy','Claim','ClaimResponse',
  'DocumentReference','Appointment','Coverage','Organization','Practitioner'];

/** Proxy any FHIR GET to IRIS */
irisRoutes.get('/fhir/:resource', async (c) => {
  const resource = c.req.param('resource');
  if (!FHIR_RESOURCES.includes(resource)) return c.json({ error: 'Unknown resource type' }, 400);

  const params = Object.fromEntries(new URL(c.req.url).searchParams);
  const cacheKey = `iris:${resource}:${JSON.stringify(params)}`;

  // Check KV cache (30s TTL)
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached), 200, { 'X-Cache': 'HIT' });

  const url = new URL(`${c.env.IRIS_FHIR_URL}/${resource}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const resp = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/fhir+json',
      'Authorization': 'Basic ' + btoa(`SuperUser:${c.env.IRIS_PASSWORD}`),
    },
  });
  const body = await resp.json() as unknown;
  if (resp.ok) await c.env.CACHE.put(cacheKey, JSON.stringify(body), { expirationTtl: 30 });
  return c.json(body as Record<string, unknown>, resp.status as 200);
});

irisRoutes.get('/fhir/:resource/:id', async (c) => {
  const { resource, id } = c.req.param();
  const cacheKey = `iris:${resource}/${id}`;
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) return c.json(JSON.parse(cached), 200, { 'X-Cache': 'HIT' });

  const resp = await fetch(`${c.env.IRIS_FHIR_URL}/${resource}/${id}`, {
    headers: {
      'Accept': 'application/fhir+json',
      'Authorization': 'Basic ' + btoa(`SuperUser:${c.env.IRIS_PASSWORD}`),
    },
  });
  if (resp.status === 404) return c.json({ error: 'Not found' }, 404);
  const body = await resp.json() as unknown;
  if (resp.ok) await c.env.CACHE.put(cacheKey, JSON.stringify(body), { expirationTtl: 60 });
  return c.json(body as Record<string, unknown>, resp.status as 200);
});

/** IRIS server health */
irisRoutes.get('/health', async (c) => {
  const resp = await fetch(`${c.env.IRIS_FHIR_URL}/metadata`, {
    headers: {
      'Accept': 'application/fhir+json',
      'Authorization': 'Basic ' + btoa(`SuperUser:${c.env.IRIS_PASSWORD}`),
    },
    signal: AbortSignal.timeout(8000),
  }).catch(e => null);
  if (!resp?.ok) return c.json({ reachable: false }, 503);
  const meta = await resp.json() as Record<string, unknown>;
  return c.json({ reachable: true, fhirVersion: meta.fhirVersion });
});
