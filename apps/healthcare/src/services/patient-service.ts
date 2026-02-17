/**
 * Patient Service - Handles patient registration, DID/OID assignment, and workflows
 */

import { logger } from '../lib/logger'
import { analytics } from '../lib/analytics'

export interface PatientRegistration {
  // Demographics
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  phone: string
  email?: string
  address: string
  
  // Insurance
  insuranceProvider?: string
  policyNumber?: string
  groupNumber?: string
  
  // Medical History
  allergies?: string[]
  medications?: string[]
  conditions?: string[]
  
  // Chief Complaint
  chiefComplaint?: string
  symptomStartDate?: string
  severity?: number
}

export interface PatientRecord extends PatientRegistration {
  id: string
  did?: string // Decentralized Identifier
  oid?: string // Organization Identifier
  nationalId?: string
  insuranceVerified: boolean
  consentSigned: boolean
  status: 'pending' | 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

class PatientService {
  private baseUrl = import.meta.env.VITE_API_URL || '/api'

  /**
   * Register new patient with DID/OID assignment
   */
  async registerPatient(data: PatientRegistration): Promise<PatientRecord> {
    logger.info('Registering new patient', { firstName: data.firstName, lastName: data.lastName })
    analytics.feature('patient-registration', 'started')

    try {
      // Step 1: Create DID for patient
      const did = await this.createPatientDID(data)
      logger.info('Patient DID created', { did })

      // Step 2: Assign OID
      const oid = await this.assignPatientOID(data)
      logger.info('Patient OID assigned', { oid })

      // Step 3: Verify insurance if provided
      let insuranceVerified = false
      if (data.insuranceProvider && data.policyNumber) {
        insuranceVerified = await this.verifyInsurance(data)
        logger.info('Insurance verification completed', { verified: insuranceVerified })
      }

      // Step 4: Create patient record
      const response = await fetch(`${this.baseUrl}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          did,
          oid,
          insuranceVerified,
          status: 'active',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to register patient: ${response.statusText}`)
      }

      const patient = await response.json()
      
      analytics.feature('patient-registration', 'completed', { patientId: patient.id })
      logger.info('Patient registered successfully', { patientId: patient.id, did, oid })

      return patient
    } catch (error) {
      logger.error('Failed to register patient', error as Error)
      analytics.error(error as Error, { context: 'patient-registration' })
      throw error
    }
  }

  /**
   * Create DID for patient
   */
  private async createPatientDID(data: PatientRegistration): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/did/patient/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nationalId: data.nationalId,
          fullName: `${data.firstName} ${data.lastName}`,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          email: data.email,
        }),
      })

      if (!response.ok) {
        logger.warn('DID creation failed, generating temporary ID')
        return `did:brainsait:patient:temp-${Date.now()}`
      }

      const result = await response.json()
      return result.did
    } catch (error) {
      logger.warn('DID service unavailable, generating temporary ID')
      return `did:brainsait:patient:temp-${Date.now()}`
    }
  }

  /**
   * Assign OID to patient
   */
  private async assignPatientOID(data: PatientRegistration): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/oid/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: '3.1', // Patient branch
          serviceName: `Patient: ${data.firstName} ${data.lastName}`,
          serviceType: 'patient',
          description: 'Patient identifier',
          metadata: {
            dateOfBirth: data.dateOfBirth,
            registeredAt: new Date().toISOString(),
          },
        }),
      })

      if (!response.ok) {
        logger.warn('OID assignment failed, generating temporary ID')
        return `1.3.6.1.4.1.61026.3.1.temp.${Date.now()}`
      }

      const result = await response.json()
      return result.oid
    } catch (error) {
      logger.warn('OID service unavailable, generating temporary ID')
      return `1.3.6.1.4.1.61026.3.1.temp.${Date.now()}`
    }
  }

  /**
   * Verify insurance eligibility
   */
  private async verifyInsurance(data: PatientRegistration): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/insurance/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: data.insuranceProvider,
          policyNumber: data.policyNumber,
          groupNumber: data.groupNumber,
          patientName: `${data.firstName} ${data.lastName}`,
          dateOfBirth: data.dateOfBirth,
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        logger.warn('Insurance verification failed')
        return false
      }

      const result = await response.json()
      return result.verified === true
    } catch (error) {
      logger.warn('Insurance service unavailable')
      return false
    }
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<PatientRecord | null> {
    try {
      const response = await fetch(`${this.baseUrl}/patients/${patientId}`)
      
      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to fetch patient', error as Error, { patientId })
      return null
    }
  }

  /**
   * Search patients
   */
  async searchPatients(query: string): Promise<PatientRecord[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/patients/search?q=${encodeURIComponent(query)}`
      )
      
      if (!response.ok) {
        return []
      }

      return await response.json()
    } catch (error) {
      logger.error('Failed to search patients', error as Error, { query })
      return []
    }
  }

  /**
   * Update patient record
   */
  async updatePatient(
    patientId: string,
    updates: Partial<PatientRecord>
  ): Promise<PatientRecord | null> {
    try {
      const response = await fetch(`${this.baseUrl}/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update patient')
      }

      analytics.feature('patient-update', 'completed', { patientId })
      return await response.json()
    } catch (error) {
      logger.error('Failed to update patient', error as Error, { patientId })
      throw error
    }
  }
}

export const patientService = new PatientService()
