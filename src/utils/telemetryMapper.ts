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
  const rawFwOriginal = String(body.firmwareVersion || body.firmware_version || 'v2.5.0-ESP32');
  let cameraIp = body.cameraIp || body.camera_ip || body.sta_ip || '';
  if (!cameraIp && rawFwOriginal.includes('CAM:')) {
    const match = rawFwOriginal.match(/CAM:([0-9.]+)/i);
    if (match && match[1]) cameraIp = match[1];
  }

  const timestamp = body.timestamp ? String(body.timestamp) : new Date().toISOString();
  const uptimeSeconds = Number(body.uptimeSeconds ?? body.uptime_seconds ?? 0);
  const reservoirCapacity = Number(body.reservoirCapacityLiters ?? body.reservoir_capacity_liters ?? 2.50);
  const waterLitersRaw = body.waterLiters !== undefined ? Number(body.waterLiters) : (body.water_liters !== undefined ? Number(body.water_liters) : NaN);
  const waterLiters = !isNaN(waterLitersRaw) ? Math.round(waterLitersRaw * 100) / 100 : Math.round((waterLevel / 100) * reservoirCapacity * 100) / 100;
  const foodGateOpen = Boolean(body.foodGateOpen ?? body.food_gate_open ?? false);
  const petEatingActive = Boolean(body.petEatingActive ?? body.pet_eating ?? false);
  const foodBowlWeightGrams = body.foodBowlWeightGrams !== undefined ? Number(body.foodBowlWeightGrams) : (body.food_bowl_weight_grams !== undefined ? Number(body.food_bowl_weight_grams) : undefined);
  const scaleReady = body.scaleReady !== undefined ? Boolean(body.scaleReady) : (body.scale_ready !== undefined ? Boolean(body.scale_ready) : undefined);
  const petDrinkingActive = body.petDrinkingActive !== undefined ? Boolean(body.petDrinkingActive) : (body.pet_drinking_active !== undefined ? Boolean(body.pet_drinking_active) : undefined);
  const lastIntakeWaterMl = body.lastIntakeWaterMl !== undefined ? Number(body.lastIntakeWaterMl) : (body.last_intake_water_ml !== undefined ? Number(body.last_intake_water_ml) : undefined);
  const lastIntakeFoodGrams = body.lastIntakeFoodGrams !== undefined ? Number(body.lastIntakeFoodGrams) : (body.last_intake_food_grams !== undefined ? Number(body.last_intake_food_grams) : undefined);

  const data: DeviceTelemetryPayload = {
    deviceId,
    timestamp,
    waterLevelPercent: Math.round(waterLevel * 10) / 10,
    waterLiters,
    reservoirCapacityLiters: reservoirCapacity,
    waterRawAdc,
    foodLevelPercent: Math.round(foodLevel * 10) / 10,
    tdsPpm: Math.max(0, Math.round(tdsPpm)),
    wifiRssiDbm: Math.min(0, Math.round(wifiRssi)),
    pumpActive,
    firmwareVersion: rawFwOriginal,
    cameraIp,
    foodGateOpen,
    petEatingActive,
    foodBowlWeightGrams,
    scaleReady,
    petDrinkingActive,
    lastIntakeWaterMl,
    lastIntakeFoodGrams,
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
    water_liters: payload.waterLiters ?? Math.round((payload.waterLevelPercent / 100) * 2.50 * 100) / 100,
    water_raw_adc: payload.waterRawAdc ?? 0,
    food_level_pct: payload.foodLevelPercent,
    water_quality_ppm: payload.tdsPpm,
    wifi_signal_dbm: payload.wifiRssiDbm,
    is_pumping: payload.pumpActive ?? false,
    last_transmission: payload.timestamp,
    last_seen_at: receivedAt,
    firmware_version: payload.firmwareVersion || 'v2.5.0-ESP32',
    camera_ip: payload.cameraIp || null,
    uptime_seconds: payload.uptimeSeconds ?? 0,
    food_bowl_weight_grams: payload.foodBowlWeightGrams,
    scale_ready: payload.scaleReady,
    pet_drinking_active: payload.petDrinkingActive,
    last_intake_water_ml: payload.lastIntakeWaterMl,
    last_intake_food_grams: payload.lastIntakeFoodGrams,
  };
}

/**
 * Maps Supabase `devices` database row to frontend `Device` model
 */
export function mapDeviceRowToModel(item: any, nowMs: number = Date.now()): Device {
  const lastSeenCandidates = [
    item.last_transmission,
    item.last_seen_at,
    item.updated_at,
  ].filter(Boolean);

  let computedStatus: Device['status'] = item.status === 'Online' ? 'Online' : 'Offline';
  let ageSec = 0;

  const validParsed: number[] = [];
  for (const ts of lastSeenCandidates) {
    const raw = String(ts).trim();
    const parsed = Date.parse(raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z');
    if (!isNaN(parsed)) {
      validParsed.push(parsed);
    }
  }

  if (validParsed.length > 0) {
    const latestParsed = Math.max(...validParsed);
    ageSec = Math.max(0, Math.round((nowMs - latestParsed) / 1000));
    if (item.status === 'Offline' || item.status === 'offline' || item.status === 'maintenance') {
      computedStatus = 'Offline';
    } else if (ageSec <= 12) {
      computedStatus = 'Online';
    } else if (ageSec <= 25) {
      computedStatus = 'Connecting' as Device['status'];
    } else {
      computedStatus = 'Offline';
    }
  } else {
    computedStatus = 'Offline';
  }

  let displayTransmission = 'Live — Synchronized';
  if (computedStatus === 'Online') {
    displayTransmission = ageSec <= 10 ? 'Live — Synchronized' : `${ageSec}s ago`;
  } else if (computedStatus === 'Connecting') {
    displayTransmission = `Connecting (${ageSec}s ago)`;
  } else {
    displayTransmission = ageSec < 60 ? `Offline (${ageSec}s ago)` : (ageSec < 3600 ? `Offline (${Math.round(ageSec / 60)}m ago)` : 'Offline');
  }

  const rawFw = item.firmware_version || 'v2.5.0-ESP32';
  let fw = rawFw;
  let parsedTds = item.water_quality_ppm !== null && item.water_quality_ppm !== undefined ? Number(item.water_quality_ppm) : 0;
  let parsedWeight = Number(item.food_bowl_weight_grams) || 0.0;
  let parsedIp = item.ip_address || '';
  let parsedCamIp = item.camera_ip || item.sta_ip || '';
  let parsedSsid = item.wifi_ssid || item.ssid || item.wifiSsid || '';

  if (rawFw && rawFw.includes('|')) {
    const parts = rawFw.split('|');
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
      if (p.startsWith('IP:')) {
        parsedIp = p.replace('IP:', '').trim();
      }
      if (p.startsWith('CAM:')) {
        parsedCamIp = p.replace('CAM:', '').trim();
      }
      if (p.startsWith('SSID:')) {
        parsedSsid = p.replace('SSID:', '').trim();
      }
      if (p.startsWith('WIFI:') && !p.includes('dBm')) {
        parsedSsid = p.replace('WIFI:', '').trim();
      }
    }
  }

  // Regex fallback for SSID:<name> anywhere in firmware string
  if (!parsedSsid && rawFw && rawFw.includes('SSID:')) {
    const ssidMatch = rawFw.match(/SSID:([^|]+)/i);
    if (ssidMatch && ssidMatch[1]) {
      parsedSsid = ssidMatch[1].trim();
    }
  }

  // Fallback to active locally paired network if not explicitly tagged by cloud
  if (!parsedSsid && typeof window !== 'undefined') {
    try {
      const localSsid = localStorage.getItem('hydronourish_paired_ssid');
      if (localSsid) parsedSsid = localSsid;
    } catch {}
  }

  // Fallback for online device if SSID wasn't explicitly tagged
  if (!parsedSsid && (computedStatus === 'Online' || item.status === 'Online')) {
    parsedSsid = 'brrt rrt';
  }

  // Regex fallback for CAM:<ip> anywhere in firmware string
  if (!parsedCamIp && rawFw && rawFw.includes('CAM:')) {
    const camMatch = rawFw.match(/CAM:([0-9.]+)/i);
    if (camMatch && camMatch[1]) {
      parsedCamIp = camMatch[1].trim();
    }
  }

  // If no explicit cam IP, check if ipAddress is valid
  if (!parsedCamIp && parsedIp && !parsedIp.includes('192.168.100.159')) {
    parsedCamIp = parsedIp;
  }

  return {
    id: item.id,
    deviceName: item.device_name || 'HydroNourish Smart Cage Unit',
    assignedPetId: item.assigned_pet_id || '',
    assignedPetName: item.assigned_pet_name || '',
    status: computedStatus,
    hardwareStatus: (item.hardware_status as Device['hardwareStatus']) || 'occupied',
    wifiSignalDbm: item.wifi_signal_dbm !== null && item.wifi_signal_dbm !== undefined ? Number(item.wifi_signal_dbm) : -65,
    wifiSsid: parsedSsid || 'brrt rrt',
    foodLevelPct: item.food_level_pct !== null && item.food_level_pct !== undefined ? Number(item.food_level_pct) : 0,
    waterLevelPct: item.water_level_pct !== null && item.water_level_pct !== undefined ? Number(item.water_level_pct) : 0,
    waterLiters: item.water_liters !== null && item.water_liters !== undefined 
      ? Number(item.water_liters) 
      : Math.round(((Number(item.water_level_pct || 0)) / 100) * 2.50 * 100) / 100,
    reservoirCapacityLiters: item.reservoir_capacity_liters !== null && item.reservoir_capacity_liters !== undefined
      ? Number(item.reservoir_capacity_liters)
      : 2.50,
    waterRawAdc: item.water_raw_adc !== null && item.water_raw_adc !== undefined ? Number(item.water_raw_adc) : 0,
    foodBowlWeightGrams: parsedWeight,
    waterQualityPpm: parsedTds,
    batteryPct: item.battery_pct !== null && item.battery_pct !== undefined ? Number(item.battery_pct) : 100,
    isPluggedIn: item.is_plugged_in !== null && item.is_plugged_in !== undefined ? Boolean(item.is_plugged_in) : true,
    lastTransmission: displayTransmission,
    firmwareVersion: fw,
    macAddress: item.mac_address || '1C:C3:AB:F9:F7:78',
    ipAddress: parsedIp || undefined,
    cameraIp: parsedCamIp || undefined,
    isPumping: Boolean(item.is_pumping),
    foodGateOpen: Boolean(item.food_gate_open),
    petEatingActive: Boolean(item.pet_eating_active),
    scaleReady: item.scale_ready !== undefined ? Boolean(item.scale_ready) : undefined,
    petDrinkingActive: item.pet_drinking_active !== undefined ? Boolean(item.pet_drinking_active) : undefined,
    lastIntakeWaterMl: item.last_intake_water_ml !== undefined && item.last_intake_water_ml !== null ? Number(item.last_intake_water_ml) : undefined,
    lastIntakeFoodGrams: item.last_intake_food_grams !== undefined && item.last_intake_food_grams !== null ? Number(item.last_intake_food_grams) : undefined,
    lastSeenAt: item.last_seen_at || item.last_transmission || null,
    uptimeSeconds: Number(item.uptime_seconds) || 0,
  };
}
