-- ===============================================
-- BASMA AI SECRETARY - DATABASE SCHEMA
-- Cloudflare D1 (SQLite) - HIPAA Compliant
-- ===============================================

-- USERS TABLE (Staff/Admins)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'agent', 'neural', 'medical', 'brainsait')),
  phone TEXT,
  avatar_url TEXT,
  settings TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login INTEGER
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- VISITORS TABLE (Customers/Leads)
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  title TEXT,
  source TEXT NOT NULL, -- 'phone_call', 'whatsapp', 'web_chat', 'widget', 'manual'
  language TEXT DEFAULT 'en', -- 'en', 'ar', 'mixed'
  country TEXT,
  timezone TEXT,
  first_contact INTEGER NOT NULL,
  last_contact INTEGER NOT NULL,
  total_interactions INTEGER DEFAULT 1,
  lead_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  tags TEXT, -- JSON array
  metadata TEXT, -- JSON (custom fields)
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_visitors_phone ON visitors(phone);
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visitors_user_id ON visitors(user_id);
CREATE INDEX idx_visitors_status ON visitors(status);
CREATE INDEX idx_visitors_lead_score ON visitors(lead_score DESC);

-- APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  visitor_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('demo', 'consultation', 'technical', 'partnership', 'support', 'other')),
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  meeting_link TEXT,
  location TEXT,
  attendees TEXT, -- JSON array
  reminders_sent TEXT, -- JSON array of timestamps
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_visitor_id ON appointments(visitor_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- CALL LOGS TABLE (HIPAA Compliant)
CREATE TABLE IF NOT EXISTS call_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  visitor_id TEXT,
  call_type TEXT NOT NULL CHECK(call_type IN ('inbound', 'outbound', 'internal')),
  direction TEXT NOT NULL CHECK(direction IN ('incoming', 'outgoing')),
  from_number TEXT,
  to_number TEXT,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('completed', 'missed', 'busy', 'failed', 'voicemail')),
  language TEXT,
  summary TEXT,
  sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  transcript_url TEXT, -- R2 bucket reference
  recording_url TEXT, -- R2 bucket reference (encrypted)
  action_items TEXT, -- JSON array
  category TEXT, -- 'appointment', 'inquiry', 'support', 'partnership'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX idx_call_logs_visitor_id ON call_logs(visitor_id);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX idx_call_logs_status ON call_logs(status);

-- MESSAGES TABLE (WhatsApp, SMS, Email, Web Chat)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  visitor_id TEXT,
  user_id TEXT,
  channel TEXT NOT NULL CHECK(channel IN ('whatsapp', 'sms', 'email', 'web_chat', 'widget')),
  direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  media_urls TEXT, -- JSON array
  status TEXT NOT NULL CHECK(status IN ('sent', 'delivered', 'read', 'failed')),
  language TEXT,
  metadata TEXT, -- JSON (channel-specific data)
  created_at INTEGER NOT NULL,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_visitor_id ON messages(visitor_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_channel ON messages(channel);

-- CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  user_id TEXT,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed', 'archived')),
  last_message_at INTEGER NOT NULL,
  unread_count INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_conversations_visitor_id ON conversations(visitor_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('calendly', 'google_calendar', 'outlook', 'salesforce', 'hubspot', 'twilio', 'whatsapp', 'slack', 'zapier', 'webhook')),
  name TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON (encrypted credentials)
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'error')),
  last_sync INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(type);

-- AUDIT LOGS TABLE (Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  changes TEXT, -- JSON (before/after)
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- VISITOR SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS visitor_segments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions TEXT NOT NULL, -- JSON (filter rules)
  color TEXT,
  icon TEXT,
  visitor_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_visitor_segments_user_id ON visitor_segments(user_id);

-- ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  visitor_id TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  properties TEXT, -- JSON
  session_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_visitor_id ON analytics_events(visitor_id);
