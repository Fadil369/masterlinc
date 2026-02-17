-- Phase 2 Services Database Schema
-- E-Prescription, Telehealth, Lab Interface, Pharmacy

-- ============================================
-- E-PRESCRIPTION SCHEMA
-- ============================================

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  prescription_number VARCHAR(100) UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_oid TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_license_number VARCHAR(100) NOT NULL,
  facility_id TEXT NOT NULL,
  facility_name VARCHAR(255) NOT NULL,
  medications JSONB NOT NULL,
  diagnosis TEXT NOT NULL,
  diagnosis_code VARCHAR(50),
  notes TEXT,
  status VARCHAR(50) NOT NULL,
  issue_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  qr_code TEXT,
  digital_signature TEXT NOT NULL,
  sfda_reference_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions (doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions (status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions (prescription_number);

-- Prescription dispensing records
CREATE TABLE IF NOT EXISTS prescription_dispensing (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL,
  pharmacy_id TEXT NOT NULL,
  pharmacist_id TEXT NOT NULL,
  dispensed_medications JSONB NOT NULL,
  dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_dispensing_prescription ON prescription_dispensing (prescription_id);

-- Prescription cancellations
CREATE TABLE IF NOT EXISTS prescription_cancellations (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL,
  doctor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
);

-- ============================================
-- TELEHEALTH SCHEMA
-- ============================================

-- Telehealth sessions
CREATE TABLE IF NOT EXISTS telehealth_sessions (
  id SERIAL PRIMARY KEY,
  appointment_id TEXT,
  patient_id TEXT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  room_name VARCHAR(255) UNIQUE NOT NULL,
  twilio_room_sid VARCHAR(255),
  scheduled_time TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  notes TEXT,
  diagnosis TEXT,
  prescription_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_telehealth_patient ON telehealth_sessions (patient_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_doctor ON telehealth_sessions (doctor_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_status ON telehealth_sessions (status);
CREATE INDEX IF NOT EXISTS idx_telehealth_scheduled ON telehealth_sessions (scheduled_time);

-- Telehealth chat messages
CREATE TABLE IF NOT EXISTS telehealth_chat (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  sender VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES telehealth_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON telehealth_chat (session_id);

-- ============================================
-- LAB INTERFACE SCHEMA
-- ============================================

-- Lab orders
CREATE TABLE IF NOT EXISTS lab_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  lab_facility_id TEXT NOT NULL,
  tests JSONB NOT NULL,
  priority VARCHAR(50) DEFAULT 'routine',
  status VARCHAR(50) NOT NULL,
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  collected_at TIMESTAMP,
  completed_at TIMESTAMP,
  hl7_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders (patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders (status);

-- Lab results
CREATE TABLE IF NOT EXISTS lab_results (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  test_code VARCHAR(50) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  result_value TEXT,
  unit VARCHAR(50),
  reference_range VARCHAR(100),
  abnormal_flag VARCHAR(10),
  status VARCHAR(50) NOT NULL,
  performed_at TIMESTAMP,
  verified_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES lab_orders(id)
);

CREATE INDEX IF NOT EXISTS idx_lab_results_order ON lab_results (order_id);

-- ============================================
-- PHARMACY SCHEMA
-- ============================================

-- Pharmacy inventory
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id SERIAL PRIMARY KEY,
  pharmacy_id TEXT NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  sfda_code VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL,
  batch_number VARCHAR(100),
  expiry_date DATE,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON pharmacy_inventory (pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medication ON pharmacy_inventory (medication_name);

-- Pharmacy dispensing log
CREATE TABLE IF NOT EXISTS pharmacy_dispensing_log (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL,
  pharmacy_id TEXT NOT NULL,
  pharmacist_id TEXT NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  batch_number VARCHAR(100),
  dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_dispensing_log_prescription ON pharmacy_dispensing_log (prescription_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_log_pharmacy ON pharmacy_dispensing_log (pharmacy_id);
