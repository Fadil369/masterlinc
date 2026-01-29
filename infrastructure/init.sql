-- MasterLinc Production Database Schema
-- Version: 2.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Claims table (SBS embedded mode)
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id VARCHAR(100) UNIQUE NOT NULL,
    patient_oid VARCHAR(255) NOT NULL,
    provider_oid VARCHAR(255) NOT NULL,
    facility_oid VARCHAR(255) NOT NULL,
    diagnosis_code VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(12, 2) DEFAULT 0,
    nphies_id VARCHAR(100),
    nphies_response JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Claim services table
CREATE TABLE IF NOT EXISTS claim_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id VARCHAR(100) REFERENCES claims(claim_id) ON DELETE CASCADE,
    service_code VARCHAR(50) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    steps JSONB DEFAULT '[]',
    current_step INTEGER DEFAULT 0,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Service registry table
CREATE TABLE IF NOT EXISTS service_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'unknown',
    health_endpoint VARCHAR(255) DEFAULT '/health',
    last_health_check TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table (for event sourcing / audit)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_oid);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created ON claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_services_claim ON claim_services(claim_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_correlation ON events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

-- Insert default services
INSERT INTO service_registry (service_id, name, url, status, metadata) VALUES
    ('orthanc-pacs', 'Orthanc PACS', 'http://orthanc:8042', 'registered', '{"type": "pacs", "version": "24.1.0"}'),
    ('ohif-viewer', 'OHIF Viewer', 'http://ohif:3000', 'registered', '{"type": "viewer", "version": "3.8"}'),
    ('radiolinc-ai', 'RadioLinc AI', 'http://radiolinc:5000', 'registered', '{"type": "ai", "models": ["neuro", "chest", "msk"]}'),
    ('basma-voice', 'Basma Voice', 'http://basma:8080', 'registered', '{"type": "voice", "provider": "3cx"}'),
    ('sbs-claims', 'SBS Claims', 'embedded', 'active', '{"type": "claims", "mode": "embedded"}')
ON CONFLICT (service_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO masterlinc;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO masterlinc;
