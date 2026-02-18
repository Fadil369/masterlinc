// Backend endpoints (local docker-compose ports by default)
// Override using VITE_* env vars.

export const endpoints = {
  fhir: import.meta.env.VITE_FHIR_URL || 'http://localhost:3101',
  payment: import.meta.env.VITE_PAYMENT_URL || 'http://localhost:4100',
  audit: import.meta.env.VITE_AUDIT_URL || 'http://localhost:5100',
}
