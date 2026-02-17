/**
 * Claim Service - Handles SBS billing and claims
 */

import { logger } from '../lib/logger'
import { analytics } from '../lib/analytics'

export interface ClaimService {
  code: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  providerId: string
  serviceDate: string
}

export interface CreateClaimRequest {
  patientOid: string
  providerOid: string
  facilityOid: string
  diagnosisCode: string
  services: ClaimService[]
  scenario?: string
}

export interface Claim {
  claimId: string
  patientOid: string
  providerOid: string
  facilityOid: string
  diagnosisCode: string
  totalAmount: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid'
  nphiesId?: string
  rejectionReason?: string
  digitalSignature?: string
  submittedAt?: string
  reviewedAt?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

class ClaimServiceAPI {
  private baseUrl = import.meta.env.VITE_SBS_API_URL || '/api/sbs'

  /**
   * Create new claim
   */
  async createClaim(data: CreateClaimRequest): Promise<Claim> {
    logger.info('Creating new claim', { patientOid: data.patientOid })
    analytics.feature('claim-creation', 'started')

    try {
      const response = await fetch(`${this.baseUrl}/api/claims/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_SBS_API_KEY || '',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create claim')
      }

      const claim = await response.json()
      
      analytics.feature('claim-creation', 'completed', { claimId: claim.claimId })
      logger.info('Claim created successfully', { claimId: claim.claimId })

      return claim
    } catch (error) {
      logger.error('Failed to create claim', error as Error)
      analytics.error(error as Error, { context: 'claim-creation' })
      throw error
    }
  }

  /**
   * Validate claim
   */
  async validateClaim(claimId: string): Promise<{
    valid: boolean
    errors?: string[]
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/claims/${claimId}/validate`, {
        method: 'POST',
        headers: {
          'X-API-Key': import.meta.env.VITE_SBS_API_KEY || '',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to validate claim')
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to validate claim', error as Error, { claimId })
      throw error
    }
  }

  /**
   * Submit claim to NPHIES
   */
  async submitClaim(claimId: string): Promise<Claim> {
    logger.info('Submitting claim to NPHIES', { claimId })
    analytics.feature('claim-submission', 'started', { claimId })

    try {
      const response = await fetch(`${this.baseUrl}/api/claims/${claimId}/submit`, {
        method: 'POST',
        headers: {
          'X-API-Key': import.meta.env.VITE_SBS_API_KEY || '',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit claim')
      }

      const claim = await response.json()
      
      analytics.feature('claim-submission', 'completed', { 
        claimId,
        nphiesId: claim.nphiesId 
      })

      return claim
    } catch (error) {
      logger.error('Failed to submit claim', error as Error, { claimId })
      analytics.error(error as Error, { context: 'claim-submission', claimId })
      throw error
    }
  }

  /**
   * Get claim by ID
   */
  async getClaim(claimId: string): Promise<Claim | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/claims/${claimId}`, {
        headers: {
          'X-API-Key': import.meta.env.VITE_SBS_API_KEY || '',
        },
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to fetch claim', error as Error, { claimId })
      return null
    }
  }

  /**
   * List claims for patient
   */
  async getPatientClaims(patientOid: string): Promise<Claim[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/claims?patientOid=${encodeURIComponent(patientOid)}`,
        {
          headers: {
            'X-API-Key': import.meta.env.VITE_SBS_API_KEY || '',
          },
        }
      )

      if (!response.ok) {
        return []
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to fetch patient claims', error as Error, { patientOid })
      return []
    }
  }

  /**
   * Get claim statistics
   */
  async getClaimStatistics(params?: {
    startDate?: string
    endDate?: string
    status?: string
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams(params as any)
      const response = await fetch(
        `${this.baseUrl}/api/claims/statistics?${queryParams}`,
        {
          headers: {
            'X-API-Key': import.meta.env.VITE_SBS_API_KEY || '',
          },
        }
      )

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to fetch claim statistics', error as Error)
      return null
    }
  }
}

export const claimService = new ClaimServiceAPI()
