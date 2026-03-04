-- BrainSAIT Gateway — D1 Schema
-- Run: wrangler d1 execute brainsait-gateway --file=src/db/schema.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit Logs (immutable event trail for all API activity)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ts          INTEGER NOT NULL DEFAULT (unixepoch('now', 'subsec') * 1000),
  actor_id    TEXT,
  actor_role  TEXT,
  action      TEXT    NOT NULL,
  resource    TEXT,
  resource_id TEXT,
  service     TEXT,          -- masterlinc | sbs | iris | rag | gateway
  http_status INTEGER,
  latency_ms  INTEGER,
  ip          TEXT,
  user_agent  TEXT,
  metadata    TEXT           -- JSON blob
);
CREATE INDEX IF NOT EXISTS idx_audit_ts      ON audit_logs (ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_service ON audit_logs (service, ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_logs (actor_id, ts DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Sessions (edge JWT sessions — fast lookup without decoding)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'user',
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
  ip          TEXT,
  revoked     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Analytics (hourly aggregated metrics per service)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_hourly (
  hour        TEXT    NOT NULL,   -- ISO-8601 hour: "2026-03-04T06"
  service     TEXT    NOT NULL,
  requests    INTEGER NOT NULL DEFAULT 0,
  errors      INTEGER NOT NULL DEFAULT 0,
  p50_ms      REAL,
  p95_ms      REAL,
  p99_ms      REAL,
  PRIMARY KEY (hour, service)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Medical File Registry (R2 object metadata)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_registry (
  id           TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  r2_key       TEXT    NOT NULL UNIQUE,
  filename     TEXT    NOT NULL,
  mime_type    TEXT    NOT NULL DEFAULT 'application/octet-stream',
  size_bytes   INTEGER NOT NULL DEFAULT 0,
  patient_id   TEXT,
  study_id     TEXT,
  file_type    TEXT,          -- dicom | pdf | report | image | other
  uploaded_by  TEXT,
  uploaded_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  iris_ref     TEXT,          -- IRIS FHIR resource reference (e.g. DocumentReference/abc)
  tags         TEXT           -- JSON array of tags
);
CREATE INDEX IF NOT EXISTS idx_files_patient ON file_registry (patient_id);
CREATE INDEX IF NOT EXISTS idx_files_study   ON file_registry (study_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RAG Index Status (track what's been indexed from IRIS)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_index_runs (
  id              TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  started_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  finished_at     INTEGER,
  status          TEXT    NOT NULL DEFAULT 'running', -- running | done | failed
  total_resources INTEGER NOT NULL DEFAULT 0,
  indexed         INTEGER NOT NULL DEFAULT 0,
  errors          INTEGER NOT NULL DEFAULT 0,
  resource_counts TEXT    -- JSON: {"Patient": 42, "Condition": 120, ...}
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Gateway Config (runtime key-value config overrides)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gateway_config (
  key         TEXT    PRIMARY KEY,
  value       TEXT    NOT NULL,
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_by  TEXT
);

-- Seed defaults
INSERT OR IGNORE INTO gateway_config (key, value) VALUES
  ('iris_enabled',        'true'),
  ('rag_enabled',         'true'),
  ('rate_limit_rps',      '60'),
  ('maintenance_mode',    'false');
