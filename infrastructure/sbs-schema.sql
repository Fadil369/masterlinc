-- SBS Claims Management Schema (Cloudflare D1)

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  claim_id TEXT PRIMARY KEY,
  patient_oid TEXT NOT NULL,
  provider_oid TEXT NOT NULL,
  facility_oid TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  nphies_id TEXT,
  rejection_reason TEXT,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services linked to claims
CREATE TABLE IF NOT EXISTS claim_services (
  service_id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  provider_id TEXT NOT NULL,
  service_date DATETIME NOT NULL,
  FOREIGN KEY (claim_id) REFERENCES claims(claim_id) ON DELETE CASCADE
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'SAR',
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES claims(claim_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_oid);
CREATE INDEX IF NOT EXISTS idx_claims_nphies ON claims(nphies_id);
CREATE INDEX IF NOT EXISTS idx_services_claim ON claim_services(claim_id);
