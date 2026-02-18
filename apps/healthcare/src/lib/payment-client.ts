import { endpoints } from './api-endpoints'
import { httpJson } from './http'

export type CreateIntentRequest = {
  patientId: string
  amount: number
  currency?: string
  description?: string
}

export type CreateIntentResponse = {
  success: boolean
  clientSecret?: string
  paymentIntentId?: string
  error?: string
}

export const payment = {
  health: () => httpJson<{ status: string }>(`${endpoints.payment}/health`),

  createIntent: (payload: CreateIntentRequest) =>
    httpJson<CreateIntentResponse>(`${endpoints.payment}/api/payments/create-intent`, {
      method: 'POST',
      body: payload,
    }),

  history: (patientId: string) =>
    httpJson<any>(`${endpoints.payment}/api/payments/history/${encodeURIComponent(patientId)}`),
}
