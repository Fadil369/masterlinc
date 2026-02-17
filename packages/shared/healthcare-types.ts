/**
 * MASTERLINC HEALTHCARE ENHANCEMENT TYPES
 * TypeScript type definitions for DID/OID integrated healthcare system
 * Aligned with infrastructure/healthcare-enhancement.sql
 */

// =============================================
// SECTION 1: DOCTOR TYPES
// =============================================

export type DoctorStatus = 'active' | 'inactive' | 'suspended' | 'on_leave';

export interface Doctor {
  id: string;
  did: string; // did:brainsait:doctor:{id}
  oid: string; // 1.3.6.1.4.1.61026.healthcare.providers.{id}
  name: string;
  name_ar?: string;
  email: string;
  phone?: string;
  specialty: string;
  specialty_ar?: string;
  license_number: string;
  license_issuer?: string;
  license_expiry?: Date;
  public_key?: string; // Ed25519 multibase encoded
  credentials?: DoctorCredentials;
  languages: string[]; // ["en", "ar"]
  facilities?: string[]; // Array of facility OIDs
  working_hours?: WorkingHours;
  status: DoctorStatus;
  avatar_url?: string;
  bio?: string;
  bio_ar?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface DoctorCredentials {
  certifications: Certification[];
  training: Training[];
  affiliations: Affiliation[];
}

export interface Certification {
  name: string;
  issuer: string;
  issued_date: string;
  expiry_date?: string;
  certificate_url?: string;
}

export interface Training {
  program: string;
  institution: string;
  completion_date: string;
  credential?: string;
}

export interface Affiliation {
  organization: string;
  role: string;
  start_date: string;
  end_date?: string;
}

export interface WorkingHours {
  [facilityOid: string]: {
    [day: string]: { // 'monday', 'tuesday', etc.
      start: string; // "09:00"
      end: string; // "17:00"
      breaks?: Array<{ start: string; end: string }>;
    };
  };
}

// =============================================
// SECTION 2: PATIENT TYPES
// =============================================

export type Gender = 'male' | 'female' | 'other';
export type LanguagePreference = 'en' | 'ar' | 'mixed';
export type ConsentStatus = 'granted' | 'denied' | 'pending';
export type PatientStatus = 'active' | 'inactive' | 'deceased';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Patient {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.patients.{id}
  nphies_id?: string;
  national_id?: string;
  name: string;
  name_ar?: string;
  date_of_birth: Date;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  address_ar?: string;
  city?: string;
  country: string;
  nationality: string;
  language_preference: LanguagePreference;
  insurance_provider?: string;
  insurance_member_id?: string;
  insurance_expiry?: Date;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  blood_type?: BloodType;
  allergies?: Allergy[];
  chronic_conditions?: ChronicCondition[];
  current_medications?: Medication[];
  medical_history?: MedicalHistory;
  consent_for_voice: ConsentStatus;
  consent_for_data_sharing: ConsentStatus;
  status: PatientStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Allergy {
  allergen: string;
  type: 'food' | 'medication' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction: string;
  onset_date?: string;
}

export interface ChronicCondition {
  condition: string;
  icd10_code?: string;
  diagnosed_date: string;
  severity: 'mild' | 'moderate' | 'severe';
  under_control: boolean;
  treatment?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'injection' | 'topical' | 'inhalation' | 'other';
  start_date: string;
  end_date?: string;
  prescribing_doctor_oid?: string;
  reason: string;
}

export interface MedicalHistory {
  surgeries?: Array<{
    procedure: string;
    date: string;
    hospital?: string;
    surgeon?: string;
    complications?: string;
  }>;
  hospitalizations?: Array<{
    reason: string;
    admission_date: string;
    discharge_date: string;
    facility?: string;
  }>;
  family_history?: Array<{
    relation: string;
    condition: string;
    age_of_onset?: number;
  }>;
}

// =============================================
// SECTION 3: APPOINTMENT TYPES
// =============================================

export type AppointmentType = 'consultation' | 'follow_up' | 'procedure' | 'emergency' | 'triage' | 'telehealth';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type BookingSource = 'voice' | 'web' | 'phone' | 'whatsapp' | 'telegram' | 'walk_in' | 'admin';
export type AppointmentLanguage = 'en' | 'ar';

export interface Appointment {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.appointments.{id}
  patient_oid: string;
  doctor_oid: string;
  facility_oid: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_start: Date;
  scheduled_end: Date;
  actual_start?: Date;
  actual_end?: Date;
  chief_complaint?: string;
  chief_complaint_ar?: string;
  booking_source: BookingSource;
  language: AppointmentLanguage;
  notes?: string;
  notes_ar?: string;
  created_via: string;
  created_at: Date;
  updated_at: Date;
}

// =============================================
// SECTION 4: BSMA VOICE WORKFLOW TYPES
// =============================================

export type TriageLanguage = 'en' | 'ar';
export type TriageSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TriageRecord {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.triage.{id}
  patient_oid: string;
  appointment_oid?: string;
  language: TriageLanguage;
  voice_recording_url?: string;
  transcript: string;
  transcript_ar?: string;
  chief_complaint: string;
  severity: TriageSeverity;
  ai_classification?: AITriageClassification;
  pain_level?: number; // 0-10
  symptoms?: string[];
  duration_days?: number;
  previous_occurrences: boolean;
  triaged_by: string; // AI or human identifier
  triaged_at: Date;
  reviewed_by_doctor_oid?: string;
  reviewed_at?: Date;
  created_at: Date;
}

export interface AITriageClassification {
  urgency_score: number; // 0-100
  recommended_specialty: string;
  red_flags: string[];
  suggested_tests?: string[];
  confidence: number; // 0-1
  reasoning: string;
}

export type CaptureMethod = 'voice' | 'manual' | 'iot_device' | 'integrated_device';

export interface Vitals {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.vitals.{id}
  patient_oid: string;
  appointment_oid?: string;
  captured_by: string; // Device OID, doctor OID, or 'patient_voice'
  capture_method: CaptureMethod;
  device_oid?: string;
  temperature_celsius?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number; // 0-100
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  glucose_mg_dl?: number;
  notes?: string;
  captured_at: Date;
}

export type ExamSeverity = 'normal' | 'mild' | 'moderate' | 'severe';

export interface ExamFinding {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.exams.{id}
  appointment_oid: string;
  patient_oid: string;
  doctor_oid: string;
  exam_type: string; // 'physical', 'visual', 'neurological', etc.
  system?: string; // 'cardiovascular', 'respiratory', etc.
  findings: string;
  findings_ar?: string;
  abnormal: boolean;
  severity?: ExamSeverity;
  images?: string[]; // URLs/OIDs
  voice_note_url?: string;
  created_at: Date;
}

export type DocumentType = 'soap_note' | 'progress_note' | 'discharge_summary' | 'consultation_report' | 'prescription' | 'lab_order' | 'referral';
export type DocumentStatus = 'draft' | 'signed' | 'amended' | 'final';

export interface ClinicalDocumentation {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.documentation.{id}
  appointment_oid: string;
  patient_oid: string;
  doctor_oid: string;
  document_type: DocumentType;
  template_id?: string;
  content: string; // JSON or Markdown
  content_ar?: string;
  diagnosis_codes?: string[]; // ICD-10
  procedure_codes?: string[]; // CPT/local
  prescriptions?: PrescriptionOrder[];
  lab_orders?: LabOrder[];
  referrals?: Referral[];
  follow_up_instructions?: string;
  follow_up_instructions_ar?: string;
  digital_signature?: string; // DID-based
  signed_by_did?: string;
  signed_at?: Date;
  status: DocumentStatus;
  voice_dictation_url?: string;
  ai_generated: boolean;
  ai_reviewed_by_doctor: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PrescriptionOrder {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  instructions_ar?: string;
  refills?: number;
}

export interface LabOrder {
  test_name: string;
  test_code?: string;
  priority: 'routine' | 'urgent' | 'stat';
  instructions?: string;
  fasting_required?: boolean;
}

export interface Referral {
  specialty: string;
  doctor_name?: string;
  facility?: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  notes?: string;
}

export type EmergencyFlagType = 'chest_pain' | 'breathing_difficulty' | 'severe_bleeding' | 'loss_consciousness' | 'stroke_symptoms' | 'allergic_reaction' | 'trauma' | 'other';
export type EmergencySeverity = 'critical' | 'urgent' | 'moderate';
export type EmergencyStatus = 'active' | 'acknowledged' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';

export interface EmergencyFlag {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.emergency.{id}
  patient_oid: string;
  triage_oid?: string;
  appointment_oid?: string;
  severity: EmergencySeverity;
  flag_type: EmergencyFlagType;
  description: string;
  description_ar?: string;
  voice_recording_url?: string;
  location?: string;
  status: EmergencyStatus;
  routed_to_doctor_oid?: string;
  routed_at?: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
}

export type FollowUpType = 'appointment' | 'call' | 'message' | 'test_review' | 'medication_review';
export type FollowUpStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'overdue';

export interface FollowUp {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.followups.{id}
  patient_oid: string;
  original_appointment_oid: string;
  doctor_oid: string;
  follow_up_type: FollowUpType;
  due_date: Date;
  reason: string;
  reason_ar?: string;
  status: FollowUpStatus;
  completed_at?: Date;
  completion_notes?: string;
  reminder_sent: boolean;
  reminder_sent_at?: Date;
  created_at: Date;
}

// =============================================
// SECTION 5: DOCTOR WORKSPACE TYPES
// =============================================

export type TemplateCategory = 'soap_note' | 'progress_note' | 'discharge_summary' | 'prescription' | 'lab_order' | 'referral' | 'consent_form' | 'patient_instruction';
export type TemplateLanguage = 'en' | 'ar' | 'both';
export type TemplateStatus = 'active' | 'archived' | 'deprecated';

export interface Template {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.templates.{id}
  name: string;
  name_ar?: string;
  category: TemplateCategory;
  specialty?: string;
  language: TemplateLanguage;
  template_content: string; // JSON or Markdown with variables
  template_content_ar?: string;
  variables?: TemplateVariable[];
  is_public: boolean;
  created_by_doctor_oid?: string;
  usage_count: number;
  rating: number; // 0-5
  tags?: string[];
  status: TemplateStatus;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  label: string;
  label_ar?: string;
  required: boolean;
  default_value?: any;
  options?: Array<{ value: string; label: string; label_ar?: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export type TaskType = 'review_labs' | 'follow_up_call' | 'prescription_renewal' | 'referral_review' | 'document_review' | 'admin' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';

export interface DoctorTask {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.tasks.{id}
  doctor_oid: string;
  patient_oid?: string;
  appointment_oid?: string;
  task_type: TaskType;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: Date;
  completed_at?: Date;
  automation_rule_id?: string;
  assigned_by_oid?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export type TriggerType = 'appointment_complete' | 'lab_result_received' | 'diagnosis_code' | 'prescription_expiring' | 'time_based' | 'patient_message';

export interface TaskAutomationRule {
  id: string;
  doctor_oid: string;
  rule_name: string;
  trigger_type: TriggerType;
  trigger_conditions: TriggerConditions;
  task_template: TaskTemplate;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TriggerConditions {
  // For appointment_complete
  appointment_types?: AppointmentType[];
  // For lab_result_received
  lab_test_types?: string[];
  // For diagnosis_code
  icd10_codes?: string[];
  // For prescription_expiring
  days_before_expiry?: number;
  // For time_based
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string; // "09:00"
    day_of_week?: number; // 0-6
    day_of_month?: number; // 1-31
  };
  // Additional filters
  patient_age_range?: { min?: number; max?: number };
  patient_conditions?: string[];
}

export interface TaskTemplate {
  task_type: TaskType;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  priority: TaskPriority;
  due_offset_hours?: number; // Hours from trigger
}

export type VoiceContextType = 'clinical_note' | 'prescription' | 'lab_order' | 'command' | 'general';

export interface VoiceTranscription {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.voice.{id}
  doctor_oid: string;
  patient_oid?: string;
  appointment_oid?: string;
  audio_url: string;
  audio_duration_seconds?: number;
  language: 'en' | 'ar';
  transcript: string;
  transcript_ar?: string;
  confidence_score?: number; // 0-1
  voice_commands?: VoiceCommand[];
  context_type?: VoiceContextType;
  processed: boolean;
  linked_document_oid?: string;
  created_at: Date;
}

export interface VoiceCommand {
  command: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp_seconds: number; // Position in audio
}

// =============================================
// SECTION 6: ENDORSEMENTS & HANDOVERS
// =============================================

export type FeedbackType = 'text' | 'voice' | 'both';
export type EndorsementStatus = 'active' | 'hidden' | 'flagged' | 'removed';

export interface PatientEndorsement {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.endorsements.{id}
  patient_oid: string;
  doctor_oid: string;
  appointment_oid?: string;
  rating: number; // 1-5
  feedback_text?: string;
  feedback_text_ar?: string;
  feedback_voice_url?: string;
  feedback_type: FeedbackType;
  language: 'en' | 'ar';
  categories?: EndorsementCategory[];
  consent_for_display: boolean;
  consent_for_sharing: boolean;
  is_verified: boolean;
  verified_at?: Date;
  status: EndorsementStatus;
  created_at: Date;
}

export type EndorsementCategory = 'bedside_manner' | 'expertise' | 'communication' | 'wait_time' | 'facility' | 'staff';

export interface EndorsementResponse {
  id: string;
  endorsement_oid: string;
  doctor_oid: string;
  response_text: string;
  response_text_ar?: string;
  created_at: Date;
}

export type ShiftType = 'day_to_night' | 'night_to_day' | 'weekday_to_weekend' | 'vacation_coverage' | 'emergency';
export type HandoverStatus = 'pending' | 'in_progress' | 'completed' | 'acknowledged';

export interface HandoverSession {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.healthcare.handovers.{id}
  from_doctor_oid: string;
  to_doctor_oid: string;
  shift_type: ShiftType;
  handover_time: Date;
  voice_brief_url?: string;
  voice_brief_transcript?: string;
  critical_patients: CriticalPatientInfo[];
  pending_tasks?: HandoverTaskInfo[];
  urgent_items?: UrgentItem[];
  status: HandoverStatus;
  acknowledged_by_did?: string;
  acknowledged_at?: Date;
  completion_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CriticalPatientInfo {
  patient_oid: string;
  patient_name: string;
  condition: string;
  critical_details: string;
  required_actions: string[];
  last_update?: Date;
}

export interface HandoverTaskInfo {
  task_id: string;
  patient_oid: string;
  description: string;
  priority: 'routine' | 'important' | 'urgent' | 'critical';
  due_time?: Date;
}

export interface UrgentItem {
  type: 'test_result' | 'medication_change' | 'family_communication' | 'procedure_scheduled' | 'other';
  patient_oid: string;
  description: string;
  action_required: string;
  deadline?: Date;
}

export type HandoverTaskPriority = 'routine' | 'important' | 'urgent' | 'critical';

export interface HandoverTask {
  id: string;
  handover_oid: string;
  patient_oid: string;
  task_description: string;
  task_description_ar?: string;
  priority: HandoverTaskPriority;
  due_time?: Date;
  completed: boolean;
  completed_at?: Date;
  completion_notes?: string;
  created_at: Date;
}

export type AnalyticsTrend = 'improving' | 'stable' | 'declining';

export interface EndorsementAnalytics {
  id: string;
  doctor_oid: string;
  period_start: Date;
  period_end: Date;
  total_endorsements: number;
  average_rating?: number;
  rating_distribution: Record<number, number>; // {1: count, 2: count, ...}
  category_scores: Record<EndorsementCategory, number>;
  sentiment_analysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_keywords: Array<{ keyword: string; count: number }>;
  trend?: AnalyticsTrend;
  percentile_rank?: number; // Among peers
  created_at: Date;
}

// =============================================
// SECTION 7: DID/OID INTEGRATION
// =============================================

export type EntityType = 'doctor' | 'patient' | 'facility' | 'device' | 'organization' | 'service';
export type AccessLevel = 'public' | 'standard' | 'restricted' | 'confidential';
export type MappingStatus = 'active' | 'suspended' | 'revoked';

export interface DIDOIDMapping {
  id: string;
  did: string;
  oid: string;
  entity_type: EntityType;
  access_level: AccessLevel;
  permissions?: Permissions;
  metadata?: Record<string, any>;
  status: MappingStatus;
  created_at: Date;
  updated_at: Date;
  revoked_at?: Date;
  revocation_reason?: string;
}

export interface Permissions {
  read: string[]; // Array of resource types
  write: string[]; // Array of resource types
  admin: string[]; // Array of resource types
  delegate?: string[]; // DIDs that can act on behalf
}

export type AuditActionType = 'create' | 'read' | 'update' | 'delete' | 'sign' | 'verify' | 'access_grant' | 'access_revoke' | 'export' | 'print';

export interface AuditTrail {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.audit.{id}
  actor_did?: string;
  actor_oid?: string;
  action_type: AuditActionType;
  resource_type: string;
  resource_oid: string;
  resource_snapshot?: ResourceSnapshot;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  session_id?: string;
  success: boolean;
  error_message?: string;
  compliance_flags?: ComplianceFlags;
  created_at: Date;
}

export interface ResourceSnapshot {
  before?: Record<string, any>;
  after?: Record<string, any>;
  changes?: Array<{ field: string; old_value: any; new_value: any }>;
}

export interface ComplianceFlags {
  hipaa_applicable: boolean;
  nphies_applicable: boolean;
  gdpr_applicable: boolean;
  phi_accessed: boolean; // Protected Health Information
  consent_verified: boolean;
}

export type DeviceType = 'vital_monitor' | 'esp32_qr' | 'tablet' | 'workstation' | 'iot_sensor' | 'medical_equipment';
export type DeviceStatus = 'active' | 'inactive' | 'maintenance' | 'decommissioned';

export interface DeviceRegistry {
  id: string;
  oid: string; // 1.3.6.1.4.1.61026.devices.{id}
  device_type: DeviceType;
  device_name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  firmware_version?: string;
  facility_oid?: string;
  assigned_doctor_oid?: string;
  public_key?: string;
  certificate_oid?: string; // X.509 certificate
  ip_address?: string;
  mac_address?: string;
  last_heartbeat?: Date;
  status: DeviceStatus;
  calibration_due_date?: Date;
  compliance_certifications?: ComplianceCertification[];
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceCertification {
  type: 'FDA' | 'CE' | 'ISO' | 'SFDA' | 'other';
  certification_number: string;
  issued_date: string;
  expiry_date?: string;
  issuer: string;
}

// =============================================
// SECTION 8: PROVENANCE & FHIR
// =============================================

export type CreationMethod = 'manual' | 'voice' | 'ai_generated' | 'imported' | 'device_capture' | 'api';
export type ValidationStatus = 'pending' | 'validated' | 'flagged' | 'rejected';

export interface DataProvenance {
  id: string;
  resource_oid: string;
  resource_type: string;
  fhir_resource_type?: string;
  created_by_did?: string;
  created_by_oid?: string;
  creation_method: CreationMethod;
  source_system?: string;
  source_system_oid?: string;
  parent_resource_oid?: string;
  transformation_applied?: Transformation[];
  data_quality_score?: number; // 0-1
  validation_status?: ValidationStatus;
  validated_by_did?: string;
  validated_at?: Date;
  created_at: Date;
}

export interface Transformation {
  type: 'normalization' | 'validation' | 'enrichment' | 'translation' | 'format_conversion';
  description: string;
  applied_at: Date;
  applied_by?: string;
  parameters?: Record<string, any>;
}

// =============================================
// SECTION 9: API REQUEST/RESPONSE TYPES
// =============================================

export interface CreateDoctorRequest {
  name: string;
  name_ar?: string;
  email: string;
  phone?: string;
  specialty: string;
  specialty_ar?: string;
  license_number: string;
  license_issuer?: string;
  license_expiry?: string;
  languages?: string[];
  bio?: string;
  bio_ar?: string;
}

export interface CreatePatientRequest {
  name: string;
  name_ar?: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  email?: string;
  language_preference?: LanguagePreference;
  national_id?: string;
}

export interface CreateAppointmentRequest {
  patient_oid: string;
  doctor_oid: string;
  facility_oid: string;
  appointment_type: AppointmentType;
  scheduled_start: string;
  scheduled_end: string;
  chief_complaint?: string;
  chief_complaint_ar?: string;
  booking_source: BookingSource;
  language?: AppointmentLanguage;
}

export interface VoiceTriageRequest {
  patient_oid: string;
  language: TriageLanguage;
  audio_url: string;
  transcript: string;
  chief_complaint: string;
}

export interface CreateEndorsementRequest {
  patient_oid: string;
  doctor_oid: string;
  appointment_oid?: string;
  rating: number;
  feedback_text?: string;
  feedback_voice_url?: string;
  language: 'en' | 'ar';
  categories?: EndorsementCategory[];
  consent_for_display: boolean;
}

export interface CreateHandoverRequest {
  from_doctor_oid: string;
  to_doctor_oid: string;
  shift_type: ShiftType;
  handover_time: string;
  critical_patients: CriticalPatientInfo[];
  pending_tasks?: HandoverTaskInfo[];
  urgent_items?: UrgentItem[];
}

// =============================================
// SECTION 10: AI ORCHESTRATION TYPES
// =============================================

export type AIServiceType = 'patient_triage' | 'patient_insights' | 'patient_engagement' | 'doctor_decision_support' | 'doctor_documentation' | 'admin_scheduling' | 'admin_resource_optimization' | 'analytics';

export interface AIOrchestrationRequest {
  service_type: AIServiceType;
  context: AIContext;
  parameters?: Record<string, any>;
}

export interface AIContext {
  patient_oid?: string;
  doctor_oid?: string;
  appointment_oid?: string;
  facility_oid?: string;
  language?: 'en' | 'ar';
  user_preferences?: Record<string, any>;
}

export interface AIOrchestrationResponse {
  service_type: AIServiceType;
  result: any;
  confidence: number;
  reasoning?: string;
  recommendations?: string[];
  actions_taken?: AIAction[];
  metadata?: Record<string, any>;
}

export interface AIAction {
  action_type: string;
  target_resource?: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
}

// FHIR Resource Mapping Types
export interface FHIRResourceMapping {
  resource_type: string; // 'Patient', 'Practitioner', 'Appointment', etc.
  oid: string;
  fhir_id?: string;
  fhir_resource: any; // FHIR R4 resource structure
  last_synced?: Date;
  sync_status: 'pending' | 'synced' | 'failed';
  sync_errors?: string[];
}

export default {
  // Export all types for external use
};
