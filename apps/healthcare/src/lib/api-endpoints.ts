// Backend endpoints (local docker-compose ports by default)
// Override using VITE_* env vars.

export const endpoints = {
  fhir: import.meta.env.VITE_FHIR_URL || 'http://localhost:3101',
  payment: import.meta.env.VITE_PAYMENT_URL || 'http://localhost:4100',
  audit: import.meta.env.VITE_AUDIT_URL || 'http://localhost:5100',

  // Optional Phase 1-3 services / workers (enable when running)
  sbs: import.meta.env.VITE_SBS_URL || 'http://localhost:8787',
  oid: import.meta.env.VITE_OID_URL || 'http://localhost:3001',
  did: import.meta.env.VITE_DID_URL || 'http://localhost:3002',
  basma: import.meta.env.VITE_BASMA_URL || 'http://localhost:8788',
  notion: import.meta.env.VITE_NOTION_BRIDGE_URL || 'http://localhost:7400',
}
