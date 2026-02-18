import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export const oid = {
  health: () => httpJson<any>(`${endpoints.oid}/health`),

  register: (payload: { type: string; name: string; metadata?: Record<string, any> }) =>
    httpJson<any>(`${endpoints.oid}/api/oid/register`, { method: 'POST', body: payload }),

  resolve: (oidValue: string) => httpJson<any>(`${endpoints.oid}/api/oid/resolve/${encodeURIComponent(oidValue)}`),

  validate: (payload: { oid: string }) => httpJson<any>(`${endpoints.oid}/api/oid/validate`, { method: 'POST', body: payload }),

  hierarchy: () => httpJson<any>(`${endpoints.oid}/api/oid/hierarchy`),
}
