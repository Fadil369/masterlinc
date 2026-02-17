-- ===============================================
-- BrainSAIT Healthcare Platform - Database Schema
-- PostgreSQL 16 - HIPAA Compliant
-- ===============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================
-- PATIENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id VARCHAR(20) UNIQUE,
    oid_identifier VARCHAR(255) UNIQUE,
    did_identifier VARCHAR(255) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    full_name_ar VARCHAR(100),
    dob DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    emergency_contact VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'en',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_by_service_oid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_oid ON patients(oid_identifier);
CREATE INDEX IF NOT EXISTS idx_patients_did ON patients(did_identifier);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);

-- ===============================================
-- OID REGISTRY TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS oid_registry (
    oid VARCHAR(255) PRIMARY KEY,
    oid_branch VARCHAR(100),
    service_name VARCHAR(255),
    service_type VARCHAR(50),
    description TEXT,
    pen_number INTEGER DEFAULT 61026,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oid_branch ON oid_registry(oid_branch);
CREATE INDEX IF NOT EXISTS idx_service_name ON oid_registry(service_name);
CREATE INDEX IF NOT EXISTS idx_service_type ON oid_registry(service_type);

-- ===============================================
-- DID REGISTRY TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS did_registry (
    did VARCHAR(255) PRIMARY KEY,
    did_document JSONB NOT NULL,
    oid_identifier VARCHAR(255),
    public_key_multibase VARCHAR(255),
    key_pair_metadata JSONB,
    did_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS did_oid_mapping (
    mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    did VARCHAR(255) REFERENCES did_registry(did),
    oid VARCHAR(255),
    mapping_type VARCHAR(50),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_did_status ON did_registry(status);
CREATE INDEX IF NOT EXISTS idx_did_type ON did_registry(did_type);
CREATE INDEX IF NOT EXISTS idx_oid_mapping ON did_oid_mapping(oid);

-- ===============================================
-- APPOINTMENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(patient_id),
    provider_id UUID,
    appointment_date TIMESTAMP,
    appointment_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled',
    triage_level VARCHAR(20),
    estimated_wait_time INTEGER,
    room_number VARCHAR(10),
    check_in_time TIMESTAMP,
    created_by_service_oid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ===============================================
-- DATA PROVENANCE TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS data_provenance (
    provenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR(50),
    data_id UUID,
    service_oid VARCHAR(255) REFERENCES oid_registry(oid),
    patient_oid VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operation VARCHAR(20),
    metadata JSONB,
    digital_signature VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_provenance_data_type ON data_provenance(data_type);
CREATE INDEX IF NOT EXISTS idx_provenance_service_oid ON data_provenance(service_oid);

-- ===============================================
-- SUMMARY
-- ===============================================
-- Tables created:
-- 1. patients - Patient demographic and registration data
-- 2. oid_registry - OID (Object Identifier) registry for services
-- 3. did_registry - DID (Decentralized Identifier) registry
-- 4. did_oid_mapping - Mapping between DIDs and OIDs
-- 5. appointments - Appointment scheduling and management
-- 6. data_provenance - Data lineage and audit trail
-- ===============================================
