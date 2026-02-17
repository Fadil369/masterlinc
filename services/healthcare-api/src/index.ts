import express from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

const OID_SERVICE_URL = process.env.OID_SERVICE_URL || 'http://localhost:3001';
const DID_SERVICE_URL = process.env.DID_SERVICE_URL || 'http://localhost:3002';

// ===============================================
// PATIENT REGISTRATION
// ===============================================
app.post('/api/patients/register', async (req, res) => {
  try {
    const {
      nationalId, fullName, fullNameAr, dob, gender,
      phone, email, emergencyContact, preferredLanguage = 'en',
      biometricId
    } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, error: 'Full name and phone are required' });
    }

    // Generate OID for patient
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '6.1',
      serviceName: `Patient: ${fullName}`,
      serviceType: 'patient',
      description: `Patient registration for ${fullName}`,
      metadata: { nationalId, phone }
    });

    const patientOid = oidResponse.data.oid;
    const patientId = crypto.randomUUID();

    // Create patient record
    const result = await pool.query(
      `INSERT INTO patients (patient_id, national_id, oid_identifier, full_name, full_name_ar, dob, gender, phone, email, emergency_contact, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [patientId, nationalId, patientOid, fullName, fullNameAr, dob, gender, phone, email, emergencyContact, preferredLanguage]
    );

    // Create audit entry
    await pool.query(
      `INSERT INTO audit_trail (event_type, entity_type, entity_id, oid_identifier, actor_type, actor_id, action, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['patient_registration', 'patient', patientId, patientOid, 'service', 'healthcare-api', 'create', JSON.stringify({ biometricId })]
    );

    res.status(201).json({
      success: true,
      patient: result.rows[0],
      oid: patientOid
    });
  } catch (error: any) {
    console.error('Error registering patient:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to register patient' });
  }
});

// Get patient by phone or ID
app.get('/api/patients/search', async (req, res) => {
  try {
    const { phone, nationalId, patientId } = req.query;

    let query = 'SELECT * FROM patients WHERE ';
    let params: any[] = [];

    if (phone) {
      query += 'phone = $1';
      params = [phone];
    } else if (nationalId) {
      query += 'national_id = $1';
      params = [nationalId];
    } else if (patientId) {
      query += 'patient_id = $1';
      params = [patientId];
    } else {
      return res.status(400).json({ success: false, error: 'phone, nationalId, or patientId required' });
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, patient: result.rows[0] });
  } catch (error: any) {
    console.error('Error searching patient:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// TRIAGE & EMERGENCY ASSESSMENT
// ===============================================
app.post('/api/triage/assess', async (req, res) => {
  try {
    const {
      patientId, chiefComplaint, symptoms, voiceTranscript,
      language = 'en', appointmentId
    } = req.body;

    if (!patientId || !chiefComplaint) {
      return res.status(400).json({ success: false, error: 'patientId and chiefComplaint required' });
    }

    // AI-based triage scoring (simulated)
    const emergencyKeywords = ['chest pain', 'shortness of breath', 'unconscious', 'severe bleeding', 'heart attack', 'stroke'];
    const highPriorityKeywords = ['severe pain', 'high fever', 'vomiting', 'dizzy'];
    
    const complaintLower = chiefComplaint.toLowerCase();
    let severity = 'low';
    let triageScore = 1;
    let emergencyFlag = false;

    if (emergencyKeywords.some(kw => complaintLower.includes(kw))) {
      severity = 'critical';
      triageScore = 5;
      emergencyFlag = true;
    } else if (highPriorityKeywords.some(kw => complaintLower.includes(kw))) {
      severity = 'high';
      triageScore = 4;
    } else if (symptoms && symptoms.length > 3) {
      severity = 'medium';
      triageScore = 3;
    }

    const aiRecommendations = {
      priority: severity,
      recommendedDepartment: emergencyFlag ? 'Emergency' : 'General Medicine',
      estimatedWaitTime: emergencyFlag ? 0 : triageScore * 15,
      alertProvider: emergencyFlag
    };

    // Generate OID for triage
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '6.3',
      serviceName: 'Triage Assessment',
      serviceType: 'triage',
      description: `Triage for patient ${patientId}`,
      metadata: { severity, emergencyFlag }
    });

    const triageOid = oidResponse.data.oid;

    const result = await pool.query(
      `INSERT INTO triage (patient_id, appointment_id, oid_identifier, chief_complaint, symptoms, severity, emergency_flag, triage_score, ai_recommendations, voice_transcript, language, triaged_by_service_oid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [patientId, appointmentId, triageOid, chiefComplaint, JSON.stringify(symptoms), severity, emergencyFlag, triageScore, JSON.stringify(aiRecommendations), voiceTranscript, language, triageOid]
    );

    // Audit
    await pool.query(
      `INSERT INTO audit_trail (event_type, entity_type, entity_id, oid_identifier, actor_type, actor_id, action, details, risk_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['triage_assessment', 'triage', result.rows[0].triage_id, triageOid, 'service', 'healthcare-api', 'create', JSON.stringify({ severity, emergencyFlag }), severity === 'critical' ? 'critical' : 'low']
    );

    res.status(201).json({
      success: true,
      triage: result.rows[0],
      oid: triageOid,
      recommendations: aiRecommendations
    });
  } catch (error: any) {
    console.error('Error assessing triage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// VITALS CAPTURE (Voice/BLE/Manual)
// ===============================================
app.post('/api/vitals/record', async (req, res) => {
  try {
    const {
      patientId, appointmentId, temperature, bloodPressureSystolic, bloodPressureDiastolic,
      heartRate, respiratoryRate, oxygenSaturation, weight, height,
      captureMethod = 'manual', deviceOid, voiceTranscript
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId required' });
    }

    // Calculate BMI if weight and height provided
    let bmi = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }

    // Generate OID for vitals
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '6.4',
      serviceName: 'Vitals Recording',
      serviceType: 'vitals',
      description: `Vitals for patient ${patientId}`,
      metadata: { captureMethod, deviceOid }
    });

    const vitalsOid = oidResponse.data.oid;

    const result = await pool.query(
      `INSERT INTO vitals (patient_id, appointment_id, oid_identifier, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, weight, height, bmi, capture_method, device_oid, voice_transcript, recorded_by_service_oid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [patientId, appointmentId, vitalsOid, temperature, bloodPressureSystolic, bloodPressureDiastolic, heartRate, respiratoryRate, oxygenSaturation, weight, height, bmi, captureMethod, deviceOid, voiceTranscript, vitalsOid]
    );

    res.status(201).json({
      success: true,
      vitals: result.rows[0],
      oid: vitalsOid
    });
  } catch (error: any) {
    console.error('Error recording vitals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// APPOINTMENTS
// ===============================================
app.post('/api/appointments/book', async (req, res) => {
  try {
    const {
      patientId, providerId, appointmentDate, appointmentType = 'consultation',
      triageLevel
    } = req.body;

    if (!patientId || !appointmentDate) {
      return res.status(400).json({ success: false, error: 'patientId and appointmentDate required' });
    }

    // Generate OID
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '6.2',
      serviceName: 'Appointment',
      serviceType: 'appointment',
      description: `Appointment for patient ${patientId}`,
      metadata: { providerId, appointmentType }
    });

    const appointmentOid = oidResponse.data.oid;
    const appointmentId = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO appointments (appointment_id, patient_id, provider_id, appointment_date, appointment_type, triage_level, status, created_by_service_oid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [appointmentId, patientId, providerId, appointmentDate, appointmentType, triageLevel, 'scheduled', appointmentOid]
    );

    res.status(201).json({
      success: true,
      appointment: result.rows[0],
      oid: appointmentOid
    });
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check-in for appointment
app.post('/api/appointments/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber } = req.body;

    const result = await pool.query(
      `UPDATE appointments SET status = 'checked_in', check_in_time = NOW(), room_number = $1
       WHERE appointment_id = $2
       RETURNING *`,
      [roomNumber, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({ success: true, appointment: result.rows[0] });
  } catch (error: any) {
    console.error('Error checking in:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// CLINICAL DOCUMENTATION
// ===============================================
app.post('/api/documentation/create', async (req, res) => {
  try {
    const {
      patientId, appointmentId, documentType, content, voiceTranscript,
      language = 'en', authorDid, templateId, structuredData
    } = req.body;

    if (!patientId || !documentType || !content) {
      return res.status(400).json({ success: false, error: 'patientId, documentType, and content required' });
    }

    // Generate OID
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '6.9',
      serviceName: 'Clinical Documentation',
      serviceType: 'documentation',
      description: `${documentType} for patient ${patientId}`,
      metadata: { documentType, authorDid }
    });

    const docOid = oidResponse.data.oid;

    const result = await pool.query(
      `INSERT INTO clinical_documentation (patient_id, appointment_id, oid_identifier, document_type, content, voice_transcript, language, structured_data, template_id, author_did, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [patientId, appointmentId, docOid, documentType, content, voiceTranscript, language, JSON.stringify(structuredData), templateId, authorDid, 'draft']
    );

    res.status(201).json({
      success: true,
      document: result.rows[0],
      oid: docOid
    });
  } catch (error: any) {
    console.error('Error creating documentation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sign document with DID
app.post('/api/documentation/:id/sign', async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorDid } = req.body;

    if (!doctorDid) {
      return res.status(400).json({ success: false, error: 'doctorDid required' });
    }

    // Get document
    const docResult = await pool.query(
      'SELECT * FROM clinical_documentation WHERE document_id = $1',
      [id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const doc = docResult.rows[0];
    const documentHash = crypto.createHash('sha256').update(doc.content).digest('hex');

    // Create digital signature via DID service
    const signResponse = await axios.post(`${DID_SERVICE_URL}/api/did/sign`, {
      did: doctorDid,
      documentHash,
      documentType: doc.document_type
    });

    const signature = signResponse.data.signature;

    // Update document
    const result = await pool.query(
      `UPDATE clinical_documentation SET digital_signature = $1, status = 'signed', author_did = $2
       WHERE document_id = $3
       RETURNING *`,
      [JSON.stringify(signature), doctorDid, id]
    );

    res.json({
      success: true,
      document: result.rows[0],
      signature
    });
  } catch (error: any) {
    console.error('Error signing document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// HEALTH CHECK
// ===============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BrainSAIT Healthcare API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3003;

async function start() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Healthcare API Service running on port ${PORT}`);
      console.log(`📍 Patient workflows, triage, vitals, documentation enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
