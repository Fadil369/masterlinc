/**
 * Lab Interface Service
 * HL7 integration for lab orders and results
 */

import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import axios from 'axios'
import { PDFDocument, rgb } from 'pdf-lib'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 8000

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'masterlinc',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
})

app.use(cors())
app.use(express.json())

enum OrderStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

enum ResultStatus {
  PENDING = 'pending',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
  CORRECTED = 'corrected'
}

interface LabTest {
  code: string
  name: string
  loincCode?: string
  category?: string
}

interface LabOrder {
  id?: string
  orderNumber?: string
  patientId: string
  patientName: string
  patientOID?: string
  doctorId: string
  doctorName: string
  labFacilityId: string
  tests: LabTest[]
  priority: 'routine' | 'urgent' | 'stat'
  status: OrderStatus
  orderedAt?: Date
  collectedAt?: Date
  completedAt?: Date
  hl7Message?: string
}

/**
 * Generate HL7 ORM message (Order)
 */
function generateHL7OrderMessage(order: LabOrder): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14)
  
  const segments = [
    `MSH|^~\\&|MasterLinc|BrainSAIT|LIS|${order.labFacilityId}|${timestamp}||ORM^O01|${order.orderNumber}|P|2.5`,
    `PID|1||${order.patientOID}||${order.patientName}`,
    `ORC|NW|${order.orderNumber}||${order.orderNumber}|${order.status}|||${order.priority}`,
    ...order.tests.map((test, idx) => 
      `OBR|${idx + 1}|${order.orderNumber}|${order.orderNumber}-${idx + 1}|${test.code}^${test.name}|||${timestamp}`
    )
  ]
  
  return segments.join('\r')
}

/**
 * Parse HL7 ORU message (Results)
 */
function parseHL7ResultMessage(hl7: string): any {
  const segments = hl7.split('\r')
  const results: any[] = []
  
  segments.forEach(segment => {
    if (segment.startsWith('OBX')) {
      const fields = segment.split('|')
      results.push({
        testCode: fields[3]?.split('^')[0],
        testName: fields[3]?.split('^')[1],
        resultValue: fields[5],
        unit: fields[6],
        referenceRange: fields[7],
        abnormalFlag: fields[8],
        status: fields[11]
      })
    }
  })
  
  return results
}

/**
 * Create lab order
 */
app.post('/api/lab/orders/create', async (req, res) => {
  try {
    const order: LabOrder = req.body

    if (!order.patientId || !order.doctorId || !order.tests?.length) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const orderNumber = `LAB-${Date.now()}`
    const orderedAt = new Date()

    order.orderNumber = orderNumber
    order.orderedAt = orderedAt
    order.status = OrderStatus.PENDING

    // Generate HL7 message
    order.hl7Message = generateHL7OrderMessage(order)

    // Store in database
    const result = await db.query(
      `INSERT INTO lab_orders (
        order_number, patient_id, patient_name, doctor_id, doctor_name,
        lab_facility_id, tests, priority, status, ordered_at, hl7_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id`,
      [
        orderNumber,
        order.patientId,
        order.patientName,
        order.doctorId,
        order.doctorName,
        order.labFacilityId,
        JSON.stringify(order.tests),
        order.priority,
        order.status,
        orderedAt,
        order.hl7Message
      ]
    )

    order.id = result.rows[0].id

    // Send to lab facility via HL7 (mock)
    try {
      await axios.post(`http://${order.labFacilityId}/hl7/orders`, {
        message: order.hl7Message
      })
    } catch (error) {
      console.warn('Failed to send HL7 to lab, continuing:', error)
    }

    // Audit log
    await axios.post('http://localhost:5000/api/audit/log', {
      eventType: 'LAB_ORDER_CREATED',
      userId: order.doctorId,
      userRole: 'physician',
      resourceType: 'LabOrder',
      resourceId: order.id,
      action: 'Create lab order',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { orderNumber, testsCount: order.tests.length },
      success: true
    }).catch(err => console.warn('Audit failed:', err))

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        tests: order.tests
      }
    })
  } catch (error: any) {
    console.error('Error creating lab order:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Receive lab results (HL7 ORU)
 */
app.post('/api/lab/results/receive', async (req, res) => {
  try {
    const { hl7Message, orderNumber } = req.body

    // Parse HL7
    const parsedResults = parseHL7ResultMessage(hl7Message)

    // Get order
    const orderResult = await db.query(
      `SELECT id FROM lab_orders WHERE order_number = $1`,
      [orderNumber]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const orderId = orderResult.rows[0].id

    // Store results
    for (const result of parsedResults) {
      await db.query(
        `INSERT INTO lab_results (
          order_id, test_code, test_name, result_value, unit,
          reference_range, abnormal_flag, status, performed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          orderId,
          result.testCode,
          result.testName,
          result.resultValue,
          result.unit,
          result.referenceRange,
          result.abnormalFlag,
          result.status || ResultStatus.FINAL
        ]
      )
    }

    // Update order status
    await db.query(
      `UPDATE lab_orders 
       SET status = $1, completed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [OrderStatus.COMPLETED, orderId]
    )

    res.json({
      success: true,
      orderNumber,
      resultsCount: parsedResults.length
    })
  } catch (error: any) {
    console.error('Error receiving results:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get lab order with results
 */
app.get('/api/lab/orders/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params

    const orderResult = await db.query(
      `SELECT * FROM lab_orders WHERE id = $1 OR order_number = $1`,
      [identifier]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const order = orderResult.rows[0]
    order.tests = JSON.parse(order.tests)

    // Get results
    const resultsQuery = await db.query(
      `SELECT * FROM lab_results WHERE order_id = $1 ORDER BY created_at`,
      [order.id]
    )

    order.results = resultsQuery.rows

    res.json(order)
  } catch (error: any) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Generate PDF report
 */
app.get('/api/lab/orders/:id/report/pdf', async (req, res) => {
  try {
    const { id } = req.params

    const orderResult = await db.query(
      `SELECT * FROM lab_orders WHERE id = $1`,
      [id]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const order = orderResult.rows[0]

    const resultsQuery = await db.query(
      `SELECT * FROM lab_results WHERE order_id = $1`,
      [order.id]
    )

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { height } = page.getSize()

    page.drawText('Lab Results Report', {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0)
    })

    page.drawText(`Order #: ${order.order_number}`, { x: 50, y: height - 80, size: 12 })
    page.drawText(`Patient: ${order.patient_name}`, { x: 50, y: height - 100, size: 12 })
    page.drawText(`Doctor: ${order.doctor_name}`, { x: 50, y: height - 120, size: 12 })

    let yPos = height - 160
    resultsQuery.rows.forEach((result, idx) => {
      page.drawText(`${idx + 1}. ${result.test_name}`, { x: 50, y: yPos, size: 11 })
      page.drawText(`Result: ${result.result_value} ${result.unit || ''}`, { x: 70, y: yPos - 15, size: 10 })
      page.drawText(`Reference: ${result.reference_range || 'N/A'}`, { x: 70, y: yPos - 30, size: 10 })
      yPos -= 50
    })

    const pdfBytes = await pdfDoc.save()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="lab-report-${order.order_number}.pdf"`)
    res.send(Buffer.from(pdfBytes))
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get patient lab history
 */
app.get('/api/lab/orders/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const { limit = 50 } = req.query

    const result = await db.query(
      `SELECT * FROM lab_orders 
       WHERE patient_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [patientId, limit]
    )

    const orders = result.rows.map(o => ({
      ...o,
      tests: JSON.parse(o.tests)
    }))

    res.json({
      patientId,
      total: orders.length,
      orders
    })
  } catch (error: any) {
    console.error('Error fetching patient orders:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'lab-interface' })
})

app.listen(port, () => {
  console.log(`Lab Interface running on port ${port}`)
})

export default app
