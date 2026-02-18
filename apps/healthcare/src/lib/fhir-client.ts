import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export type FhirBundle<T> = {
  resourceType: 'Bundle'
  type?: string
  total?: number
  entry?: Array<{ resource: T }>
}

export type FhirHumanName = { family?: string; given?: string[] }

export type FhirPatient = {
  resourceType: 'Patient'
  id?: string
  active?: boolean
  name?: FhirHumanName[]
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  telecom?: Array<{ system: string; value: string; use?: string }>
}

function base() {
  return `${endpoints.fhir}/fhir`
}

export const fhir = {
  health: () => httpJson<{ status: string }>(`${endpoints.fhir}/health`),

  searchPatients: async (params?: { name?: string }) => {
    const qs = new URLSearchParams()
    if (params?.name) qs.set('name', params.name)
    const url = `${base()}/Patient${qs.toString() ? `?${qs}` : ''}`
    return httpJson<FhirBundle<FhirPatient>>(url)
  },

  createPatient: (patient: FhirPatient) =>
    httpJson<FhirPatient>(`${base()}/Patient`, { method: 'POST', body: patient }),

  readPatient: (id: string) =>
    httpJson<FhirPatient>(`${base()}/Patient/${encodeURIComponent(id)}`),
}
