-- Open Arms Database Schema
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/qvxnjosedctfzyhorwhc/sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safehouses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  city TEXT,
  capacity INT,
  status TEXT DEFAULT 'active',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_person TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS residents (
  id SERIAL PRIMARY KEY,
  case_code TEXT UNIQUE NOT NULL,
  safehouse_id INT REFERENCES safehouses(id),
  age INT,
  admission_date TEXT,
  status TEXT DEFAULT 'active',
  risk_level TEXT,
  case_category TEXT,
  referral_source TEXT,
  reintegration_progress INT DEFAULT 0,
  notes TEXT,
  nationality TEXT,
  disability_info TEXT,
  family_background TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS process_recordings (
  id SERIAL PRIMARY KEY,
  resident_id INT REFERENCES residents(id) ON DELETE CASCADE,
  session_date TEXT,
  counselor_name TEXT,
  session_type TEXT,
  emotional_state TEXT,
  notes TEXT,
  follow_up_actions TEXT,
  interventions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitations (
  id SERIAL PRIMARY KEY,
  resident_id INT REFERENCES residents(id) ON DELETE CASCADE,
  visit_date TEXT,
  visit_type TEXT,
  visitor_name TEXT,
  home_environment TEXT,
  family_cooperation TEXT,
  safety_concerns TEXT,
  follow_up_actions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_records (
  id SERIAL PRIMARY KEY,
  resident_id INT REFERENCES residents(id) ON DELETE CASCADE,
  check_date TEXT,
  condition TEXT,
  treatment TEXT,
  medical_provider TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS education_records (
  id SERIAL PRIMARY KEY,
  resident_id INT REFERENCES residents(id) ON DELETE CASCADE,
  program_type TEXT,
  institution_name TEXT,
  enrollment_date TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interventions (
  id SERIAL PRIMARY KEY,
  resident_id INT REFERENCES residents(id) ON DELETE CASCADE,
  intervention_type TEXT,
  intervention_date TEXT,
  provider TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supporters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT,
  country TEXT,
  city TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  supporter_id INT REFERENCES supporters(id),
  amount NUMERIC,
  currency TEXT DEFAULT 'IDR',
  donation_type TEXT,
  campaign TEXT,
  channel TEXT,
  donated_at TEXT,
  receipt_issued BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  country TEXT,
  contact_person TEXT,
  contact_email TEXT,
  website TEXT,
  active_status BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  resident_id INT REFERENCES residents(id),
  safehouse_id INT REFERENCES safehouses(id),
  incident_date TEXT,
  incident_type TEXT,
  severity TEXT,
  description TEXT,
  action_taken TEXT,
  reported_by TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_media_posts (
  id SERIAL PRIMARY KEY,
  platform TEXT,
  post_date TEXT,
  content_type TEXT,
  caption TEXT,
  reach INT,
  likes INT,
  shares INT,
  donations_linked INT,
  donation_amount_linked NUMERIC,
  campaign_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin user (password: Admin@2024!)
INSERT INTO users (username, password_hash, display_name, email, role)
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYppOoS.wKbKGXi', 'System Administrator', 'admin@openarms.org', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Seed safehouses
INSERT INTO safehouses (name, region, city, capacity, status, latitude, longitude, contact_person, contact_phone) VALUES
  ('Rumah Harapan Jakarta', 'DKI Jakarta', 'Jakarta Selatan', 25, 'active', -6.2608, 106.7816, 'Ibu Dewi Rahayu', '+62-21-555-0101'),
  ('Shelter Bali Kasih', 'Bali', 'Denpasar', 15, 'active', -8.6705, 115.2126, 'Ibu Made Ariani', '+62-361-555-0102'),
  ('Rumah Pemulihan Surabaya', 'Jawa Timur', 'Surabaya', 20, 'active', -7.2575, 112.7521, 'Bapak Hendra Kurnia', '+62-31-555-0103'),
  ('Shelter Kasih Bandung', 'Jawa Barat', 'Bandung', 18, 'active', -6.9175, 107.6191, 'Ibu Rina Susanti', '+62-22-555-0104'),
  ('Rumah Aman Medan', 'Sumatera Utara', 'Medan', 22, 'active', 3.5952, 98.6722, 'Ibu Siti Nurhaliza', '+62-61-555-0105'),
  ('Shelter Berkat Makassar', 'Sulawesi Selatan', 'Makassar', 12, 'active', -5.1477, 119.4327, 'Bapak Yusuf Rahman', '+62-411-555-0106')
ON CONFLICT DO NOTHING;
