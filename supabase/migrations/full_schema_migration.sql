-- ====================================================================
-- HYDRO NOURISH — FULL SUPABASE MIGRATION SCRIPT
-- Heritage Animal Clinic Capstone Project
-- Run this script directly in the Supabase SQL Editor.
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
    notes TEXT
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
-- RLS POLICIES FOR ALL TABLES
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

