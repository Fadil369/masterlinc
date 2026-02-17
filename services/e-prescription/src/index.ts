/**
 * E-Prescription Service
 * SFDA (Saudi Food and Drug Authority) compliant e-prescription system
 */

import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import axios from 'axios'
import QRCode from 'qrcode'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 6000

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'masterlinc',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
})

app.use(cors())
app.use(express.json())

// SFDA API configuration (mock for now - replace with real SFDA endpoints)
const SFDA_API_URL = process.env.SFDA_API_URL || 'https://sfda-api.example.sa'
const SFDA_API_KEY = process.env.SFDA_API_KEY

/**
 * Prescription status enum
 */
enum PrescriptionStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  DISPENSED = 'dispensed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

/**
 * Prescription interface
 */
interface Prescription {
  id?: string
  prescriptionNumber?: string
  patientId: string
  patientName: string
  patientOID: string
  doctorId: string
  doctorName: string
  doctorLicenseNumber: string
  facilityId: string
  facilityName: string
  medications: Medication[]
  diagnosis: string
  diagnosisCode?: string
  notes?: string
  status: PrescriptionStatus
  issueDate?: Date
  expiryDate?: Date
  qrCode?: string
  digitalSignature?: string
  sfdaReferenceNumber?: string
}

interface Medication {
  medicationName: string
  genericName?: string
  scientificName?: string
  sfdaCode?: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  instructions?: string
  refills?: number
}

/**
 * Generate unique prescription number
 */
function generatePrescriptionNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `RX-${timestamp}-${random}`
}

/**
 * Generate digital signature for prescription
 */
function generateDigitalSignature(prescription: Prescription): string {
  const data = JSON.stringify({
    prescriptionNumber: prescription.prescriptionNumber,
    patientOID: prescription.patientOID,
    doctorLicenseNumber: prescription.doctorLicenseNumber,
    issueDate: prescription.issueDate
  })
  
  const secret = process.env.PRESCRIPTION_SECRET || 'default-secret-key'
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

/**
 * Create prescription
 */
app.post('/api/prescriptions/create', async (req, res) => {
  try {
    const prescription: Prescription = req.body

    // Validate required fields
    if (!prescription.patientId || !prescription.doctorId || !prescription.medications?.length) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Generate prescription number
    const prescriptionNumber = generatePrescriptionNumber()
    const issueDate = new Date()
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 6) // 6 months validity

    prescription.prescriptionNumber = prescriptionNumber
    prescription.issueDate = issueDate
    prescription.expiryDate = expiryDate
    prescription.status = PrescriptionStatus.ISSUED

    // Generate digital signature
    prescription.digitalSignature = generateDigitalSignature(prescription)

    // Generate QR code
    const qrData = {
      rxNumber: prescriptionNumber,
      patientOID: prescription.patientOID,
      doctorLicense: prescription.doctorLicenseNumber,
      issueDate: issueDate.toISOString(),
      signature: prescription.digitalSignature
    }
    prescription.qrCode = await QRCode.toDataURL(JSON.stringify(qrData))

    // Submit to SFDA (mock implementation)
    try {
      const sfdaResponse = await axios.post(`${SFDA_API_URL}/prescriptions/register`, {
        prescriptionNumber,
        patientOID: prescription.patientOID,
        doctorLicenseNumber: prescription.doctorLicenseNumber,
        medications: prescription.medications,
        issueDate
      }, {
        headers: {
          'Authorization': `Bearer ${SFDA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      prescription.sfdaReferenceNumber = sfdaResponse.data.referenceNumber
    } catch (error) {
      console.warn('SFDA submission failed, continuing with local storage:', error)
      prescription.sfdaReferenceNumber = `MOCK-${prescriptionNumber}`
    }

    // Store in database
    const result = await db.query(
      `INSERT INTO prescriptions (
        prescription_number, patient_id, patient_name, patient_oid,
        doctor_id, doctor_name, doctor_license_number,
        facility_id, facility_name, medications, diagnosis, diagnosis_code,
        notes, status, issue_date, expiry_date, qr_code, digital_signature,
        sfda_reference_number, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
      RETURNING id`,
      [
        prescription.prescriptionNumber,
        prescription.patientId,
        prescription.patientName,
        prescription.patientOID,
        prescription.doctorId,
        prescription.doctorName,
        prescription.doctorLicenseNumber,
        prescription.facilityId,
        prescription.facilityName,
        JSON.stringify(prescription.medications),
        prescription.diagnosis,
        prescription.diagnosisCode,
        prescription.notes,
        prescription.status,
        prescription.issueDate,
        prescription.expiryDate,
        prescription.qrCode,
        prescription.digitalSignature,
        prescription.sfdaReferenceNumber
      ]
    )

    prescription.id = result.rows[0].id

    // Log to audit
    await axios.post('http://localhost:5000/api/audit/log', {
      eventType: 'PRESCRIPTION_CREATED',
      userId: prescription.doctorId,
      userRole: 'physician',
      resourceType: 'Prescription',
      resourceId: prescription.id,
      action: 'Create prescription',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { prescriptionNumber },
      success: true
    }).catch(err => console.warn('Audit logging failed:', err))

    res.status(201).json({
      success: true,
      prescription: {
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        qrCode: prescription.qrCode,
        status: prescription.status,
        issueDate: prescription.issueDate,
        expiryDate: prescription.expiryDate,
        sfdaReferenceNumber: prescription.sfdaReferenceNumber
      }
    })
  } catch (error: any) {
    console.error('Error creating prescription:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get prescription by ID or number
 */
app.get('/api/prescriptions/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params

    const result = await db.query(
      `SELECT * FROM prescriptions 
       WHERE id = $1 OR prescription_number = $1`,
      [identifier]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' })
    }

    const prescription = result.rows[0]
    prescription.medications = JSON.parse(prescription.medications)

    res.json(prescription)
  } catch (error: any) {
    console.error('Error fetching prescription:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Verify prescription (for pharmacy)
 */
app.post('/api/prescriptions/verify', async (req, res) => {
  try {
    const { prescriptionNumber, digitalSignature } = req.body

    const result = await db.query(
      `SELECT * FROM prescriptions WHERE prescription_number = $1`,
      [prescriptionNumber]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Prescription not found' 
      })
    }

    const prescription = result.rows[0]

    // Verify signature
    const isValid = prescription.digital_signature === digitalSignature

    // Check expiry
    const isExpired = new Date() > new Date(prescription.expiry_date)

    // Check status
    const canDispense = prescription.status === PrescriptionStatus.ISSUED

    res.json({
      valid: isValid && !isExpired && canDispense,
      prescriptionNumber,
      status: prescription.status,
      isExpired,
      patientName: prescription.patient_name,
      doctorName: prescription.doctor_name,
      medications: JSON.parse(prescription.medications)
    })
  } catch (error: any) {
    console.error('Error verifying prescription:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Dispense prescription (pharmacy marks as dispensed)
 */
app.post('/api/prescriptions/:id/dispense', async (req, res) => {
  try {
    const { id } = req.params
    const { pharmacyId, pharmacistId, dispensedMedications } = req.body

    const result = await db.query(
      `UPDATE prescriptions 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND status = $3
       RETURNING *`,
      [PrescriptionStatus.DISPENSED, id, PrescriptionStatus.ISSUED]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Prescription cannot be dispensed (already dispensed or cancelled)' 
      })
    }

    // Record dispensing
    await db.query(
      `INSERT INTO prescription_dispensing (
        prescription_id, pharmacy_id, pharmacist_id, 
        dispensed_medications, dispensed_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [id, pharmacyId, pharmacistId, JSON.stringify(dispensedMedications)]
    )

    res.json({
      success: true,
      message: 'Prescription dispensed successfully',
      prescription: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error dispensing prescription:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Cancel prescription
 */
app.post('/api/prescriptions/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params
    const { reason, doctorId } = req.body

    const result = await db.query(
      `UPDATE prescriptions 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND doctor_id = $3 AND status = $4
       RETURNING *`,
      [PrescriptionStatus.CANCELLED, id, doctorId, PrescriptionStatus.ISSUED]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Prescription cannot be cancelled' 
      })
    }

    // Log cancellation
    await db.query(
      `INSERT INTO prescription_cancellations (
        prescription_id, doctor_id, reason, cancelled_at
      ) VALUES ($1, $2, $3, NOW())`,
      [id, doctorId, reason]
    )

    res.json({
      success: true,
      message: 'Prescription cancelled successfully'
    })
  } catch (error: any) {
    console.error('Error cancelling prescription:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get patient prescription history
 */
app.get('/api/prescriptions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const { status, limit = 50 } = req.query

    let query = `SELECT * FROM prescriptions WHERE patient_id = $1`
    const params: any[] = [patientId]

    if (status) {
      query += ` AND status = $2`
      params.push(status)
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await db.query(query, params)

    const prescriptions = result.rows.map(p => ({
      ...p,
      medications: JSON.parse(p.medications)
    }))

    res.json({
      patientId,
      total: prescriptions.length,
      prescriptions
    })
  } catch (error: any) {
    console.error('Error fetching patient prescriptions:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'e-prescription' })
})

app.listen(port, () => {
  console.log(`E-Prescription Service running on port ${port}`)
})

export default app
