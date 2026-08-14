import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://nibsyjmdyfdvvwttcnkx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYnN5am1keWZkdnZ3dHRjbmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTU4MDEsImV4cCI6MjEwMDczMTgwMX0.ORgBNgtGVS3ygIXIenLxUXjdeLeMdZOOEDdR9-O4YtM';
const EXPECTED_DEVICE_TOKEN = process.env.DEVICE_SECRET_TOKEN || 'hn_device_secret_token_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  }

  // Health check endpoint
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ status: 'active', service: 'HydroNourish Telemetry Ingestion Engine', version: '2.5.0' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
    };
  }

  // 1. Authenticate Request
  const deviceToken =
    event.headers['x-device-token'] ||
    event.headers['X-Device-Token'] ||
    (event.headers.authorization?.startsWith('Bearer ') ? event.headers.authorization.slice(7) : '');

  if (EXPECTED_DEVICE_TOKEN && deviceToken !== EXPECTED_DEVICE_TOKEN) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing device authentication token.' }),
    };
  }

  // 2. Parse & Validate Payload
  try {
    const rawBody = event.body ? JSON.parse(event.body) : null;
    if (!rawBody || typeof rawBody !== 'object') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON payload.' }),
      };
    }

    const deviceId = (rawBody.deviceId || rawBody.device_id || '').trim();
    if (!deviceId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: deviceId' }),
      };
    }

    const waterLevel = rawBody.waterLevelPercent !== undefined ? Number(rawBody.waterLevelPercent) : (rawBody.water_level_pct !== undefined ? Number(rawBody.water_level_pct) : NaN);
    if (isNaN(waterLevel) || waterLevel < 0 || waterLevel > 100) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Invalid waterLevelPercent: ${waterLevel}. Must be between 0 and 100.` }),
      };
    }

    const foodLevel = rawBody.foodLevelPercent !== undefined ? Number(rawBody.foodLevelPercent) : (rawBody.food_level_pct !== undefined ? Number(rawBody.food_level_pct) : NaN);
    if (isNaN(foodLevel) || foodLevel < 0 || foodLevel > 100) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Invalid foodLevelPercent: ${foodLevel}. Must be between 0 and 100.` }),
      };
    }

    const tdsPpm = Number(rawBody.tdsPpm ?? rawBody.tds_ppm ?? 0);
    const wifiRssi = Number(rawBody.wifiRssiDbm ?? rawBody.wifi_signal_dbm ?? -65);
    const waterRawAdc = rawBody.waterRawAdc !== undefined ? Number(rawBody.waterRawAdc) : (rawBody.water_raw_adc !== undefined ? Number(rawBody.water_raw_adc) : 0);
    const pumpActive = Boolean(rawBody.pumpActive ?? rawBody.pump_active ?? rawBody.is_pumping ?? false);
    const firmwareVersion = String(rawBody.firmwareVersion || rawBody.firmware_version || 'v2.5.0-ESP32');
    const uptimeSeconds = Number(rawBody.uptimeSeconds ?? rawBody.uptime_seconds ?? 0);
    const deviceTimestamp = String(rawBody.timestamp || new Date().toISOString());
    const receivedAt = new Date().toISOString();

    // 3. Upsert to `devices` table (with backwards-compatible firmware_version metadata encoding)
    const fwMeta = firmwareVersion.includes('|') ? firmwareVersion : `${firmwareVersion}|TDS:${Math.max(0, Math.round(tdsPpm))}|WT:0.0`;
    const deviceRecord: Record<string, any> = {
      id: deviceId,
      status: 'Online',
      water_level_pct: Math.round(waterLevel * 10) / 10,
      food_level_pct: Math.round(foodLevel * 10) / 10,
      wifi_signal_dbm: Math.min(0, Math.round(wifiRssi)),
      last_transmission: deviceTimestamp,
      firmware_version: fwMeta,
      is_plugged_in: true,
      battery_pct: 100,
    };

    const { error: deviceError } = await supabase.from('devices').upsert(deviceRecord, { onConflict: 'id' });

    if (deviceError) {
      console.error('Supabase device upsert error:', deviceError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Database update failed', details: deviceError.message }),
      };
    }

    // 4. Record to historical telemetry log
    await supabase.from('device_telemetry_history').insert({
      device_id: deviceId,
      water_level_pct: Math.round(waterLevel * 10) / 10,
      water_raw_adc: Math.round(waterRawAdc),
      food_level_pct: Math.round(foodLevel * 10) / 10,
      water_quality_ppm: Math.max(0, Math.round(tdsPpm)),
      wifi_signal_dbm: Math.min(0, Math.round(wifiRssi)),
      pump_active: pumpActive,
      firmware_version: firmwareVersion,
      uptime_seconds: Math.max(0, uptimeSeconds),
      device_timestamp: deviceTimestamp,
      received_at: receivedAt,
    }).then(() => {}).catch(() => {});

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        deviceId,
        receivedAt,
      }),
    };
  } catch (err: any) {
    console.error('Telemetry ingestion error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error', message: err?.message || 'Unknown error' }),
    };
  }
};
