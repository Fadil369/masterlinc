import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export type ClaimCreateRequest = {
  patient_oid: string
  provider_oid: string
  facility_oid: string
  diagnosis_code?: string
  services?: Array<{ code: string; description: string; quantity: number; unit_price: number }>
}

export const sbs = {
  health: () => httpJson<any>(`${endpoints.sbs}/health`),

  createClaim: (payload: ClaimCreateRequest) =>
    httpJson<any>(`${endpoints.sbs}/api/claims/create`, { method: 'POST', body: payload }),

  submitToNphies: (claimId: string) =>
    httpJson<any>(`${endpoints.sbs}/api/claims/${encodeURIComponent(claimId)}/submit-nphies`, { method: 'POST' }),

  getClaim: (claimId: string) => httpJson<any>(`${endpoints.sbs}/api/claims/${encodeURIComponent(claimId)}`),

  listClaims: (params?: { status?: string; limit?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.limit) qs.set('limit', params.limit)
    const suffix = qs.toString() ? `?${qs}` : ''
    return httpJson<any>(`${endpoints.sbs}/api/claims${suffix}`)
  },

  claimsByPatientOid: (oid: string) => httpJson<any>(`${endpoints.sbs}/api/claims/patient/${encodeURIComponent(oid)}`),

  statistics: () => httpJson<any>(`${endpoints.sbs}/api/statistics/claims`),
}
