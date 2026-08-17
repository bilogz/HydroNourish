import { Device, DeviceTelemetryPayload } from '../types';

/**
 * Validates incoming device telemetry JSON contract
 */
export function validateTelemetryPayload(body: any): { valid: boolean; error?: string; data?: DeviceTelemetryPayload } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object' };
  }

  const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : (typeof body.device_id === 'string' ? body.device_id.trim() : '');
  if (!deviceId) {
    return { valid: false, error: 'Missing or invalid required field: deviceId' };
  }

  const waterLevel = body.waterLevelPercent !== undefined ? Number(body.waterLevelPercent) : (body.water_level_pct !== undefined ? Number(body.water_level_pct) : NaN);
  if (isNaN(waterLevel) || waterLevel < 0 || waterLevel > 100) {
    return { valid: false, error: `Invalid waterLevelPercent: ${waterLevel}. Must be a number between 0 and 100.` };
  }

  const foodLevel = body.foodLevelPercent !== undefined ? Number(body.foodLevelPercent) : (body.food_level_pct !== undefined ? Number(body.food_level_pct) : NaN);
  if (isNaN(foodLevel) || foodLevel < 0 || foodLevel > 100) {
    return { valid: false, error: `Invalid foodLevelPercent: ${foodLevel}. Must be a number between 0 and 100.` };
  }

  const tdsPpm = Number(body.tdsPpm ?? body.tds_ppm ?? body.waterQualityPpm ?? 0);
  const wifiRssi = Number(body.wifiRssiDbm ?? body.wifi_signal_dbm ?? -65);
  const waterRawAdc = body.waterRawAdc !== undefined ? Number(body.waterRawAdc) : (body.water_raw_adc !== undefined ? Number(body.water_raw_adc) : 0);
  const pumpActive = Boolean(body.pumpActive ?? body.pump_active ?? body.is_pumping ?? false);
  const firmwareVersion = String(body.firmwareVersion || body.firmware_version || 'v2.5.0-ESP32');
  const uptimeSeconds = Number(body.uptimeSeconds ?? body.uptime_seconds ?? 0);
  const timestamp = String(body.timestamp || new Date().toISOString());

  const data: DeviceTelemetryPayload = {
    deviceId,
    timestamp,
    waterLevelPercent: Math.round(waterLevel * 10) / 10,
    waterRawAdc,
    foodLevelPercent: Math.round(foodLevel * 10) / 10,
    tdsPpm: Math.max(0, Math.round(tdsPpm)),
    wifiRssiDbm: Math.min(0, Math.round(wifiRssi)),
    pumpActive,
    firmwareVersion,
    uptimeSeconds: Math.max(0, uptimeSeconds),
  };

  return { valid: true, data };
}

/**
 * Maps canonical telemetry payload to Supabase `devices` row columns
 */
export function mapPayloadToDeviceRow(payload: DeviceTelemetryPayload, receivedAt: string = new Date().toISOString()): Record<string, any> {
  return {
    id: payload.deviceId,
    status: 'Online',
    water_level_pct: payload.waterLevelPercent,
    water_raw_adc: payload.waterRawAdc ?? 0,
    food_level_pct: payload.foodLevelPercent,
    water_quality_ppm: payload.tdsPpm,
    wifi_signal_dbm: payload.wifiRssiDbm,
    is_pumping: payload.pumpActive ?? false,
    last_transmission: payload.timestamp,
    last_seen_at: receivedAt,
    firmware_version: payload.firmwareVersion || 'v2.5.0-ESP32',
    uptime_seconds: payload.uptimeSeconds ?? 0,
  };
}

/**
 * Maps Supabase `devices` database row to frontend `Device` model
 */
export function mapDeviceRowToModel(item: any, nowMs: number = Date.now()): Device {
  const lastSeenStr = item.updated_at || item.last_seen_at || item.last_transmission;
  let computedStatus: Device['status'] = item.status === 'Online' ? 'Online' : 'Offline';
  let ageSec = 0;

  if (lastSeenStr) {
    const raw = String(lastSeenStr).trim();
    const parsed = Date.parse(raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z');
    if (!isNaN(parsed)) {
      ageSec = Math.abs(Math.round((nowMs - parsed) / 1000));
      if (item.status === 'Online' || item.status === 'occupied') {
        computedStatus = 'Online';
      } else if (ageSec <= 90) {
        computedStatus = 'Online';
      } else if (ageSec <= 180) {
        computedStatus = 'Connecting' as Device['status'];
      } else {
        computedStatus = 'Offline';
      }
    }
  }

  let displayTransmission = 'Live — Synchronized';
  if (computedStatus === 'Online') {
    displayTransmission = ageSec <= 10 ? 'Live — Synchronized' : `${ageSec}s ago`;
  } else if (computedStatus === 'Connecting') {
    displayTransmission = `Connecting (${ageSec}s ago)`;
  } else {
    displayTransmission = ageSec < 60 ? `Offline (${ageSec}s ago)` : (ageSec < 3600 ? `Offline (${Math.round(ageSec / 60)}m ago)` : 'Offline');
  }

  let fw = item.firmware_version || 'v2.5.0-ESP32';
  let parsedTds = item.water_quality_ppm !== null && item.water_quality_ppm !== undefined ? Number(item.water_quality_ppm) : 0;
  let parsedWeight = Number(item.food_bowl_weight_grams) || 0.0;

  if (fw && fw.includes('|')) {
    const parts = fw.split('|');
    fw = parts[0];
    for (const p of parts) {
      if (p.startsWith('TDS:')) {
        const val = Number(p.replace('TDS:', ''));
        if (!isNaN(val)) parsedTds = val;
      }
      if (p.startsWith('WT:')) {
        const val = Number(p.replace('WT:', ''));
        if (!isNaN(val)) parsedWeight = val;
      }
    }
  }

  return {
    id: item.id,
    deviceName: item.device_name || 'HydroNourish Smart Cage Unit',
    assignedPetId: item.assigned_pet_id || '',
    assignedPetName: item.assigned_pet_name || '',
    status: computedStatus,
    hardwareStatus: (item.hardware_status as Device['hardwareStatus']) || 'occupied',
    wifiSignalDbm: item.wifi_signal_dbm !== null && item.wifi_signal_dbm !== undefined ? Number(item.wifi_signal_dbm) : -65,
    foodLevelPct: item.food_level_pct !== null && item.food_level_pct !== undefined ? Number(item.food_level_pct) : 0,
    waterLevelPct: item.water_level_pct !== null && item.water_level_pct !== undefined ? Number(item.water_level_pct) : 0,
    waterRawAdc: item.water_raw_adc !== null && item.water_raw_adc !== undefined ? Number(item.water_raw_adc) : 0,
    foodBowlWeightGrams: parsedWeight,
    waterQualityPpm: parsedTds,
    batteryPct: item.battery_pct !== null && item.battery_pct !== undefined ? Number(item.battery_pct) : 100,
    isPluggedIn: item.is_plugged_in !== null && item.is_plugged_in !== undefined ? Boolean(item.is_plugged_in) : true,
    lastTransmission: displayTransmission,
    firmwareVersion: fw,
    macAddress: item.mac_address || '1C:C3:AB:F9:F7:78',
    isPumping: Boolean(item.is_pumping),
    lastSeenAt: item.last_seen_at || item.last_transmission || null,
    uptimeSeconds: Number(item.uptime_seconds) || 0,
  };
}
