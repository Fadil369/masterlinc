/**
 * BSMA PATIENT VOICE WORKFLOW API ROUTES
 * Voice-based patient journey (EN/AR)
 * Registration, Booking, Triage, Check-in, Vitals, History, Emergency Flags
 */

import { Router, Request, Response } from 'express';
import type {
  Patient,
  Appointment,
  TriageRecord,
  Vitals,
  ExamFinding,
  EmergencyFlag,
  FollowUp,
  CreatePatientRequest,
  CreateAppointmentRequest,
  VoiceTriageRequest,
} from '../../../shared/healthcare-types';

const router = Router();

// =============================================
// PATIENT REGISTRATION (VOICE)
// =============================================

/**
 * POST /api/bsma/patients/register
 * Register patient via voice (EN/AR)
 */
router.post('/bsma/patients/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      name_ar,
      date_of_birth,
      gender,
      phone,
      email,
      language_preference = 'ar',
      national_id,
      voice_recording_url,
    } = req.body as CreatePatientRequest & { voice_recording_url?: string };

    // Validate required fields
    if (!name || !date_of_birth || !gender || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, date_of_birth, gender, phone',
      });
    }

    // Check if patient already exists by phone or national_id
    // TODO: Query database
    // const existing = await db.patients.findByPhone(phone);
    // if (existing) return existing patient

    const patient_id = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const oid = `1.3.6.1.4.1.61026.healthcare.patients.${patient_id}`;

    const newPatient: Partial<Patient> = {
      id: patient_id,
      oid,
      name,
      name_ar,
      date_of_birth: new Date(date_of_birth),
      gender,
      phone,
      email,
      country: 'SA',
      nationality: 'SA',
      language_preference,
      national_id,
      consent_for_voice: 'granted', // Implied by voice registration
      consent_for_data_sharing: 'pending',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // TODO: Save to database
    // await db.patients.insert(newPatient);

    // TODO: Log audit trail
    // await logAudit({
    //   action_type: 'create',
    //   resource_type: 'patient',
    //   resource_oid: oid,
    //   creation_method: 'voice',
    // });

    res.status(201).json({
      success: true,
      data: newPatient,
      message: language_preference === 'ar' 
        ? 'تم تسجيل المريض بنجاح'
        : 'Patient registered successfully',
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register patient',
    });
  }
});

/**
 * GET /api/bsma/patients/phone/:phone
 * Get patient by phone number (for voice lookup)
 */
router.get('/bsma/patients/phone/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const { language = 'ar' } = req.query;

    // TODO: Fetch from database
    const patient: Patient | null = null;

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: language === 'ar' ? 'المريض غير موجود' : 'Patient not found',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient',
    });
  }
});

// =============================================
// APPOINTMENT BOOKING (VOICE)
// =============================================

/**
 * POST /api/bsma/appointments/book
 * Book appointment via voice
 */
router.post('/bsma/appointments/book', async (req: Request, res: Response) => {
  try {
    const {
      patient_oid,
      doctor_oid,
      facility_oid,
      appointment_type = 'consultation',
      scheduled_start,
      chief_complaint,
      chief_complaint_ar,
      language = 'ar',
      voice_recording_url,
    } = req.body as CreateAppointmentRequest & {
      voice_recording_url?: string;
      language?: string;
    };

    // Validate required fields
    if (!patient_oid || !facility_oid || !scheduled_start) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // TODO: Find available doctor if not specified
    // TODO: Check doctor availability
    // TODO: Calculate end time based on appointment type

    const appointment_id = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const oid = `1.3.6.1.4.1.61026.healthcare.appointments.${appointment_id}`;

    const scheduled_start_date = new Date(scheduled_start);
    const scheduled_end_date = new Date(scheduled_start_date.getTime() + 30 * 60000); // +30 min

    const newAppointment: Partial<Appointment> = {
      id: appointment_id,
      oid,
      patient_oid,
      doctor_oid: doctor_oid || 'AUTO_ASSIGN',
      facility_oid,
      appointment_type,
      status: 'scheduled',
      scheduled_start: scheduled_start_date,
      scheduled_end: scheduled_end_date,
      chief_complaint,
      chief_complaint_ar,
      booking_source: 'voice',
      language: language as 'en' | 'ar',
      created_via: 'bsma_voice',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // TODO: Save to database
    // await db.appointments.insert(newAppointment);

    // TODO: Send confirmation (SMS/WhatsApp)
    // await sendAppointmentConfirmation(patient_oid, newAppointment, language);

    res.status(201).json({
      success: true,
      data: newAppointment,
      message: language === 'ar'
        ? 'تم حجز الموعد بنجاح'
        : 'Appointment booked successfully',
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment',
    });
  }
});

/**
 * GET /api/bsma/appointments/patient/:patient_oid
 * Get patient's appointments
 */
router.get('/bsma/appointments/patient/:patient_oid', async (req: Request, res: Response) => {
  try {
    const { patient_oid } = req.params;
    const { status, upcoming_only, language = 'ar' } = req.query;

    const filters: any = { patient_oid };
    if (status) filters.status = status;
    if (upcoming_only === 'true') {
      filters.scheduled_start_gte = new Date();
    }

    // TODO: Fetch from database
    const appointments: Appointment[] = [];

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments',
    });
  }
});

// =============================================
// TRIAGE (VOICE)
// =============================================

/**
 * POST /api/bsma/triage
 * Voice triage workflow with AI classification
 */
router.post('/bsma/triage', async (req: Request, res: Response) => {
  try {
    const {
      patient_oid,
      language,
      audio_url,
      transcript,
      chief_complaint,
      symptoms,
      pain_level,
      duration_days,
    } = req.body as VoiceTriageRequest & {
      symptoms?: string[];
      pain_level?: number;
      duration_days?: number;
    };

    // Validate required fields
    if (!patient_oid || !language || !transcript || !chief_complaint) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const triage_id = `TRI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const oid = `1.3.6.1.4.1.61026.healthcare.triage.${triage_id}`;

    // TODO: AI Classification
    // const aiAnalysis = await aiTriageClassification(transcript, symptoms, pain_level);
    const aiAnalysis = {
      urgency_score: 50,
      recommended_specialty: 'general_practice',
      red_flags: [],
      confidence: 0.85,
      reasoning: 'AI classification pending',
    };

    // Determine severity based on AI analysis
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (aiAnalysis.urgency_score > 80 || aiAnalysis.red_flags.length > 0) {
      severity = 'critical';
    } else if (aiAnalysis.urgency_score > 60) {
      severity = 'high';
    } else if (aiAnalysis.urgency_score < 30) {
      severity = 'low';
    }

    const newTriage: Partial<TriageRecord> = {
      id: triage_id,
      oid,
      patient_oid,
      language,
      voice_recording_url: audio_url,
      transcript,
      chief_complaint,
      severity,
      ai_classification: aiAnalysis,
      pain_level,
      symptoms,
      duration_days,
      previous_occurrences: false,
      triaged_by: 'AI_BSMA',
      triaged_at: new Date(),
      created_at: new Date(),
    };

    // TODO: Save to database
    // await db.triage_records.insert(newTriage);

    // If critical, create emergency flag
    if (severity === 'critical') {
      // TODO: Create emergency flag
      // await createEmergencyFlag(patient_oid, triage_id, aiAnalysis);
    }

    res.status(201).json({
      success: true,
      data: newTriage,
      message: language === 'ar'
        ? 'تم تصنيف الحالة بنجاح'
        : 'Triage completed successfully',
      next_steps: severity === 'critical'
        ? (language === 'ar' ? 'حالة طارئة - سيتم توجيهك فوراً' : 'Emergency case - routing immediately')
        : (language === 'ar' ? 'سيتم حجز موعد لك' : 'Appointment will be scheduled'),
    });
  } catch (error) {
    console.error('Error processing triage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process triage',
    });
  }
});

// =============================================
// CHECK-IN & VITALS
// =============================================

/**
 * POST /api/bsma/appointments/:appointment_oid/check-in
 * Patient check-in via voice
 */
router.post('/bsma/appointments/:appointment_oid/check-in', async (req: Request, res: Response) => {
  try {
    const { appointment_oid } = req.params;
    const { language = 'ar' } = req.body;

    // TODO: Update appointment status to 'checked_in'
    // await db.appointments.update(appointment_oid, { 
    //   status: 'checked_in',
    //   updated_at: new Date()
    // });

    res.json({
      success: true,
      message: language === 'ar'
        ? 'تم تسجيل الوصول بنجاح'
        : 'Check-in successful',
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in',
    });
  }
});

/**
 * POST /api/bsma/vitals
 * Capture vitals via voice or device
 */
router.post('/bsma/vitals', async (req: Request, res: Response) => {
  try {
    const {
      patient_oid,
      appointment_oid,
      capture_method = 'voice',
      device_oid,
      temperature_celsius,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight_kg,
      height_cm,
      language = 'ar',
    } = req.body;

    if (!patient_oid) {
      return res.status(400).json({
        success: false,
        error: 'Patient OID required',
      });
    }

    const vitals_id = `VIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const oid = `1.3.6.1.4.1.61026.healthcare.vitals.${vitals_id}`;

    // Calculate BMI if height and weight provided
    let bmi: number | undefined;
    if (weight_kg && height_cm) {
      const height_m = height_cm / 100;
      bmi = Number((weight_kg / (height_m * height_m)).toFixed(2));
    }

    const newVitals: Partial<Vitals> = {
      id: vitals_id,
      oid,
      patient_oid,
      appointment_oid,
      captured_by: capture_method === 'voice' ? 'patient_voice' : (device_oid || 'manual'),
      capture_method,
      device_oid,
      temperature_celsius,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight_kg,
      height_cm,
      bmi,
      captured_at: new Date(),
    };

    // TODO: Save to database
    // await db.vitals.insert(newVitals);

    res.status(201).json({
      success: true,
      data: newVitals,
      message: language === 'ar'
        ? 'تم تسجيل العلامات الحيوية بنجاح'
        : 'Vitals recorded successfully',
    });
  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record vitals',
    });
  }
});

// =============================================
// EMERGENCY FLAGS
// =============================================

/**
 * POST /api/bsma/emergency
 * Create emergency flag with real-time routing
 */
router.post('/bsma/emergency', async (req: Request, res: Response) => {
  try {
    const {
      patient_oid,
      triage_oid,
      severity = 'urgent',
      flag_type,
      description,
      description_ar,
      voice_recording_url,
      location,
      language = 'ar',
    } = req.body;

    if (!patient_oid || !flag_type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const emergency_id = `EMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const oid = `1.3.6.1.4.1.61026.healthcare.emergency.${emergency_id}`;

    const newEmergency: Partial<EmergencyFlag> = {
      id: emergency_id,
      oid,
      patient_oid,
      triage_oid,
      severity,
      flag_type,
      description,
      description_ar,
      voice_recording_url,
      location,
      status: 'active',
      created_at: new Date(),
    };

    // TODO: Save to database
    // await db.emergency_flags.insert(newEmergency);

    // TODO: Real-time routing to on-call doctor
    // const onCallDoctor = await findOnCallDoctor(flag_type);
    // await routeEmergency(emergency_id, onCallDoctor.oid);
    // await sendEmergencyAlert(onCallDoctor.phone, newEmergency);

    res.status(201).json({
      success: true,
      data: newEmergency,
      message: language === 'ar'
        ? 'تم إنشاء علامة الطوارئ - جاري التوجيه للطبيب'
        : 'Emergency flag created - routing to doctor',
      alert_sent: true,
    });
  } catch (error) {
    console.error('Error creating emergency flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create emergency flag',
    });
  }
});

/**
 * GET /api/bsma/emergency/active
 * Get active emergency flags (for doctors/admins)
 */
router.get('/bsma/emergency/active', async (req: Request, res: Response) => {
  try {
    const { severity, facility_oid } = req.query;

    const filters: any = { status: 'active' };
    if (severity) filters.severity = severity;
    if (facility_oid) filters.facility_oid = facility_oid;

    // TODO: Fetch from database
    const emergencies: EmergencyFlag[] = [];

    res.json({
      success: true,
      data: emergencies,
      count: emergencies.length,
    });
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergencies',
    });
  }
});

/**
 * PUT /api/bsma/emergency/:id/route
 * Route emergency to a doctor
 */
router.put('/bsma/emergency/:id/route', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { doctor_oid } = req.body;

    if (!doctor_oid) {
      return res.status(400).json({
        success: false,
        error: 'Doctor OID required',
      });
    }

    const updateData = {
      routed_to_doctor_oid: doctor_oid,
      routed_at: new Date(),
      status: 'assigned',
    };

    // TODO: Update in database
    // await db.emergency_flags.update(id, updateData);

    // TODO: Send notification to doctor
    // await notifyDoctor(doctor_oid, 'emergency_assigned', { emergency_id: id });

    res.json({
      success: true,
      message: 'Emergency routed successfully',
    });
  } catch (error) {
    console.error('Error routing emergency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to route emergency',
    });
  }
});

// =============================================
// FOLLOW-UPS
// =============================================

/**
 * POST /api/bsma/follow-ups
 * Create follow-up reminder
 */
router.post('/bsma/follow-ups', async (req: Request, res: Response) => {
  try {
    const {
      patient_oid,
      original_appointment_oid,
      doctor_oid,
      follow_up_type,
      due_date,
      reason,
      reason_ar,
      language = 'ar',
    } = req.body;

    if (!patient_oid || !original_appointment_oid || !doctor_oid || !follow_up_type || !due_date || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const followup_id = `FU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const oid = `1.3.6.1.4.1.61026.healthcare.followups.${followup_id}`;

    const newFollowUp: Partial<FollowUp> = {
      id: followup_id,
      oid,
      patient_oid,
      original_appointment_oid,
      doctor_oid,
      follow_up_type,
      due_date: new Date(due_date),
      reason,
      reason_ar,
      status: 'pending',
      reminder_sent: false,
      created_at: new Date(),
    };

    // TODO: Save to database
    // await db.follow_ups.insert(newFollowUp);

    res.status(201).json({
      success: true,
      data: newFollowUp,
      message: language === 'ar'
        ? 'تم إنشاء تذكير المتابعة'
        : 'Follow-up reminder created',
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create follow-up',
    });
  }
});

/**
 * GET /api/bsma/follow-ups/patient/:patient_oid
 * Get patient's follow-ups
 */
router.get('/bsma/follow-ups/patient/:patient_oid', async (req: Request, res: Response) => {
  try {
    const { patient_oid } = req.params;
    const { status, overdue_only } = req.query;

    const filters: any = { patient_oid };
    if (status) filters.status = status;
    if (overdue_only === 'true') {
      filters.due_date_lt = new Date();
      filters.status = 'pending';
    }

    // TODO: Fetch from database
    const followUps: FollowUp[] = [];

    res.json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow-ups',
    });
  }
});

export default router;
