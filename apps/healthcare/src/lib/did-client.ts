import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export const did = {
  health: () => httpJson<any>(`${endpoints.did}/health`),

  createDoctorDid: (payload: { doctorName: string; licenseNumber: string; specialization?: string }) =>
    httpJson<any>(`${endpoints.did}/api/did/doctor/create`, { method: 'POST', body: payload }),

  resolve: (didValue: string) => httpJson<any>(`${endpoints.did}/api/did/resolve/${encodeURIComponent(didValue)}`),

  doctorCredentials: (didValue: string) =>
    httpJson<any>(`${endpoints.did}/api/did/doctor/${encodeURIComponent(didValue)}/credentials`),

  issueCredential: (payload: any) => httpJson<any>(`${endpoints.did}/api/did/credential/issue`, { method: 'POST', body: payload }),
  verifyCredential: (payload: any) => httpJson<any>(`${endpoints.did}/api/did/credential/verify`, { method: 'POST', body: payload }),
}
