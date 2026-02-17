import { describe, it, expect, vi, beforeEach } from 'vitest'
import { claimService, CreateClaimRequest } from '../claim-service'

describe('ClaimService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('createClaim', () => {
    it('should create a new claim', async () => {
      const mockClaim: CreateClaimRequest = {
        patientOid: '1.3.6.1.4.1.61026.3.1.123',
        providerOid: '1.3.6.1.4.1.61026.2.1.456',
        facilityOid: '1.3.6.1.4.1.61026.1.1.789',
        diagnosisCode: 'A00.0',
        services: [
          {
            code: 'SVC001',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            providerId: 'provider-456',
            serviceDate: '2024-01-01',
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claimId: 'claim_123',
          ...mockClaim,
          totalAmount: 100,
          status: 'draft',
          createdAt: new Date().toISOString(),
        }),
      })

      const result = await claimService.createClaim(mockClaim)

      expect(result.claimId).toBe('claim_123')
      expect(result.status).toBe('draft')
      expect(result.totalAmount).toBe(100)
    })

    it('should throw error on claim creation failure', async () => {
      const mockClaim: CreateClaimRequest = {
        patientOid: '1.3.6.1.4.1.61026.3.1.123',
        providerOid: '1.3.6.1.4.1.61026.2.1.456',
        facilityOid: '1.3.6.1.4.1.61026.1.1.789',
        diagnosisCode: 'INVALID',
        services: [],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid diagnosis code' }),
      })

      await expect(claimService.createClaim(mockClaim)).rejects.toThrow(
        'Invalid diagnosis code'
      )
    })
  })

  describe('validateClaim', () => {
    it('should validate a claim successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      })

      const result = await claimService.validateClaim('claim_123')

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should return validation errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          errors: ['Invalid diagnosis code', 'Missing service date'],
        }),
      })

      const result = await claimService.validateClaim('claim_456')

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('submitClaim', () => {
    it('should submit claim to NPHIES', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claimId: 'claim_123',
          status: 'submitted',
          nphiesId: 'NPHIES-123456',
          submittedAt: new Date().toISOString(),
        }),
      })

      const result = await claimService.submitClaim('claim_123')

      expect(result.status).toBe('submitted')
      expect(result.nphiesId).toBe('NPHIES-123456')
    })
  })
})
