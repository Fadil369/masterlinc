import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export type AuditLogRequest = {
  actorId: string
  actorRole: string
  action: string
  resourceType: string
  resourceId: string
  patientId?: string
  metadata?: Record<string, any>
}

export const audit = {
  health: () => httpJson<{ status: string }>(`${endpoints.audit}/health`),

  log: (entry: AuditLogRequest) =>
    httpJson<{ success: boolean }>(`${endpoints.audit}/api/audit/log`, {
      method: 'POST',
      body: entry,
    }),

  search: (params: { actorId?: string; patientId?: string; resourceType?: string }) => {
    const qs = new URLSearchParams()
    if (params.actorId) qs.set('actorId', params.actorId)
    if (params.patientId) qs.set('patientId', params.patientId)
    if (params.resourceType) qs.set('resourceType', params.resourceType)
    return httpJson<any>(`${endpoints.audit}/api/audit/search?${qs}`)
  },
}
