-- ====================================================================
-- HYDRO NOURISH — HERITAGE ANIMAL CLINIC SUPABASE POSTGRESQL SCHEMA
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
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FEEDING SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.feeding_schedules (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    portion_grams NUMERIC NOT NULL,
    scheduled_time TEXT NOT NULL,
    dispense_status TEXT DEFAULT 'Pending',
    device_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VITAL SIGNS READINGS TABLE
CREATE TABLE IF NOT EXISTS public.vital_signs (
    id TEXT PRIMARY KEY,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE CASCADE,
    pet_name TEXT NOT NULL,
    temperature NUMERIC NOT NULL,
    heart_rate INT NOT NULL,
    weight NUMERIC NOT NULL,
    activity_mins INT NOT NULL,
    status TEXT DEFAULT 'Normal',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AI HEALTH ALERTS TABLE
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
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ESP32 HARDWARE DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.devices (
    id TEXT PRIMARY KEY,
    assigned_pet_id TEXT,
    assigned_pet_name TEXT,
    status TEXT DEFAULT 'Online',
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

-- 6. CLINIC USERS & STAFF TABLE
CREATE TABLE IF NOT EXISTS public.clinic_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    last_active TEXT DEFAULT 'Just now',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- SEED INITIAL DATA FOR HERITAGE ANIMAL CLINIC
-- ====================================================================

INSERT INTO public.clinic_users (id, name, email, role, department, status, last_active)
VALUES 
  ('USR-SUPER-01', 'Joecel Garcia', 'joecelgarcia1@gmail.com', 'Super Admin', 'Chief Executive & Master System Controller', 'Active', 'Now (Active)'),
  ('USR-00', 'Heritage System Admin', 'heritagelink45@gmail.com', 'Administrator', 'Lead Security & IT Systems', 'Active', 'Now (Active 2FA)'),
  ('USR-01', 'Dr. Sarah Jenkins', 's.jenkins@heritageanimalclinic.com', 'Veterinarian', 'Chief Veterinary Medical Officer', 'Active', 'Now (Active)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pets (id, name, species, breed, age, weight, owner_name, owner_phone, clinic_ref, assigned_device_id, health_status, portion_grams, times_per_day, food_type, hydration_target, latest_temp, latest_heart_rate)
VALUES 
  ('PET-001', 'Max', 'Dog', 'Golden Retriever', 4.5, 29.5, 'Eleanor Vance', '+63 917 555 0192', 'HAC-2026-8801', 'HN-DEV-0101', 'Healthy', 250, 2, 'Dry Kibble Premium', 1200, 38.5, 85),
  ('PET-002', 'Bella', 'Cat', 'Siamese', 3.0, 4.2, 'Marcus Brody', '+63 918 555 0843', 'HAC-2026-8802', 'HN-DEV-0102', 'Attention Needed', 65, 3, 'Wet Urinary Care', 450, 39.2, 142),
  ('PET-003', 'Milo', 'Dog', 'Beagle', 2.0, 12.8, 'Sophia Loren', '+63 920 555 0411', 'HAC-2026-8803', 'HN-DEV-0103', 'Healthy', 140, 2, 'Dry Kibble Active', 750, 38.4, 92)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.devices (id, assigned_pet_id, assigned_pet_name, status, wifi_signal_dbm, food_level_pct, water_level_pct, battery_pct, mac_address)
VALUES
  ('HN-DEV-0101', 'PET-001', 'Max', 'Online', -55, 82, 91, 100, '24:0A:C4:00:01:F1'),
  ('HN-DEV-0102', 'PET-002', 'Bella', 'Online', -62, 45, 32, 88, '24:0A:C4:00:02:F2'),
  ('HN-DEV-0103', 'PET-003', 'Milo', 'Online', -48, 90, 85, 95, '24:0A:C4:00:03:F3')
ON CONFLICT (id) DO NOTHING;
