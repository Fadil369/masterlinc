-- ===============================================
-- BrainSAIT Enterprise Healthcare Platform - Complete Database Schema
-- PostgreSQL 16 - HIPAA/PDPL/NPHIES Compliant
-- Full OID+DID+AI Integration
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- DOCTORS TABLE (Enhanced with DID/OID)
-- ===============================================
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    did VARCHAR(255) UNIQUE NOT NULL, -- did:brainsait:doctors:dr-12345
    did_document JSONB NOT NULL,
    oid_identifier VARCHAR(255) UNIQUE, -- 1.3.6.1.4.1.61026.2.1.1.dr-12345
    public_key_multibase VARCHAR(255),
    private_key_encrypted TEXT, -- Encrypted with KMS
    key_pair_metadata JSONB,
    verified_credentials JSONB, -- Array of verifiable credentials
    blockchain_anchor_tx VARCHAR(255), -- Transaction ID if anchored
    did_status VARCHAR(20) DEFAULT 'active' CHECK (did_status IN ('active', 'suspended', 'revoked')),
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    region VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_did ON doctors(did);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);

-- ===============================================
-- DOCTOR VERIFIABLE CREDENTIALS
-- ===============================================
CREATE TABLE IF NOT EXISTS doctor_verifiable_credentials (
    vc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_did VARCHAR(255) REFERENCES doctors(did),
    vc_type VARCHAR(100) NOT NULL, -- 'medical_license', 'board_certification', etc.
    issuer_did VARCHAR(255) NOT NULL,
    issuer_name VARCHAR(255),
    credential_data JSONB NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    proof JSONB, -- Cryptographic proof
    blockchain_anchor_tx VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vc_doctor_did ON doctor_verifiable_credentials(doctor_did);
CREATE INDEX IF NOT EXISTS idx_vc_status ON doctor_verifiable_credentials(status);

-- ===============================================
-- TRIAGE TABLE (Emergency Assessment)
-- ===============================================
CREATE TABLE IF NOT EXISTS triage (
    triage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    appointment_id UUID,
    oid_identifier VARCHAR(255),
    chief_complaint TEXT NOT NULL,
    symptoms JSONB, -- Array of symptoms
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    emergency_flag BOOLEAN DEFAULT false,
    triage_score INTEGER, -- AI-calculated score
    ai_recommendations JSONB,
    voice_transcript TEXT, -- Original voice input
    language VARCHAR(10) DEFAULT 'en',
    triaged_by_service_oid VARCHAR(255),
    triaged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_triage_patient ON triage(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_severity ON triage(severity);
CREATE INDEX IF NOT EXISTS idx_triage_emergency ON triage(emergency_flag);

-- ===============================================
-- VITALS TABLE (Voice/BLE Capture)
-- ===============================================
CREATE TABLE IF NOT EXISTS vitals (
    vital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    appointment_id UUID,
    oid_identifier VARCHAR(255),
    temperature DECIMAL(4,1), -- Celsius
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation INTEGER,
    weight DECIMAL(5,2), -- kg
    height DECIMAL(5,2), -- cm
    bmi DECIMAL(4,2),
    capture_method VARCHAR(20) CHECK (capture_method IN ('voice', 'ble', 'manual', 'iot')),
    device_oid VARCHAR(255), -- OID of IoT device if used
    voice_transcript TEXT,
    metadata JSONB,
    recorded_by_service_oid VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_appointment ON vitals(appointment_id);

-- ===============================================
-- CLINICAL HISTORY TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS clinical_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    appointment_id UUID,
    oid_identifier VARCHAR(255),
    history_type VARCHAR(50) CHECK (history_type IN ('medical', 'surgical', 'family', 'social', 'medications', 'allergies')),
    description TEXT,
    structured_data JSONB, -- ICD codes, medication lists, etc.
    voice_transcript TEXT,
    language VARCHAR(10) DEFAULT 'en',
    recorded_by_doctor_did VARCHAR(255) REFERENCES doctors(did),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_patient ON clinical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_history_type ON clinical_history(history_type);

-- ===============================================
-- CLINICAL EXAM TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS clinical_exam (
    exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    appointment_id UUID,
    oid_identifier VARCHAR(255),
    exam_type VARCHAR(50) CHECK (exam_type IN ('physical', 'telehealth', 'laboratory', 'imaging')),
    findings JSONB, -- Structured exam data
    images BYTEA[], -- For telehealth images
    provider_notes TEXT,
    voice_transcript TEXT,
    language VARCHAR(10) DEFAULT 'en',
    recorded_by_doctor_did VARCHAR(255) REFERENCES doctors(did),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_patient ON clinical_exam(patient_id);
CREATE INDEX IF NOT EXISTS idx_exam_type ON clinical_exam(exam_type);

-- ===============================================
-- ASSESSMENT & PLAN TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS assessment_plan (
    ap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    appointment_id UUID,
    oid_identifier VARCHAR(255),
    differential_diagnosis JSONB, -- Array of diagnoses with probabilities
    primary_diagnosis VARCHAR(255),
    diagnosis_codes JSONB, -- ICD-10 codes
    treatment_plan JSONB, -- Medications, procedures, lifestyle changes
    orders JSONB, -- Labs, imaging, referrals
    follow_up_instructions TEXT,
    voice_transcript TEXT,
    language VARCHAR(10) DEFAULT 'en',
    provider_did VARCHAR(255) REFERENCES doctors(did),
    digital_signature TEXT, -- DID-based signature
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ap_patient ON assessment_plan(patient_id);
CREATE INDEX IF NOT EXISTS idx_ap_provider ON assessment_plan(provider_did);

-- ===============================================
-- CLINICAL DOCUMENTATION TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS clinical_documentation (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    appointment_id UUID,
    oid_identifier VARCHAR(255),
    document_type VARCHAR(50) CHECK (document_type IN ('progress_note', 'consultation', 'discharge_summary', 'procedure_note')),
    content TEXT,
    voice_transcript TEXT,
    language VARCHAR(10) DEFAULT 'en',
    structured_data JSONB, -- FHIR-compliant structure
    template_id UUID, -- Reference to template used
    author_did VARCHAR(255) REFERENCES doctors(did),
    digital_signature TEXT,
    blockchain_anchor_tx VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'amended', 'signed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_patient ON clinical_documentation(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_author ON clinical_documentation(author_did);
CREATE INDEX IF NOT EXISTS idx_doc_status ON clinical_documentation(status);

-- ===============================================
-- TEMPLATES TABLE (Condition/Visit/Specialty)
-- ===============================================
CREATE TABLE IF NOT EXISTS templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oid_identifier VARCHAR(255) UNIQUE,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) CHECK (template_type IN ('condition', 'visit', 'specialty', 'procedure')),
    specialty VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    content JSONB NOT NULL, -- Template structure with placeholders
    voice_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_by_did VARCHAR(255) REFERENCES doctors(did),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_specialty ON templates(specialty);

-- ===============================================
-- TASKS TABLE (Task Manager)
-- ===============================================
CREATE TABLE IF NOT EXISTS tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oid_identifier VARCHAR(255) UNIQUE,
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) CHECK (task_type IN ('clinical', 'administrative', 'follow_up', 'referral', 'lab_review')),
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    patient_id UUID REFERENCES patients(patient_id),
    assigned_to_did VARCHAR(255) REFERENCES doctors(did),
    created_by_did VARCHAR(255) REFERENCES doctors(did),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    automation_rules JSONB, -- Automation triggers
    provenance_chain JSONB, -- Full audit trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to_did);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- ===============================================
-- ENDORSEMENTS TABLE (Doctor Ratings/Reviews)
-- ===============================================
CREATE TABLE IF NOT EXISTS endorsements (
    endorsement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oid_identifier VARCHAR(255) UNIQUE,
    endorser_did VARCHAR(255) REFERENCES doctors(did),
    endorsed_did VARCHAR(255) REFERENCES doctors(did),
    endorsement_type VARCHAR(50) CHECK (endorsement_type IN ('clinical_excellence', 'teamwork', 'patient_care', 'teaching')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    voice_transcript TEXT,
    language VARCHAR(10) DEFAULT 'en',
    context JSONB, -- Patient encounter, procedure, etc.
    is_verified BOOLEAN DEFAULT false,
    digital_signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed ON endorsements(endorsed_did);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON endorsements(endorser_did);

-- ===============================================
-- HANDOVERS TABLE (Shift Transitions)
-- ===============================================
CREATE TABLE IF NOT EXISTS handovers (
    handover_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oid_identifier VARCHAR(255) UNIQUE,
    from_doctor_did VARCHAR(255) REFERENCES doctors(did),
    to_doctor_did VARCHAR(255) REFERENCES doctors(did),
    patient_id UUID REFERENCES patients(patient_id),
    handover_type VARCHAR(50) CHECK (handover_type IN ('shift_change', 'transfer', 'consultation', 'emergency')),
    clinical_summary TEXT,
    pending_tasks JSONB,
    critical_alerts JSONB,
    voice_transcript TEXT,
    language VARCHAR(10) DEFAULT 'en',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
    acknowledged_at TIMESTAMP,
    digital_signature_from TEXT,
    digital_signature_to TEXT,
    data_chain JSONB, -- Complete provenance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_handovers_from ON handovers(from_doctor_did);
CREATE INDEX IF NOT EXISTS idx_handovers_to ON handovers(to_doctor_did);
CREATE INDEX IF NOT EXISTS idx_handovers_status ON handovers(status);

-- ===============================================
-- ASSETS TABLE (IoT Device Registry)
-- ===============================================
CREATE TABLE IF NOT EXISTS assets (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oid_identifier VARCHAR(255) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) CHECK (asset_type IN ('medical_device', 'iot_sensor', 'scanner', 'monitor', 'equipment')),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'lost')),
    qr_code_data TEXT, -- QR code content
    metadata JSONB, -- Specs, calibration, etc.
    last_maintenance TIMESTAMP,
    next_maintenance TIMESTAMP,
    registered_by_service_oid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_oid ON assets(oid_identifier);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

-- ===============================================
-- DEVICE SCANS TABLE (QR Validation Logs)
-- ===============================================
CREATE TABLE IF NOT EXISTS device_scans (
    scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(asset_id),
    oid_scanned VARCHAR(255),
    scan_result VARCHAR(20) CHECK (scan_result IN ('valid', 'invalid', 'expired', 'error')),
    scanner_oid VARCHAR(255), -- OID of scanning device
    location VARCHAR(255),
    scanned_by VARCHAR(255), -- User/system identifier
    scan_metadata JSONB,
    anomaly_detected BOOLEAN DEFAULT false,
    anomaly_details TEXT,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scans_asset ON device_scans(asset_id);
CREATE INDEX IF NOT EXISTS idx_scans_result ON device_scans(scan_result);
CREATE INDEX IF NOT EXISTS idx_scans_anomaly ON device_scans(anomaly_detected);

-- ===============================================
-- AI INTERACTIONS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS ai_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oid_identifier VARCHAR(255),
    agent_type VARCHAR(50) CHECK (agent_type IN ('patient_coaching', 'clinical_reasoning', 'admin_ops', 'research_analytics', 'system_health')),
    user_type VARCHAR(20) CHECK (user_type IN ('patient', 'doctor', 'admin', 'researcher')),
    user_id UUID,
    user_did VARCHAR(255),
    input_text TEXT,
    output_text TEXT,
    context JSONB,
    confidence_score DECIMAL(3,2),
    language VARCHAR(10) DEFAULT 'en',
    session_id UUID,
    provenance_chain JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_type ON ai_interactions(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_user_type ON ai_interactions(user_type);
CREATE INDEX IF NOT EXISTS idx_ai_session ON ai_interactions(session_id);

-- ===============================================
-- CONSENT RECORDS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS consent_records (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    oid_identifier VARCHAR(255),
    consent_type VARCHAR(50) CHECK (consent_type IN ('treatment', 'data_sharing', 'research', 'telehealth', 'recording')),
    scope TEXT,
    granted BOOLEAN DEFAULT false,
    granted_at TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    consent_document JSONB,
    digital_signature TEXT,
    witness_did VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consent_patient ON consent_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_records(consent_type);

-- ===============================================
-- BLOCKCHAIN ANCHORS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS blockchain_anchors (
    anchor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR(50),
    data_id UUID,
    oid_identifier VARCHAR(255),
    hash VARCHAR(255) NOT NULL,
    blockchain_type VARCHAR(50) DEFAULT 'simulated', -- 'ethereum', 'hyperledger', 'simulated'
    transaction_id VARCHAR(255) UNIQUE,
    block_number BIGINT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    verification_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_blockchain_data ON blockchain_anchors(data_type, data_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx ON blockchain_anchors(transaction_id);

-- ===============================================
-- AUDIT TRAIL TABLE (Enhanced Compliance)
-- ===============================================
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    oid_identifier VARCHAR(255),
    actor_type VARCHAR(20) CHECK (actor_type IN ('patient', 'doctor', 'admin', 'service', 'ai_agent')),
    actor_id VARCHAR(255),
    actor_did VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    compliance_flags JSONB, -- HIPAA, PDPL, NPHIES markers
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_trail(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail(created_at);

-- ===============================================
-- TRIGGER: Update timestamps
-- ===============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_documentation_updated_at BEFORE UPDATE ON clinical_documentation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- SUMMARY
-- ===============================================
-- Total Tables: 20 (6 existing + 14 new)
-- 1. patients (existing)
-- 2. oid_registry (existing)
-- 3. did_registry (existing)
-- 4. did_oid_mapping (existing)
-- 5. appointments (existing)
-- 6. data_provenance (existing)
-- 7. doctors (NEW - DID/OID enabled)
-- 8. doctor_verifiable_credentials (NEW)
-- 9. triage (NEW - emergency assessment)
-- 10. vitals (NEW - voice/BLE capture)
-- 11. clinical_history (NEW)
-- 12. clinical_exam (NEW)
-- 13. assessment_plan (NEW)
-- 14. clinical_documentation (NEW - voice transcripts)
-- 15. templates (NEW - condition/visit/specialty)
-- 16. tasks (NEW - task manager)
-- 17. endorsements (NEW - doctor ratings)
-- 18. handovers (NEW - shift transitions)
-- 19. assets (NEW - IoT device registry)
-- 20. device_scans (NEW - QR validation)
-- 21. ai_interactions (NEW)
-- 22. consent_records (NEW)
-- 23. blockchain_anchors (NEW)
-- 24. audit_trail (NEW - enhanced compliance)
-- ===============================================
