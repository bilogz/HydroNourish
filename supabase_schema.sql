-- ====================================================================
-- HYDRO NOURISH — HERITAGE ANIMAL CLINIC SUPABASE POSTGRESQL SCHEMA
-- Full relational schema with RLS Policies & Initial Seed Data
-- Connection: postgresql://postgres.nibsyjmdyfdvvwttcnkx:JoecelGarcia#1@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
-- ====================================================================

-- 1. PET PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.pets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT NOT NULL,
    age NUMERIC NOT NULL,
    weight NUMERIC NOT NULL,
    sex TEXT DEFAULT 'Male',
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    owner_id TEXT,
    owner_email TEXT,
    clinic_ref TEXT NOT NULL,
    assigned_device_id TEXT,
    health_status TEXT DEFAULT 'Healthy',
    avatar_url TEXT,
    portion_grams NUMERIC DEFAULT 120,
    times_per_day INT DEFAULT 3,
    food_type TEXT DEFAULT 'Veterinary Dry Kibble',
    hydration_target INT DEFAULT 850,
    latest_temp NUMERIC DEFAULT 38.5,
    latest_heart_rate INT DEFAULT 85,
    latest_activity TEXT DEFAULT 'Normal',
    emergency_contact TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FEEDING SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.feeding_schedules (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    food_type TEXT DEFAULT 'Veterinary Dry Kibble',
    portion_grams NUMERIC NOT NULL,
    scheduled_time TEXT NOT NULL,
    dispense_status TEXT DEFAULT 'Pending',
    device_id TEXT NOT NULL,
    last_dispensed_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FEEDING LOGS TABLE
CREATE TABLE IF NOT EXISTS public.feeding_logs (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    portion_grams NUMERIC NOT NULL,
    dispensed_at TEXT NOT NULL,
    status TEXT DEFAULT 'Success',
    device_id TEXT NOT NULL,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HYDRATION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.hydration_logs (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    amount_ml NUMERIC NOT NULL,
    timestamp TEXT NOT NULL,
    reservoir_level_pct INT DEFAULT 100,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. VITAL SIGNS READINGS TABLE
CREATE TABLE IF NOT EXISTS public.vital_signs (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    temperature NUMERIC NOT NULL,
    heart_rate INT NOT NULL,
    weight NUMERIC NOT NULL,
    activity_mins INT NOT NULL,
    status TEXT DEFAULT 'Normal',
    timestamp TEXT NOT NULL,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. AI HEALTH ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_alerts (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    observed_reading TEXT NOT NULL,
    severity TEXT NOT NULL,
    ai_observation TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    review_status TEXT DEFAULT 'Unreviewed',
    timestamp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ESP32 HARDWARE DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.devices (
    id TEXT PRIMARY KEY,
    device_name TEXT DEFAULT 'HydroNourish Smart Unit',
    assigned_pet_id TEXT,
    assigned_pet_name TEXT,
    status TEXT DEFAULT 'Online',
    hardware_status TEXT DEFAULT 'vacant',
    wifi_signal_dbm INT DEFAULT -55,
    food_level_pct INT DEFAULT 85,
    water_level_pct INT DEFAULT 90,
    battery_pct INT DEFAULT 100,
    is_plugged_in BOOLEAN DEFAULT TRUE,
    last_transmission TEXT DEFAULT 'Just now',
    firmware_version TEXT DEFAULT 'v2.4.1-ESP32',
    mac_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CLINIC USERS & STAFF TABLE
CREATE TABLE IF NOT EXISTS public.clinic_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    last_active TEXT DEFAULT 'Just now',
    avatar_url TEXT,
    is_protected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. PET OWNERS TABLE
CREATE TABLE IF NOT EXISTS public.pet_owners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    access_status TEXT DEFAULT 'inactive',
    pet_ids JSONB DEFAULT '[]'::jsonb,
    current_session_id TEXT,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    password TEXT,
    address TEXT
);

-- 10. PET SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.pet_sessions (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    owner_id TEXT REFERENCES public.pet_owners(id) ON DELETE SET NULL,
    owner_name TEXT NOT NULL,
    device_id TEXT NOT NULL,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_release_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Active',
    admission_notes TEXT,
    release_notes TEXT,
    emergency_contact TEXT,
    admission_admin TEXT NOT NULL,
    release_admin TEXT,
    release_condition TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. CLINIC SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id INT PRIMARY KEY DEFAULT 1,
    clinic_name TEXT NOT NULL DEFAULT 'Heritage Animal Clinic',
    clinic_address TEXT DEFAULT '742 Evergreen Terrace, Medical District, Sector 4',
    clinic_phone TEXT DEFAULT '(555) 890-1234',
    license_id TEXT DEFAULT 'VET-LIC-2026-9817',
    default_portion_grams NUMERIC DEFAULT 100,
    default_hydration_ml_per_kg NUMERIC DEFAULT 50,
    temp_warning_min NUMERIC DEFAULT 37.5,
    temp_warning_max NUMERIC DEFAULT 39.2,
    hr_warning_min INT DEFAULT 60,
    hr_warning_max INT DEFAULT 140,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    browser_notifications BOOLEAN DEFAULT TRUE,
    theme TEXT DEFAULT 'clinic-blue',
    compact_layout BOOLEAN DEFAULT FALSE,
    api_endpoint TEXT DEFAULT 'https://api.heritageanimalclinic.org/v1/hydronourish',
    api_secret_key TEXT DEFAULT 'hn_live_sk_89327498173491874',
    webhook_url TEXT DEFAULT 'https://api.heritageanimalclinic.org/webhooks/esp32-telemetry',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. CONTACT INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    replied_at TIMESTAMP WITH TIME ZONE,
    reply_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY AND CREATE PUBLIC PERMISSIVE POLICIES
-- ====================================================================

DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_allow_all', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl || '_allow_all', tbl);
    END LOOP;
END $$;

-- ====================================================================
-- SCHEMA UPDATES FOR EXISTING TABLES (IDEMPOTENT COLUMN ADDITIONS)
-- ====================================================================

ALTER TABLE public.clinic_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.clinic_users ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.clinic_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.clinic_users ADD COLUMN IF NOT EXISTS last_active TEXT DEFAULT 'Just now';
ALTER TABLE public.clinic_users ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE public.pet_owners ADD COLUMN IF NOT EXISTS current_session_id TEXT;
ALTER TABLE public.pet_owners ADD COLUMN IF NOT EXISTS date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.pet_owners ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.pet_owners ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.pet_owners ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.pet_owners ADD COLUMN IF NOT EXISTS address TEXT;

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================


INSERT INTO public.clinic_users (id, name, full_name, email, role, department, status, last_active, is_protected)
VALUES 
  ('USR-SUPER-01', 'Joecel Garcia', 'Joecel Garcia', 'joecelgarcia1@gmail.com', 'Super Admin', 'Chief Executive & Master System Controller', 'Active', 'Now (Active)', TRUE),
  ('USR-SUPER-02', 'Marc Germine Ganan', 'Marc Germine Ganan', 'marcgermineganan05@gmail.com', 'Super Admin', 'Chief Executive & Master System Controller', 'Active', 'Now (Active)', TRUE),
  ('USR-00', 'Heritage System Admin', 'Heritage System Admin', 'heritagelink45@gmail.com', 'Administrator', 'Lead Security & IT Systems', 'Active', 'Now (Active 2FA)', FALSE),
  ('USR-01', 'Dr. Sarah Jenkins', 'Dr. Sarah Jenkins', 's.jenkins@heritageanimalclinic.com', 'Veterinarian', 'Chief Veterinary Medical Officer', 'Active', 'Now (Active)', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pet_owners (id, name, email, phone, access_status, pet_ids, notes)
VALUES
  ('OWN-001', 'Eleanor Vance', 'eleanor.vance@email.com', '(555) 234-5678', 'inactive', '["PET-001"]'::jsonb, 'Preferred communication via email.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pets (id, name, species, breed, age, weight, sex, owner_name, owner_phone, owner_id, clinic_ref, assigned_device_id, health_status, portion_grams, times_per_day, food_type, hydration_target, latest_temp, latest_heart_rate)
VALUES 
  ('PET-001', 'Max', 'Dog', 'Golden Retriever', 4.0, 29.5, 'Male', 'Eleanor Vance', '(555) 234-5678', 'OWN-001', 'REF-2026-081', 'Cage 1', 'Healthy', 250, 2, 'High-Protein Adult Kibble', 1400, 38.5, 85)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.devices (id, device_name, assigned_pet_id, assigned_pet_name, status, hardware_status, wifi_signal_dbm, food_level_pct, water_level_pct, battery_pct, is_plugged_in, firmware_version, mac_address)
VALUES
  ('Cage 1', 'HydroNourish Smart Cage Unit', 'PET-001', 'Max', 'Online', 'occupied', -54, 78, 82, 98, TRUE, 'v2.4.1-ESP32', '24:0A:C4:00:01:A1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.feeding_schedules (id, pet_id, pet_name, food_type, portion_grams, scheduled_time, dispense_status, device_id, last_dispensed_at)
VALUES
  ('SCH-101', 'PET-001', 'Max', 'High-Protein Adult Kibble', 125, '08:00 AM', 'Dispensed', 'Cage 1', '2026-07-27 08:00 AM'),
  ('SCH-102', 'PET-001', 'Max', 'High-Protein Adult Kibble', 125, '06:00 PM', 'Pending', 'Cage 1', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.feeding_logs (id, pet_id, pet_name, portion_grams, dispensed_at, status, device_id, session_id)
VALUES
  ('FL-301', 'PET-001', 'Max', 125, '2026-07-27 08:00 AM', 'Success', 'Cage 1', 'SES-DEMO-001'),
  ('FL-302', 'PET-001', 'Max', 125, '2026-07-26 06:00 PM', 'Success', 'Cage 1', 'SES-DEMO-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hydration_logs (id, pet_id, pet_name, amount_ml, timestamp, reservoir_level_pct, session_id)
VALUES
  ('HL-401', 'PET-001', 'Max', 320, '2026-07-27 09:30 AM', 82, 'SES-DEMO-001'),
  ('HL-402', 'PET-001', 'Max', 280, '2026-07-27 01:45 PM', 74, 'SES-DEMO-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vital_signs (id, pet_id, pet_name, temperature, heart_rate, weight, activity_mins, status, timestamp, session_id)
VALUES
  ('VIT-501', 'PET-001', 'Max', 38.5, 85, 29.5, 45, 'Normal', '2026-07-27 08:00 AM', 'SES-DEMO-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_alerts (id, pet_id, pet_name, alert_type, observed_reading, severity, ai_observation, recommended_action, review_status, timestamp)
VALUES
  ('ALT-701', 'PET-001', 'Max', 'Hydration Target Achieved', '1,400 ml consumed daily target met', 'Info', 'Optimal hydration levels maintained consistently for 48 hours.', 'Maintain current automated feeding and water dispenser schedule.', 'Resolved', '2026-07-27 09:15 AM')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clinic_settings (id, clinic_name, clinic_address, clinic_phone, license_id, default_portion_grams, default_hydration_ml_per_kg)
VALUES (1, 'Heritage Animal Clinic', '742 Evergreen Terrace, Medical District, Sector 4', '(555) 890-1234', 'VET-LIC-2026-9817', 100, 50)
ON CONFLICT (id) DO NOTHING;
