import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export const basma = {
  // basma-voice worker (if running). Endpoints follow orchestrator integration contract.
  health: () => httpJson<any>(`${endpoints.basma}/health`),

  makeCall: (payload: { from: string; to: string; message?: string }) =>
    httpJson<any>(`${endpoints.basma}/api/calls/make`, { method: 'POST', body: payload }),

  routeCall: (callId: string, context: Record<string, any>) =>
    httpJson<any>(`${endpoints.basma}/api/calls/${encodeURIComponent(callId)}/route`, {
      method: 'POST',
      body: { context },
    }),

  transcript: (callId: string) => httpJson<any>(`${endpoints.basma}/api/calls/${encodeURIComponent(callId)}/transcript`),
  statistics: () => httpJson<any>(`${endpoints.basma}/api/calls/statistics`),
}
