-- Phase 1 Services Database Schema
-- FHIR Server, Payment Gateway, and Audit Logger

-- ============================================
-- FHIR SERVER SCHEMA
-- ============================================

-- FHIR Patients table
CREATE TABLE IF NOT EXISTS fhir_patients (
  id TEXT PRIMARY KEY,
  resource JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fhir_patients_identifier ON fhir_patients 
  USING gin ((resource->'identifier'));
CREATE INDEX IF NOT EXISTS idx_fhir_patients_name ON fhir_patients 
  USING gin ((resource->'name'));
CREATE INDEX IF NOT EXISTS idx_fhir_patients_birthdate ON fhir_patients 
  ((resource->>'birthDate'));

-- FHIR Encounters table
CREATE TABLE IF NOT EXISTS fhir_encounters (
  id TEXT PRIMARY KEY,
  resource JSONB NOT NULL,
  patient_reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fhir_encounters_patient ON fhir_encounters (patient_reference);
CREATE INDEX IF NOT EXISTS idx_fhir_encounters_status ON fhir_encounters 
  ((resource->>'status'));

-- FHIR Observations table
CREATE TABLE IF NOT EXISTS fhir_observations (
  id TEXT PRIMARY KEY,
  resource JSONB NOT NULL,
  patient_reference TEXT,
  encounter_reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fhir_observations_patient ON fhir_observations (patient_reference);
CREATE INDEX IF NOT EXISTS idx_fhir_observations_encounter ON fhir_observations (encounter_reference);

-- ============================================
-- PAYMENT GATEWAY SCHEMA
-- ============================================

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_intent_id TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  doctor_id TEXT,
  appointment_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'sar',
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments (patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments (created_at);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  refund_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_intent_id) REFERENCES payments(payment_intent_id)
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds (payment_intent_id);

-- ============================================
-- AUDIT LOGGER SCHEMA
-- ============================================

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id TEXT NOT NULL,
  user_role VARCHAR(50),
  resource_type VARCHAR(100),
  resource_id TEXT,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at);

-- Audit log retention policy (optional - keep 7 years for HIPAA compliance)
CREATE TABLE IF NOT EXISTS audit_log_archive (
  LIKE audit_logs INCLUDING ALL
);

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void AS $$
BEGIN
  INSERT INTO audit_log_archive
  SELECT * FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '7 years';
  
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '7 years';
END;
$$ LANGUAGE plpgsql;
