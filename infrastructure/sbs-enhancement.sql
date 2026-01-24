-- Enhanced SBS Schema Update
-- Adding support for Diagnosis, Bundles, and Scenarios

-- Add Columns to Claims
ALTER TABLE claims ADD COLUMN diagnosis_code TEXT;
ALTER TABLE claims ADD COLUMN normalization_confidence DECIMAL(5, 4); -- 0.0000 to 1.0000
ALTER TABLE claims ADD COLUMN scenario TEXT;
ALTER TABLE claims ADD COLUMN digital_signature TEXT;

-- Bundles Table
CREATE TABLE IF NOT EXISTS bundles (
  bundle_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  services_json TEXT NOT NULL, -- JSON array of codes
  price DECIMAL(10, 2) NOT NULL,
  savings DECIMAL(10, 2) NOT NULL
);

-- Seed Bundles
INSERT OR IGNORE INTO bundles (bundle_id, name, services_json, price, savings) 
VALUES ('BUNDLE-CHECKUP-001', 'Basic Health Checkup', '["SBS-CONS-001", "SBS-LAB-001", "SBS-LAB-002"]', 280.00, 50.00);

INSERT OR IGNORE INTO bundles (bundle_id, name, services_json, price, savings) 
VALUES ('BUNDLE-APPEND-001', 'Appendectomy Package', '["SBS-SURG-001", "SBS-ADMIT-001", "SBS-LAB-001"]', 5500.00, 350.00);
