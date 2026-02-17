/**
 * Telehealth Service
 * WebRTC video consultation with Twilio
 */

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { Pool } from 'pg'
import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const port = process.env.PORT || 7000

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

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

/**
 * Session status enum
 */
enum SessionStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

/**
 * Create telehealth session
 */
app.post('/api/telehealth/sessions/create', async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      scheduledTime,
      duration = 30
    } = req.body

    // Generate unique room name
    const roomName = `telehealth-${Date.now()}`

    // Create Twilio room (for video)
    let twilioRoomSid
    try {
      const room = await twilioClient.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group',
        maxParticipants: 2,
        recordParticipantsOnConnect: true
      })
      twilioRoomSid = room.sid
    } catch (error) {
      console.warn('Twilio room creation failed, using mock:', error)
      twilioRoomSid = `MOCK-${roomName}`
    }

    // Store session in database
    const result = await db.query(
      `INSERT INTO telehealth_sessions (
        appointment_id, patient_id, patient_name, doctor_id, doctor_name,
        room_name, twilio_room_sid, scheduled_time, duration, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *`,
      [
        appointmentId,
        patientId,
        patientName,
        doctorId,
        doctorName,
        roomName,
        twilioRoomSid,
        scheduledTime,
        duration,
        SessionStatus.SCHEDULED
      ]
    )

    const session = result.rows[0]

    res.status(201).json({
      success: true,
      session: {
        id: session.id,
        roomName: session.room_name,
        scheduledTime: session.scheduled_time,
        duration: session.duration,
        status: session.status
      }
    })
  } catch (error: any) {
    console.error('Error creating telehealth session:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Generate access token for participant
 */
app.post('/api/telehealth/token', async (req, res) => {
  try {
    const { sessionId, participantId, participantName, role } = req.body

    // Get session details
    const sessionResult = await db.query(
      `SELECT * FROM telehealth_sessions WHERE id = $1`,
      [sessionId]
    )

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const session = sessionResult.rows[0]

    // Verify participant is authorized
    const isAuthorized = 
      (role === 'patient' && session.patient_id === participantId) ||
      (role === 'doctor' && session.doctor_id === participantId)

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Generate Twilio access token
    const AccessToken = twilio.jwt.AccessToken
    const VideoGrant = AccessToken.VideoGrant

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY_SID!,
      process.env.TWILIO_API_KEY_SECRET!,
      { identity: participantName }
    )

    const videoGrant = new VideoGrant({
      room: session.room_name
    })

    token.addGrant(videoGrant)

    res.json({
      token: token.toJwt(),
      roomName: session.room_name,
      identity: participantName
    })
  } catch (error: any) {
    console.error('Error generating token:', error)
    // Fallback for mock
    res.json({
      token: `MOCK_TOKEN_${Date.now()}`,
      roomName: 'mock-room',
      identity: req.body.participantName
    })
  }
})

/**
 * Start session
 */
app.post('/api/telehealth/sessions/:id/start', async (req, res) => {
  try {
    const { id } = req.params
    const { participantId, role } = req.body

    const result = await db.query(
      `UPDATE telehealth_sessions 
       SET status = $1, started_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = $3
       RETURNING *`,
      [SessionStatus.IN_PROGRESS, id, SessionStatus.WAITING]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Session cannot be started' })
    }

    // Emit socket event to notify participants
    io.to(`session-${id}`).emit('session-started', {
      sessionId: id,
      startedAt: result.rows[0].started_at
    })

    res.json({
      success: true,
      session: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error starting session:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * End session
 */
app.post('/api/telehealth/sessions/:id/end', async (req, res) => {
  try {
    const { id } = req.params
    const { notes, diagnosis, prescriptionId } = req.body

    const result = await db.query(
      `UPDATE telehealth_sessions 
       SET status = $1, ended_at = NOW(), notes = $2, 
           diagnosis = $3, prescription_id = $4, updated_at = NOW()
       WHERE id = $5 AND status = $6
       RETURNING *`,
      [SessionStatus.COMPLETED, notes, diagnosis, prescriptionId, id, SessionStatus.IN_PROGRESS]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Session cannot be ended' })
    }

    const session = result.rows[0]

    // Complete Twilio room
    if (session.twilio_room_sid && !session.twilio_room_sid.startsWith('MOCK')) {
      try {
        await twilioClient.video.v1.rooms(session.twilio_room_sid).update({
          status: 'completed'
        })
      } catch (error) {
        console.warn('Failed to close Twilio room:', error)
      }
    }

    // Emit socket event
    io.to(`session-${id}`).emit('session-ended', {
      sessionId: id,
      endedAt: session.ended_at
    })

    res.json({
      success: true,
      session
    })
  } catch (error: any) {
    console.error('Error ending session:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get session details
 */
app.get('/api/telehealth/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await db.query(
      `SELECT * FROM telehealth_sessions WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }

    res.json(result.rows[0])
  } catch (error: any) {
    console.error('Error fetching session:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get patient session history
 */
app.get('/api/telehealth/sessions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params

    const result = await db.query(
      `SELECT * FROM telehealth_sessions 
       WHERE patient_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [patientId]
    )

    res.json({
      patientId,
      total: result.rows.length,
      sessions: result.rows
    })
  } catch (error: any) {
    console.error('Error fetching patient sessions:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Socket.IO connection handling
 */
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Join session room
  socket.on('join-session', ({ sessionId, participantName, role }) => {
    socket.join(`session-${sessionId}`)
    
    // Update session status to waiting if not started
    db.query(
      `UPDATE telehealth_sessions 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND status = $3`,
      [SessionStatus.WAITING, sessionId, SessionStatus.SCHEDULED]
    )

    // Notify other participants
    socket.to(`session-${sessionId}`).emit('participant-joined', {
      participantName,
      role
    })
  })

  // Handle chat messages
  socket.on('chat-message', ({ sessionId, message, sender }) => {
    socket.to(`session-${sessionId}`).emit('chat-message', {
      message,
      sender,
      timestamp: new Date()
    })

    // Store message
    db.query(
      `INSERT INTO telehealth_chat (session_id, sender, message, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [sessionId, sender, message]
    )
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'telehealth' })
})

httpServer.listen(port, () => {
  console.log(`Telehealth Service running on port ${port}`)
})

export default app
