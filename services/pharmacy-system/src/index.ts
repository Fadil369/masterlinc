/**
 * Pharmacy System
 * Inventory management and prescription dispensing
 */

import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 9000

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'masterlinc',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
})

app.use(cors())
app.use(express.json())

/**
 * Add medication to inventory
 */
app.post('/api/pharmacy/inventory/add', async (req, res) => {
  try {
    const {
      pharmacyId,
      medicationName,
      genericName,
      sfdaCode,
      quantity,
      unit,
      batchNumber,
      expiryDate,
      price
    } = req.body

    const result = await db.query(
      `INSERT INTO pharmacy_inventory (
        pharmacy_id, medication_name, generic_name, sfda_code,
        quantity, unit, batch_number, expiry_date, price, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *`,
      [pharmacyId, medicationName, genericName, sfdaCode, quantity, unit, batchNumber, expiryDate, price]
    )

    res.status(201).json({
      success: true,
      item: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error adding inventory:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Check medication availability
 */
app.get('/api/pharmacy/inventory/check', async (req, res) => {
  try {
    const { pharmacyId, medicationName, quantity } = req.query

    const result = await db.query(
      `SELECT * FROM pharmacy_inventory 
       WHERE pharmacy_id = $1 AND medication_name ILIKE $2 
       AND quantity >= $3 AND expiry_date > NOW()
       ORDER BY expiry_date ASC`,
      [pharmacyId, `%${medicationName}%`, quantity || 0]
    )

    res.json({
      available: result.rows.length > 0,
      items: result.rows
    })
  } catch (error: any) {
    console.error('Error checking inventory:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Dispense prescription
 */
app.post('/api/pharmacy/dispense', async (req, res) => {
  try {
    const {
      prescriptionId,
      pharmacyId,
      pharmacistId,
      medications
    } = req.body

    // Verify prescription with e-prescription service
    const prescriptionVerify = await axios.get(
      `http://localhost:6000/api/prescriptions/${prescriptionId}`
    )

    if (!prescriptionVerify.data) {
      return res.status(404).json({ error: 'Prescription not found' })
    }

    const prescription = prescriptionVerify.data

    if (prescription.status !== 'issued') {
      return res.status(400).json({ error: 'Prescription already dispensed or cancelled' })
    }

    // Check inventory for all medications
    for (const med of medications) {
      const inventoryCheck = await db.query(
        `SELECT * FROM pharmacy_inventory 
         WHERE pharmacy_id = $1 AND medication_name ILIKE $2 
         AND quantity >= $3
         ORDER BY expiry_date ASC
         LIMIT 1`,
        [pharmacyId, `%${med.medicationName}%`, med.quantity]
      )

      if (inventoryCheck.rows.length === 0) {
        return res.status(400).json({
          error: `Insufficient stock for ${med.medicationName}`
        })
      }
    }

    // Dispense medications
    for (const med of medications) {
      // Update inventory
      const inventoryItem = await db.query(
        `SELECT * FROM pharmacy_inventory 
         WHERE pharmacy_id = $1 AND medication_name ILIKE $2 
         ORDER BY expiry_date ASC LIMIT 1`,
        [pharmacyId, `%${med.medicationName}%`]
      )

      if (inventoryItem.rows.length > 0) {
        await db.query(
          `UPDATE pharmacy_inventory 
           SET quantity = quantity - $1, updated_at = NOW()
           WHERE id = $2`,
          [med.quantity, inventoryItem.rows[0].id]
        )

        // Log dispensing
        await db.query(
          `INSERT INTO pharmacy_dispensing_log (
            prescription_id, pharmacy_id, pharmacist_id,
            medication_name, quantity, batch_number, dispensed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            prescriptionId,
            pharmacyId,
            pharmacistId,
            med.medicationName,
            med.quantity,
            inventoryItem.rows[0].batch_number
          ]
        )
      }
    }

    // Mark prescription as dispensed
    await axios.post(
      `http://localhost:6000/api/prescriptions/${prescriptionId}/dispense`,
      {
        pharmacyId,
        pharmacistId,
        dispensedMedications: medications
      }
    )

    res.json({
      success: true,
      message: 'Prescription dispensed successfully',
      prescriptionId
    })
  } catch (error: any) {
    console.error('Error dispensing:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get pharmacy inventory
 */
app.get('/api/pharmacy/:pharmacyId/inventory', async (req, res) => {
  try {
    const { pharmacyId } = req.params
    const { lowStock } = req.query

    let query = `SELECT * FROM pharmacy_inventory WHERE pharmacy_id = $1`
    
    if (lowStock) {
      query += ` AND quantity < 10`
    }

    query += ` ORDER BY medication_name`

    const result = await db.query(query, [pharmacyId])

    res.json({
      pharmacyId,
      total: result.rows.length,
      inventory: result.rows
    })
  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'pharmacy-system' })
})

app.listen(port, () => {
  console.log(`Pharmacy System running on port ${port}`)
})

export default app
