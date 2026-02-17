import { describe, it, expect, vi, beforeEach } from 'vitest'
import { patientService, PatientRegistration } from '../patient-service'

describe('PatientService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('registerPatient', () => {
    it('should register patient with DID and OID', async () => {
      const mockPatient: PatientRegistration = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '+966501234567',
        email: 'john@example.com',
        address: 'Riyadh, Saudi Arabia',
      }

      // Mock DID creation
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ did: 'did:brainsait:patient:123' }),
      })

      // Mock OID assignment
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ oid: '1.3.6.1.4.1.61026.3.1.123' }),
      })

      // Mock patient creation
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'patient-123',
          ...mockPatient,
          did: 'did:brainsait:patient:123',
          oid: '1.3.6.1.4.1.61026.3.1.123',
          status: 'active',
        }),
      })

      const result = await patientService.registerPatient(mockPatient)

      expect(result.did).toBe('did:brainsait:patient:123')
      expect(result.oid).toBe('1.3.6.1.4.1.61026.3.1.123')
      expect(result.status).toBe('active')
    })

    it('should handle DID service failure gracefully', async () => {
      const mockPatient: PatientRegistration = {
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '1995-01-01',
        gender: 'female',
        phone: '+966507654321',
        address: 'Jeddah, Saudi Arabia',
      }

      // Mock DID failure
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
      })

      // Mock OID success
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ oid: '1.3.6.1.4.1.61026.3.1.456' }),
      })

      // Mock patient creation
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'patient-456',
          ...mockPatient,
          did: expect.stringContaining('temp-'),
          oid: '1.3.6.1.4.1.61026.3.1.456',
          status: 'active',
        }),
      })

      const result = await patientService.registerPatient(mockPatient)

      expect(result.did).toContain('temp-')
      expect(result.oid).toBeTruthy()
    })
  })

  describe('getPatient', () => {
    it('should fetch patient by ID', async () => {
      const mockPatient = {
        id: 'patient-123',
        firstName: 'John',
        lastName: 'Doe',
        did: 'did:brainsait:patient:123',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      })

      const result = await patientService.getPatient('patient-123')

      expect(result).toEqual(mockPatient)
    })

    it('should return null for non-existent patient', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
      })

      const result = await patientService.getPatient('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('searchPatients', () => {
    it('should search patients by query', async () => {
      const mockResults = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Doe' },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      })

      const results = await patientService.searchPatients('Doe')

      expect(results).toHaveLength(2)
      expect(results[0].lastName).toBe('Doe')
    })
  })
})
