/**
 * HIPAA-Compliant Audit Logging Service
 * Tracks all access to PHI and system events
 */

import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import winston from 'winston'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

// Winston logger for file-based audit trail
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'audit-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'audit-combined.log' })
  ]
})

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'masterlinc',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
})

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
})

app.use(cors())
app.use(express.json())
app.use(limiter)

/**
 * Audit Event Types
 */
export enum AuditEventType {
  PHI_ACCESS = 'PHI_ACCESS',
  PHI_MODIFICATION = 'PHI_MODIFICATION',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  DATA_EXPORT = 'DATA_EXPORT',
  PRESCRIPTION_CREATED = 'PRESCRIPTION_CREATED',
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED'
}

export interface AuditEvent {
  eventType: AuditEventType
  userId: string
  userRole: string
  resourceType?: string
  resourceId?: string
  action: string
  ipAddress: string
  userAgent: string
  timestamp?: Date
  details?: Record<string, any>
  success: boolean
}

/**
 * Log audit event
 */
app.post('/api/audit/log', async (req, res) => {
  try {
    const event: AuditEvent = req.body

    // Validate required fields
    if (!event.eventType || !event.userId || !event.action) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Add timestamp
    event.timestamp = new Date()

    // Log to Winston
    auditLogger.info('Audit Event', event)

    // Store in database
    await db.query(
      `INSERT INTO audit_logs (
        event_type, user_id, user_role, resource_type, resource_id,
        action, ip_address, user_agent, details, success, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        event.eventType,
        event.userId,
        event.userRole,
        event.resourceType,
        event.resourceId,
        event.action,
        event.ipAddress,
        event.userAgent,
        JSON.stringify(event.details || {}),
        event.success
      ]
    )

    res.json({ success: true, eventId: event.timestamp.getTime() })
  } catch (error: any) {
    console.error('Error logging audit event:', error)
    auditLogger.error('Failed to log audit event', { error: error.message })
    res.status(500).json({ error: error.message })
  }
})

/**
 * Query audit logs
 */
app.get('/api/audit/search', async (req, res) => {
  try {
    const {
      userId,
      eventType,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit = 100
    } = req.query

    let query = 'SELECT * FROM audit_logs WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (userId) {
      query += ` AND user_id = $${paramCount}`
      params.push(userId)
      paramCount++
    }

    if (eventType) {
      query += ` AND event_type = $${paramCount}`
      params.push(eventType)
      paramCount++
    }

    if (resourceType) {
      query += ` AND resource_type = $${paramCount}`
      params.push(resourceType)
      paramCount++
    }

    if (resourceId) {
      query += ` AND resource_id = $${paramCount}`
      params.push(resourceId)
      paramCount++
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount}`
      params.push(startDate)
      paramCount++
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount}`
      params.push(endDate)
      paramCount++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`
    params.push(limit)

    const result = await db.query(query, params)

    res.json({
      total: result.rows.length,
      logs: result.rows
    })
  } catch (error: any) {
    console.error('Error searching audit logs:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get audit report
 */
app.get('/api/audit/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const report = await db.query(
      `SELECT 
        event_type,
        COUNT(*) as count,
        COUNT(CASE WHEN success = true THEN 1 END) as successful,
        COUNT(CASE WHEN success = false THEN 1 END) as failed
       FROM audit_logs
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY event_type
       ORDER BY count DESC`,
      [startDate, endDate]
    )

    const userActivity = await db.query(
      `SELECT 
        user_id,
        user_role,
        COUNT(*) as activity_count,
        MAX(created_at) as last_activity
       FROM audit_logs
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY user_id, user_role
       ORDER BY activity_count DESC
       LIMIT 20`,
      [startDate, endDate]
    )

    res.json({
      period: { startDate, endDate },
      eventSummary: report.rows,
      topUsers: userActivity.rows
    })
  } catch (error: any) {
    console.error('Error generating audit report:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'audit-logger' })
})

app.listen(port, () => {
  console.log(`Audit Logger running on port ${port}`)
})

export default app
