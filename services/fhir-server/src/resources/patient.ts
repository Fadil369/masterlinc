/**
 * FHIR Patient Resource Handler
 * Implements FHIR R4 Patient resource operations
 */

import { Request, Response } from 'express'
import { Pool } from 'pg'
import { logger } from '../utils/logger'
import { validateFHIR } from '../utils/validator'

export interface FHIRPatient {
  resourceType: 'Patient'
  id?: string
  identifier?: Array<{
    system: string
    value: string
    type?: {
      coding: Array<{
        system: string
        code: string
        display: string
      }>
    }
  }>
  active?: boolean
  name?: Array<{
    use?: string
    family?: string
    given?: string[]
  }>
  telecom?: Array<{
    system: string
    value: string
    use?: string
  }>
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  address?: Array<{
    use?: string
    line?: string[]
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }>
  managingOrganization?: {
    reference: string
  }
}

export class PatientResourceHandler {
  constructor(private db: Pool) {}

  /**
   * Create a new patient
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const patient: FHIRPatient = req.body

      // Validate FHIR resource
      const validation = validateFHIR(patient, 'Patient')
      if (!validation.valid) {
        res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: validation.errors?.join(', ')
          }]
        })
        return
      }

      // Generate ID if not provided
      const patientId = patient.id || `patient-${Date.now()}`
      patient.id = patientId

      // Store in database
      await this.db.query(
        `INSERT INTO fhir_patients (id, resource, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET resource = $2, updated_at = NOW()`,
        [patientId, JSON.stringify(patient)]
      )

      logger.info('Patient created', { patientId })

      res.status(201).json(patient)
    } catch (error) {
      logger.error('Error creating patient', error as Error)
      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Internal server error'
        }]
      })
    }
  }

  /**
   * Read a patient by ID
   */
  async read(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const result = await this.db.query(
        'SELECT resource FROM fhir_patients WHERE id = $1',
        [id]
      )

      if (result.rows.length === 0) {
        res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Patient/${id} not found`
          }]
        })
        return
      }

      res.json(result.rows[0].resource)
    } catch (error) {
      logger.error('Error reading patient', error as Error, { id: req.params.id })
      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Internal server error'
        }]
      })
    }
  }

  /**
   * Update a patient
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const patient: FHIRPatient = req.body

      // Validate FHIR resource
      const validation = validateFHIR(patient, 'Patient')
      if (!validation.valid) {
        res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: validation.errors?.join(', ')
          }]
        })
        return
      }

      patient.id = id

      const result = await this.db.query(
        `UPDATE fhir_patients SET resource = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING resource`,
        [id, JSON.stringify(patient)]
      )

      if (result.rows.length === 0) {
        res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Patient/${id} not found`
          }]
        })
        return
      }

      logger.info('Patient updated', { patientId: id })

      res.json(patient)
    } catch (error) {
      logger.error('Error updating patient', error as Error, { id: req.params.id })
      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Internal server error'
        }]
      })
    }
  }

  /**
   * Delete a patient
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const result = await this.db.query(
        'DELETE FROM fhir_patients WHERE id = $1 RETURNING id',
        [id]
      )

      if (result.rows.length === 0) {
        res.status(404).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: `Patient/${id} not found`
          }]
        })
        return
      }

      logger.info('Patient deleted', { patientId: id })

      res.status(204).send()
    } catch (error) {
      logger.error('Error deleting patient', error as Error, { id: req.params.id })
      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Internal server error'
        }]
      })
    }
  }

  /**
   * Search patients
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, name, birthdate, gender } = req.query
      
      let query = 'SELECT resource FROM fhir_patients WHERE 1=1'
      const params: any[] = []
      let paramCount = 1

      if (identifier) {
        query += ` AND resource->>'identifier' ILIKE $${paramCount}`
        params.push(`%${identifier}%`)
        paramCount++
      }

      if (name) {
        query += ` AND resource->>'name' ILIKE $${paramCount}`
        params.push(`%${name}%`)
        paramCount++
      }

      if (birthdate) {
        query += ` AND resource->>'birthDate' = $${paramCount}`
        params.push(birthdate)
        paramCount++
      }

      if (gender) {
        query += ` AND resource->>'gender' = $${paramCount}`
        params.push(gender)
        paramCount++
      }

      query += ' LIMIT 100'

      const result = await this.db.query(query, params)

      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: result.rows.length,
        entry: result.rows.map(row => ({
          resource: row.resource
        }))
      }

      res.json(bundle)
    } catch (error) {
      logger.error('Error searching patients', error as Error, { query: req.query })
      res.status(500).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          diagnostics: 'Internal server error'
        }]
      })
    }
  }
}
