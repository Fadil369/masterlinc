-- ===============================================
-- MASTERLINC HEALTHCARE ENHANCEMENT SCHEMA
-- DID/OID Integration, Doctor Workspace, Endorsements, Handovers, AI
-- PostgreSQL + Cloudflare D1 Compatible
-- HIPAA Compliant, NPHIES Ready
-- ===============================================

-- =============================================
-- SECTION 1: DOCTORS WITH DID INTEGRATION
-- =============================================

-- Doctors table with DID support
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  did TEXT UNIQUE NOT NULL, -- did:brainsait:doctor:{id}
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.providers.{id}
  name TEXT NOT NULL,
  name_ar TEXT, -- Arabic name
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  specialty TEXT NOT NULL,
  specialty_ar TEXT,
  license_number TEXT UNIQUE NOT NULL,
  license_issuer TEXT,
  license_expiry TIMESTAMP,
  public_key TEXT, -- Ed25519 public key (multibase encoded)
  credentials TEXT, -- JSON: certifications, training, affiliations
  languages TEXT NOT NULL DEFAULT '["en"]', -- JSON array: ["en", "ar"]
  facilities TEXT, -- JSON array of facility OIDs
  working_hours TEXT, -- JSON: schedule per facility
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended', 'on_leave')),
  avatar_url TEXT,
  bio TEXT,
  bio_ar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_did ON doctors(did);
CREATE INDEX IF NOT EXISTS idx_doctors_oid ON doctors(oid);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

-- =============================================
-- SECTION 2: PATIENTS WITH OID INTEGRATION
-- =============================================

-- Enhanced Patients table with full OID integration
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.patients.{id}
  nphies_id TEXT UNIQUE, -- National patient identifier
  national_id TEXT UNIQUE, -- Government ID
  name TEXT NOT NULL,
  name_ar TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('male', 'female', 'other')),
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  address_ar TEXT,
  city TEXT,
  country TEXT DEFAULT 'SA',
  nationality TEXT DEFAULT 'SA',
  language_preference TEXT DEFAULT 'en' CHECK(language_preference IN ('en', 'ar', 'mixed')),
  insurance_provider TEXT,
  insurance_member_id TEXT,
  insurance_expiry DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  blood_type TEXT CHECK(blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT, -- JSON array of allergy objects
  chronic_conditions TEXT, -- JSON array of conditions
  current_medications TEXT, -- JSON array of medications
  medical_history TEXT, -- JSON: past surgeries, conditions, treatments
  consent_for_voice TEXT DEFAULT 'pending' CHECK(consent_for_voice IN ('granted', 'denied', 'pending')),
  consent_for_data_sharing TEXT DEFAULT 'pending' CHECK(consent_for_data_sharing IN ('granted', 'denied', 'pending')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'deceased')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_oid ON patients(oid);
CREATE INDEX IF NOT EXISTS idx_patients_nphies_id ON patients(nphies_id);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- =============================================
-- SECTION 3: APPOINTMENTS WITH FULL WORKFLOW
-- =============================================

-- Enhanced appointments with OID linkage
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.appointments.{id}
  patient_oid TEXT NOT NULL,
  doctor_oid TEXT NOT NULL,
  facility_oid TEXT NOT NULL,
  appointment_type TEXT NOT NULL CHECK(appointment_type IN ('consultation', 'follow_up', 'procedure', 'emergency', 'triage', 'telehealth')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  chief_complaint TEXT,
  chief_complaint_ar TEXT,
  booking_source TEXT NOT NULL CHECK(booking_source IN ('voice', 'web', 'phone', 'whatsapp', 'telegram', 'walk_in', 'admin')),
  language TEXT DEFAULT 'en' CHECK(language IN ('en', 'ar')),
  notes TEXT,
  notes_ar TEXT,
  created_via TEXT NOT NULL, -- Who/what created the appointment
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_appointments_oid ON appointments(oid);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_oid);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_appointments_facility ON appointments(facility_oid);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- =============================================
-- SECTION 4: BSMA PATIENT VOICE WORKFLOW
-- =============================================

-- Triage records from voice workflow
CREATE TABLE IF NOT EXISTS triage_records (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.triage.{id}
  patient_oid TEXT NOT NULL,
  appointment_oid TEXT,
  language TEXT NOT NULL CHECK(language IN ('en', 'ar')),
  voice_recording_url TEXT, -- R2/S3 URL for voice file
  transcript TEXT NOT NULL,
  transcript_ar TEXT, -- Translation if needed
  chief_complaint TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  ai_classification TEXT, -- JSON: AI triage analysis
  pain_level INTEGER CHECK(pain_level BETWEEN 0 AND 10),
  symptoms TEXT, -- JSON array
  duration_days INTEGER,
  previous_occurrences BOOLEAN DEFAULT FALSE,
  triaged_by TEXT, -- AI or human identifier
  triaged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_doctor_oid TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid),
  FOREIGN KEY (reviewed_by_doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_triage_patient ON triage_records(patient_oid);
CREATE INDEX IF NOT EXISTS idx_triage_severity ON triage_records(severity);
CREATE INDEX IF NOT EXISTS idx_triage_triaged_at ON triage_records(triaged_at DESC);

-- Vitals captured via voice or device
CREATE TABLE IF NOT EXISTS vitals (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.vitals.{id}
  patient_oid TEXT NOT NULL,
  appointment_oid TEXT,
  captured_by TEXT NOT NULL, -- Device OID, doctor OID, or 'patient_voice'
  capture_method TEXT NOT NULL CHECK(capture_method IN ('voice', 'manual', 'iot_device', 'integrated_device')),
  device_oid TEXT, -- If captured by IoT device
  temperature_celsius DECIMAL(4, 2),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER CHECK(oxygen_saturation BETWEEN 0 AND 100),
  weight_kg DECIMAL(5, 2),
  height_cm DECIMAL(5, 2),
  bmi DECIMAL(4, 2),
  glucose_mg_dl INTEGER,
  notes TEXT,
  captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid)
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_oid);
CREATE INDEX IF NOT EXISTS idx_vitals_appointment ON vitals(appointment_oid);
CREATE INDEX IF NOT EXISTS idx_vitals_captured_at ON vitals(captured_at DESC);

-- Exam findings during consultation
CREATE TABLE IF NOT EXISTS exam_findings (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.exams.{id}
  appointment_oid TEXT NOT NULL,
  patient_oid TEXT NOT NULL,
  doctor_oid TEXT NOT NULL,
  exam_type TEXT NOT NULL, -- 'physical', 'visual', 'neurological', etc.
  system TEXT, -- 'cardiovascular', 'respiratory', 'neurological', etc.
  findings TEXT NOT NULL,
  findings_ar TEXT,
  abnormal BOOLEAN DEFAULT FALSE,
  severity TEXT CHECK(severity IN ('normal', 'mild', 'moderate', 'severe')),
  images TEXT, -- JSON array of image URLs/OIDs
  voice_note_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid),
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_exam_findings_appointment ON exam_findings(appointment_oid);
CREATE INDEX IF NOT EXISTS idx_exam_findings_patient ON exam_findings(patient_oid);

-- Clinical documentation (SOAP notes, reports)
CREATE TABLE IF NOT EXISTS clinical_documentation (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.documentation.{id}
  appointment_oid TEXT NOT NULL,
  patient_oid TEXT NOT NULL,
  doctor_oid TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('soap_note', 'progress_note', 'discharge_summary', 'consultation_report', 'prescription', 'lab_order', 'referral')),
  template_id TEXT, -- Reference to template used
  content TEXT NOT NULL, -- Structured content (could be JSON or Markdown)
  content_ar TEXT,
  diagnosis_codes TEXT, -- JSON array of ICD-10 codes
  procedure_codes TEXT, -- JSON array of CPT/local codes
  prescriptions TEXT, -- JSON array of medication orders
  lab_orders TEXT, -- JSON array of lab test orders
  referrals TEXT, -- JSON array of specialist referrals
  follow_up_instructions TEXT,
  follow_up_instructions_ar TEXT,
  digital_signature TEXT, -- DID-based signature
  signed_by_did TEXT, -- Doctor's DID who signed
  signed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'signed', 'amended', 'final')),
  voice_dictation_url TEXT, -- If created via voice
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_reviewed_by_doctor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid),
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid),
  FOREIGN KEY (signed_by_did) REFERENCES doctors(did)
);

CREATE INDEX IF NOT EXISTS idx_clinical_doc_appointment ON clinical_documentation(appointment_oid);
CREATE INDEX IF NOT EXISTS idx_clinical_doc_patient ON clinical_documentation(patient_oid);
CREATE INDEX IF NOT EXISTS idx_clinical_doc_doctor ON clinical_documentation(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_clinical_doc_type ON clinical_documentation(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_doc_status ON clinical_documentation(status);

-- Emergency flags for real-time routing
CREATE TABLE IF NOT EXISTS emergency_flags (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.emergency.{id}
  patient_oid TEXT NOT NULL,
  triage_oid TEXT,
  appointment_oid TEXT,
  severity TEXT NOT NULL CHECK(severity IN ('critical', 'urgent', 'moderate')),
  flag_type TEXT NOT NULL CHECK(flag_type IN ('chest_pain', 'breathing_difficulty', 'severe_bleeding', 'loss_consciousness', 'stroke_symptoms', 'allergic_reaction', 'trauma', 'other')),
  description TEXT NOT NULL,
  description_ar TEXT,
  voice_recording_url TEXT,
  location TEXT, -- If known
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'assigned', 'in_progress', 'resolved', 'cancelled')),
  routed_to_doctor_oid TEXT,
  routed_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (triage_oid) REFERENCES triage_records(oid),
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid),
  FOREIGN KEY (routed_to_doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_emergency_patient ON emergency_flags(patient_oid);
CREATE INDEX IF NOT EXISTS idx_emergency_severity ON emergency_flags(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_flags(status);
CREATE INDEX IF NOT EXISTS idx_emergency_created_at ON emergency_flags(created_at DESC);

-- Follow-ups
CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.followups.{id}
  patient_oid TEXT NOT NULL,
  original_appointment_oid TEXT NOT NULL,
  doctor_oid TEXT NOT NULL,
  follow_up_type TEXT NOT NULL CHECK(follow_up_type IN ('appointment', 'call', 'message', 'test_review', 'medication_review')),
  due_date TIMESTAMP NOT NULL,
  reason TEXT NOT NULL,
  reason_ar TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'scheduled', 'completed', 'cancelled', 'overdue')),
  completed_at TIMESTAMP,
  completion_notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (original_appointment_oid) REFERENCES appointments(oid),
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_followups_patient ON follow_ups(patient_oid);
CREATE INDEX IF NOT EXISTS idx_followups_doctor ON follow_ups(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_followups_due_date ON follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON follow_ups(status);

-- =============================================
-- SECTION 5: DOCTOR'S WORKSPACE - TEMPLATES
-- =============================================

-- Template library for documentation
CREATE TABLE IF NOT EXISTS template_library (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.templates.{id}
  name TEXT NOT NULL,
  name_ar TEXT,
  category TEXT NOT NULL CHECK(category IN ('soap_note', 'progress_note', 'discharge_summary', 'prescription', 'lab_order', 'referral', 'consent_form', 'patient_instruction')),
  specialty TEXT, -- If specialty-specific
  language TEXT NOT NULL DEFAULT 'en' CHECK(language IN ('en', 'ar', 'both')),
  template_content TEXT NOT NULL, -- Structured template (JSON or Markdown with variables)
  template_content_ar TEXT,
  variables TEXT, -- JSON array of variable definitions
  is_public BOOLEAN DEFAULT TRUE, -- Public templates vs. personal
  created_by_doctor_oid TEXT,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00 CHECK(rating BETWEEN 0 AND 5),
  tags TEXT, -- JSON array for searchability
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deprecated')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON template_library(category);
CREATE INDEX IF NOT EXISTS idx_templates_specialty ON template_library(specialty);
CREATE INDEX IF NOT EXISTS idx_templates_status ON template_library(status);
CREATE INDEX IF NOT EXISTS idx_templates_rating ON template_library(rating DESC);

-- =============================================
-- SECTION 6: DOCTOR'S WORKSPACE - TASKS
-- =============================================

-- Doctor task management
CREATE TABLE IF NOT EXISTS doctor_tasks (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.tasks.{id}
  doctor_oid TEXT NOT NULL,
  patient_oid TEXT,
  appointment_oid TEXT,
  task_type TEXT NOT NULL CHECK(task_type IN ('review_labs', 'follow_up_call', 'prescription_renewal', 'referral_review', 'document_review', 'admin', 'other')),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'deferred')),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  automation_rule_id TEXT, -- If auto-generated
  assigned_by_oid TEXT, -- If assigned by another doctor/admin
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid),
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid)
);

CREATE INDEX IF NOT EXISTS idx_tasks_doctor ON doctor_tasks(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_tasks_patient ON doctor_tasks(patient_oid);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON doctor_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON doctor_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON doctor_tasks(due_date);

-- Task automation rules
CREATE TABLE IF NOT EXISTS task_automation_rules (
  id TEXT PRIMARY KEY,
  doctor_oid TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK(trigger_type IN ('appointment_complete', 'lab_result_received', 'diagnosis_code', 'prescription_expiring', 'time_based', 'patient_message')),
  trigger_conditions TEXT NOT NULL, -- JSON: conditions to match
  task_template TEXT NOT NULL, -- JSON: task to create
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_automation_doctor ON task_automation_rules(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_automation_enabled ON task_automation_rules(enabled);

-- =============================================
-- SECTION 7: DOCTOR'S WORKSPACE - VOICE
-- =============================================

-- Voice-to-text transcriptions
CREATE TABLE IF NOT EXISTS voice_transcriptions (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.voice.{id}
  doctor_oid TEXT NOT NULL,
  patient_oid TEXT,
  appointment_oid TEXT,
  audio_url TEXT NOT NULL, -- R2/S3 URL
  audio_duration_seconds INTEGER,
  language TEXT NOT NULL CHECK(language IN ('en', 'ar')),
  transcript TEXT NOT NULL,
  transcript_ar TEXT, -- If translation needed
  confidence_score DECIMAL(4, 3), -- 0.000 to 1.000
  voice_commands TEXT, -- JSON array of extracted commands
  context_type TEXT CHECK(context_type IN ('clinical_note', 'prescription', 'lab_order', 'command', 'general')),
  processed BOOLEAN DEFAULT FALSE,
  linked_document_oid TEXT, -- If resulted in a document
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid),
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid)
);

CREATE INDEX IF NOT EXISTS idx_voice_doctor ON voice_transcriptions(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_voice_patient ON voice_transcriptions(patient_oid);
CREATE INDEX IF NOT EXISTS idx_voice_created_at ON voice_transcriptions(created_at DESC);

-- =============================================
-- SECTION 8: ENDORSEMENTS & HANDOVERS
-- =============================================

-- Patient endorsements (feedback/ratings)
CREATE TABLE IF NOT EXISTS patient_endorsements (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.endorsements.{id}
  patient_oid TEXT NOT NULL,
  doctor_oid TEXT NOT NULL,
  appointment_oid TEXT,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  feedback_text_ar TEXT,
  feedback_voice_url TEXT, -- Voice feedback recording
  feedback_type TEXT NOT NULL CHECK(feedback_type IN ('text', 'voice', 'both')),
  language TEXT NOT NULL CHECK(language IN ('en', 'ar')),
  categories TEXT, -- JSON array: ['bedside_manner', 'expertise', 'communication', 'wait_time']
  consent_for_display BOOLEAN DEFAULT FALSE,
  consent_for_sharing BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'hidden', 'flagged', 'removed')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_oid) REFERENCES patients(oid),
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid),
  FOREIGN KEY (appointment_oid) REFERENCES appointments(oid)
);

CREATE INDEX IF NOT EXISTS idx_endorsements_patient ON patient_endorsements(patient_oid);
CREATE INDEX IF NOT EXISTS idx_endorsements_doctor ON patient_endorsements(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_endorsements_rating ON patient_endorsements(rating);
CREATE INDEX IF NOT EXISTS idx_endorsements_created_at ON patient_endorsements(created_at DESC);

-- Doctor responses to endorsements
CREATE TABLE IF NOT EXISTS endorsement_responses (
  id TEXT PRIMARY KEY,
  endorsement_oid TEXT NOT NULL,
  doctor_oid TEXT NOT NULL,
  response_text TEXT NOT NULL,
  response_text_ar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_endorsement_responses_endorsement ON endorsement_responses(endorsement_oid);

-- Handover sessions
CREATE TABLE IF NOT EXISTS handover_sessions (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.healthcare.handovers.{id}
  from_doctor_oid TEXT NOT NULL,
  to_doctor_oid TEXT NOT NULL,
  shift_type TEXT NOT NULL CHECK(shift_type IN ('day_to_night', 'night_to_day', 'weekday_to_weekend', 'vacation_coverage', 'emergency')),
  handover_time TIMESTAMP NOT NULL,
  voice_brief_url TEXT, -- Voice recording of handover brief
  voice_brief_transcript TEXT,
  critical_patients TEXT NOT NULL, -- JSON array of patient OIDs with critical info
  pending_tasks TEXT, -- JSON array of tasks being handed over
  urgent_items TEXT, -- JSON array of urgent items
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'acknowledged')),
  acknowledged_by_did TEXT, -- Receiving doctor's DID signature
  acknowledged_at TIMESTAMP,
  completion_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_doctor_oid) REFERENCES doctors(oid),
  FOREIGN KEY (to_doctor_oid) REFERENCES doctors(oid),
  FOREIGN KEY (acknowledged_by_did) REFERENCES doctors(did)
);

CREATE INDEX IF NOT EXISTS idx_handovers_from_doctor ON handover_sessions(from_doctor_oid);
CREATE INDEX IF NOT EXISTS idx_handovers_to_doctor ON handover_sessions(to_doctor_oid);
CREATE INDEX IF NOT EXISTS idx_handovers_time ON handover_sessions(handover_time);
CREATE INDEX IF NOT EXISTS idx_handovers_status ON handover_sessions(status);

-- Handover tasks
CREATE TABLE IF NOT EXISTS handover_tasks (
  id TEXT PRIMARY KEY,
  handover_oid TEXT NOT NULL,
  patient_oid TEXT NOT NULL,
  task_description TEXT NOT NULL,
  task_description_ar TEXT,
  priority TEXT NOT NULL CHECK(priority IN ('routine', 'important', 'urgent', 'critical')),
  due_time TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completion_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_oid) REFERENCES patients(oid)
);

CREATE INDEX IF NOT EXISTS idx_handover_tasks_handover ON handover_tasks(handover_oid);
CREATE INDEX IF NOT EXISTS idx_handover_tasks_patient ON handover_tasks(patient_oid);
CREATE INDEX IF NOT EXISTS idx_handover_tasks_completed ON handover_tasks(completed);

-- Endorsement analytics
CREATE TABLE IF NOT EXISTS endorsement_analytics (
  id TEXT PRIMARY KEY,
  doctor_oid TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_endorsements INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_distribution TEXT, -- JSON: {1: count, 2: count, ...}
  category_scores TEXT, -- JSON: average scores per category
  sentiment_analysis TEXT, -- JSON: positive/neutral/negative counts
  top_keywords TEXT, -- JSON: frequently mentioned keywords
  trend TEXT CHECK(trend IN ('improving', 'stable', 'declining')),
  percentile_rank INTEGER, -- Among peers
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_analytics_doctor ON endorsement_analytics(doctor_oid);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON endorsement_analytics(period_start, period_end);

-- =============================================
-- SECTION 9: DID/OID INTEGRATION & AUDIT
-- =============================================

-- Enhanced DID-OID mapping with access control
CREATE TABLE IF NOT EXISTS did_oid_mapping (
  id TEXT PRIMARY KEY,
  did TEXT UNIQUE NOT NULL,
  oid TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('doctor', 'patient', 'facility', 'device', 'organization', 'service')),
  access_level TEXT NOT NULL DEFAULT 'standard' CHECK(access_level IN ('public', 'standard', 'restricted', 'confidential')),
  permissions TEXT, -- JSON: read/write/admin permissions
  metadata TEXT, -- JSON: additional entity info
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'revoked')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  revocation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_did_mapping_did ON did_oid_mapping(did);
CREATE INDEX IF NOT EXISTS idx_did_mapping_oid ON did_oid_mapping(oid);
CREATE INDEX IF NOT EXISTS idx_did_mapping_entity_type ON did_oid_mapping(entity_type);

-- Comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.audit.{id}
  actor_did TEXT, -- Who performed the action
  actor_oid TEXT,
  action_type TEXT NOT NULL CHECK(action_type IN ('create', 'read', 'update', 'delete', 'sign', 'verify', 'access_grant', 'access_revoke', 'export', 'print')),
  resource_type TEXT NOT NULL, -- Table/entity type
  resource_oid TEXT NOT NULL, -- Specific resource OID
  resource_snapshot TEXT, -- JSON: state before/after
  ip_address TEXT,
  user_agent TEXT,
  location TEXT, -- Geolocation if available
  session_id TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  compliance_flags TEXT, -- JSON: HIPAA, NPHIES flags
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_did ON audit_trail(actor_did);
CREATE INDEX IF NOT EXISTS idx_audit_resource_oid ON audit_trail(resource_oid);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_trail(created_at DESC);

-- Device registry with OID tracking
CREATE TABLE IF NOT EXISTS device_registry (
  id TEXT PRIMARY KEY,
  oid TEXT UNIQUE NOT NULL, -- 1.3.6.1.4.1.61026.devices.{id}
  device_type TEXT NOT NULL CHECK(device_type IN ('vital_monitor', 'esp32_qr', 'tablet', 'workstation', 'iot_sensor', 'medical_equipment')),
  device_name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  firmware_version TEXT,
  facility_oid TEXT,
  assigned_doctor_oid TEXT,
  public_key TEXT, -- For device authentication
  certificate_oid TEXT, -- X.509 certificate reference
  ip_address TEXT,
  mac_address TEXT,
  last_heartbeat TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
  calibration_due_date DATE,
  compliance_certifications TEXT, -- JSON: FDA, CE marks, etc.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_doctor_oid) REFERENCES doctors(oid)
);

CREATE INDEX IF NOT EXISTS idx_devices_oid ON device_registry(oid);
CREATE INDEX IF NOT EXISTS idx_devices_type ON device_registry(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_facility ON device_registry(facility_oid);
CREATE INDEX IF NOT EXISTS idx_devices_status ON device_registry(status);

-- =============================================
-- SECTION 10: PROVENANCE & FHIR INTEGRATION
-- =============================================

-- Data provenance tracking
CREATE TABLE IF NOT EXISTS data_provenance (
  id TEXT PRIMARY KEY,
  resource_oid TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  fhir_resource_type TEXT, -- FHIR resource mapping
  created_by_did TEXT,
  created_by_oid TEXT,
  creation_method TEXT NOT NULL CHECK(creation_method IN ('manual', 'voice', 'ai_generated', 'imported', 'device_capture', 'api')),
  source_system TEXT,
  source_system_oid TEXT,
  parent_resource_oid TEXT, -- If derived from another resource
  transformation_applied TEXT, -- JSON: transformations/validations
  data_quality_score DECIMAL(4, 3), -- 0.000 to 1.000
  validation_status TEXT CHECK(validation_status IN ('pending', 'validated', 'flagged', 'rejected')),
  validated_by_did TEXT,
  validated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_provenance_resource ON data_provenance(resource_oid);
CREATE INDEX IF NOT EXISTS idx_provenance_creator ON data_provenance(created_by_did);
CREATE INDEX IF NOT EXISTS idx_provenance_created_at ON data_provenance(created_at DESC);

-- =============================================
-- END OF SCHEMA
-- =============================================
