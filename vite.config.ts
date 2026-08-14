import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nibsyjmdyfdvvwttcnkx.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYnN5am1keWZkdnZ3dHRjbmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTU4MDEsImV4cCI6MjEwMDczMTgwMX0.ORgBNgtGVS3ygIXIenLxUXjdeLeMdZOOEDdR9-O4YtM';
const EXPECTED_DEVICE_TOKEN = process.env.DEVICE_SECRET_TOKEN || 'hn_device_secret_token_2026';

function deviceTelemetryDevPlugin(): Plugin {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  return {
    name: 'device-telemetry-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/device-telemetry' || req.url?.startsWith('/api/device-telemetry?')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Token');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Content-Type', 'application/json');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          if (req.method === 'GET') {
            res.statusCode = 200;
            res.end(JSON.stringify({ status: 'active', service: 'Local Dev Telemetry Ingestion' }));
            return;
          }

          if (req.method === 'POST') {
            const token =
              req.headers['x-device-token'] ||
              (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '');

            if (EXPECTED_DEVICE_TOKEN && token !== EXPECTED_DEVICE_TOKEN) {
              res.statusCode = 401;
              res.end(JSON.stringify({ error: 'Unauthorized: Invalid device token.' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });
            req.on('end', async () => {
              try {
                const rawBody = JSON.parse(bodyStr);
                const deviceId = (rawBody.deviceId || rawBody.device_id || '').trim();
                if (!deviceId) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Missing deviceId' }));
                  return;
                }

                const waterLevel =
                  rawBody.waterLevelPercent !== undefined ? Number(rawBody.waterLevelPercent) : Number(rawBody.water_level_pct);
                const foodLevel =
                  rawBody.foodLevelPercent !== undefined ? Number(rawBody.foodLevelPercent) : Number(rawBody.food_level_pct);

                if (isNaN(waterLevel) || waterLevel < 0 || waterLevel > 100 || isNaN(foodLevel) || foodLevel < 0 || foodLevel > 100) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid water or food level percentage (must be 0-100)' }));
                  return;
                }

                const tdsPpm = Number(rawBody.tdsPpm ?? rawBody.tds_ppm ?? 0);
                const wifiRssi = Number(rawBody.wifiRssiDbm ?? rawBody.wifi_signal_dbm ?? -65);
                const waterRawAdc = Number(rawBody.waterRawAdc ?? rawBody.water_raw_adc ?? 0);
                const pumpActive = Boolean(rawBody.pumpActive ?? rawBody.pump_active ?? rawBody.is_pumping ?? false);
                const firmwareVersion = String(rawBody.firmwareVersion || rawBody.firmware_version || 'v2.5.0-ESP32');
                const uptimeSeconds = Number(rawBody.uptimeSeconds ?? rawBody.uptime_seconds ?? 0);
                const deviceTimestamp = String(rawBody.timestamp || new Date().toISOString());
                const receivedAt = new Date().toISOString();

                const fwMeta = firmwareVersion.includes('|') ? firmwareVersion : `${firmwareVersion}|TDS:${Math.max(0, Math.round(tdsPpm))}|WT:0.0`;
                await supabase.from('devices').upsert(
                  {
                    id: deviceId,
                    status: 'Online',
                    water_level_pct: Math.round(waterLevel * 10) / 10,
                    food_level_pct: Math.round(foodLevel * 10) / 10,
                    wifi_signal_dbm: Math.min(0, Math.round(wifiRssi)),
                    last_transmission: deviceTimestamp,
                    firmware_version: fwMeta,
                    is_plugged_in: true,
                    battery_pct: 100,
                  },
                  { onConflict: 'id' }
                );

                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, deviceId, receivedAt }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to process telemetry', details: err?.message }));
              }
            });
            return;
          }

          next();
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), deviceTelemetryDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
  },
});
