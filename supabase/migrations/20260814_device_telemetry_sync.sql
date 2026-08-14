-- ====================================================================
-- HYDRONOURISH - DEVICE TELEMETRY & SYNCHRONIZATION SCHEMA
-- ====================================================================

-- 1. Ensure all canonical columns exist on `devices` table
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS water_raw_adc INT DEFAULT 0;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS water_quality_ppm INT DEFAULT 0;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS is_pumping BOOLEAN DEFAULT FALSE;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS auto_refill_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS uptime_seconds BIGINT DEFAULT 0;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS device_token TEXT;

-- 2. Create historical telemetry logging table
CREATE TABLE IF NOT EXISTS public.device_telemetry_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    water_level_pct NUMERIC(5,2) NOT NULL,
    water_raw_adc INT,
    food_level_pct NUMERIC(5,2) NOT NULL,
    water_quality_ppm INT DEFAULT 0,
    wifi_signal_dbm INT,
    pump_active BOOLEAN DEFAULT FALSE,
    firmware_version TEXT,
    uptime_seconds BIGINT,
    device_timestamp TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for fast time-series queries
CREATE INDEX IF NOT EXISTS idx_telemetry_history_device_time 
ON public.device_telemetry_history(device_id, received_at DESC);

-- 4. Set up Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_telemetry_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to telemetry data for the dashboard
DROP POLICY IF EXISTS "Allow public read on devices" ON public.devices;
CREATE POLICY "Allow public read on devices" ON public.devices 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service and api write on devices" ON public.devices;
CREATE POLICY "Allow service and api write on devices" ON public.devices 
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on telemetry history" ON public.device_telemetry_history;
CREATE POLICY "Allow public read on telemetry history" ON public.device_telemetry_history 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service and api write on telemetry history" ON public.device_telemetry_history;
CREATE POLICY "Allow service and api write on telemetry history" ON public.device_telemetry_history 
FOR ALL USING (true) WITH CHECK (true);
