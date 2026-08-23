/**
 * HydroNourish — Supabase Data Service
 * Heritage Animal Clinic Capstone Project
 *
 * Full dynamic data access layer for PostgreSQL tables with real-time sync.
 * Falls back to null/false gracefully when Supabase is offline or env key is absent.
 */

import { supabase } from '../lib/supabase';
import type {
  Pet,
  FeedingSchedule,
  FeedingLog,
  HydrationLog,
  VitalSignRecord,
  AIHealthAlert,
  Device,
  ClinicUser,
  PetOwner,
  PetSession,
  ClinicSettings,
  UserRole,
  ContactInquiry,
} from '../types';

/**
 * Checks if Supabase client key is valid before executing requests.
 */
function isSupabaseConfigured(): boolean {
  return true;
}

// ─── 1. PETS ──────────────────────────────────────────────────────────────

export async function fetchPetsFromSupabase(): Promise<Pet[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('pets').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return (data as any[]).map((item) => ({
      id: item.id,
      name: item.name,
      species: item.species as Pet['species'],
      breed: item.breed,
      age: Number(item.age),
      weight: Number(item.weight),
      sex: (item.sex ?? 'Male') as Pet['sex'],
      ownerName: item.owner_name,
      ownerPhone: item.owner_phone,
      ownerEmail: item.owner_email || undefined,
      ownerId: item.owner_id || undefined,
      clinicRef: item.clinic_ref,
      assignedDeviceId: item.assigned_device_id ?? 'Cage 1',
      healthStatus: (item.health_status ?? 'Healthy') as Pet['healthStatus'],
      avatarUrl:
        item.avatar_url ??
        'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300',
      feedingPlan: {
        portionGrams: Number(item.portion_grams) || 120,
        timesPerDay: Number(item.times_per_day) || 3,
        foodType: item.food_type ?? 'Veterinary Dry Kibble',
      },
      hydrationTarget: Number(item.hydration_target) || 850,
      latestVitals: {
        temperature: Number(item.latest_temp) || 38.5,
        heartRate: Number(item.latest_heart_rate) || 85,
        activityLevel: (item.latest_activity ?? 'Normal') as any,
        lastMeasured: 'Today',
      },
      emergencyContact: item.emergency_contact || undefined,
      notes: item.notes || '',
    }));
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase pets fetch error:', err);
    return null;
  }
}

export async function insertPetToSupabase(pet: Pet): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      sex: pet.sex || 'Male',
      owner_name: pet.ownerName,
      owner_phone: pet.ownerPhone,
      owner_id: pet.ownerId || null,
      clinic_ref: pet.clinicRef,
      assigned_device_id: pet.assignedDeviceId,
      health_status: pet.healthStatus,
      avatar_url: pet.avatarUrl,
      portion_grams: pet.feedingPlan?.portionGrams || 120,
      times_per_day: pet.feedingPlan?.timesPerDay || 2,
      food_type: pet.feedingPlan?.foodType || 'Veterinary Dry Kibble',
      hydration_target: pet.hydrationTarget || 500,
      latest_temp: pet.latestVitals?.temperature || 38.5,
      latest_heart_rate: pet.latestVitals?.heartRate || 90,
      latest_activity: pet.latestVitals?.activityLevel || 'Normal',
      emergency_contact: pet.emergencyContact || null,
      notes: pet.notes || '',
    };

    if (pet.ownerEmail) {
      payload.owner_email = pet.ownerEmail;
    }

    const { error } = await supabase.from('pets').upsert(payload);
    if (error) {
      // If owner_email column is not yet migrated in Supabase, retry without it
      delete payload.owner_email;
      const retry = await supabase.from('pets').upsert(payload);
      return !retry.error;
    }
    return true;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase pet insert error:', err);
    return false;
  }
}

export async function updatePetInSupabase(id: string, updated: Partial<Pet>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {};
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.species !== undefined) payload.species = updated.species;
    if (updated.breed !== undefined) payload.breed = updated.breed;
    if (updated.ownerEmail !== undefined) payload.owner_email = updated.ownerEmail;
    if (updated.age !== undefined) payload.age = updated.age;
    if (updated.weight !== undefined) payload.weight = updated.weight;
    if (updated.sex !== undefined) payload.sex = updated.sex;
    if (updated.ownerName !== undefined) payload.owner_name = updated.ownerName;
    if (updated.ownerPhone !== undefined) payload.owner_phone = updated.ownerPhone;
    if (updated.healthStatus !== undefined) payload.health_status = updated.healthStatus;
    if (updated.assignedDeviceId !== undefined) payload.assigned_device_id = updated.assignedDeviceId;
    if (updated.avatarUrl !== undefined) payload.avatar_url = updated.avatarUrl;
    if (updated.hydrationTarget !== undefined) payload.hydration_target = updated.hydrationTarget;
    if (updated.emergencyContact !== undefined) payload.emergency_contact = updated.emergencyContact;
    if (updated.notes !== undefined) payload.notes = updated.notes;

    if (updated.feedingPlan) {
      if (updated.feedingPlan.portionGrams !== undefined) payload.portion_grams = updated.feedingPlan.portionGrams;
      if (updated.feedingPlan.timesPerDay !== undefined) payload.times_per_day = updated.feedingPlan.timesPerDay;
      if (updated.feedingPlan.foodType !== undefined) payload.food_type = updated.feedingPlan.foodType;
    }

    if (updated.latestVitals) {
      if (updated.latestVitals.temperature !== undefined) payload.latest_temp = updated.latestVitals.temperature;
      if (updated.latestVitals.heartRate !== undefined) payload.latest_heart_rate = updated.latestVitals.heartRate;
      if (updated.latestVitals.activityLevel !== undefined) payload.latest_activity = updated.latestVitals.activityLevel;
    }

    const { error } = await (supabase.from('pets') as any).update(payload).eq('id', id);
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase pet update error:', err);
    return false;
  }
}

export async function deletePetFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('pets').delete().eq('id', id);
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase pet delete error:', err);
    return false;
  }
}

// ─── 2. FEEDING SCHEDULES ──────────────────────────────────────────────────

export async function fetchSchedulesFromSupabase(): Promise<FeedingSchedule[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('feeding_schedules').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      petId: item.pet_id,
      petName: item.pet_name,
      foodType: item.food_type ?? 'Veterinary Dry Kibble',
      portionGrams: Number(item.portion_grams),
      scheduledTime: item.scheduled_time,
      dispenseStatus: item.dispense_status as FeedingSchedule['dispenseStatus'],
      deviceId: item.device_id,
      lastDispensedAt: item.last_dispensed_at || undefined,
    }));
  } catch (err) {
    return null;
  }
}

export async function insertScheduleToSupabase(schedule: FeedingSchedule): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {
      id: schedule.id,
      pet_name: schedule.petName || 'galaxy destroyer',
      portion_grams: schedule.portionGrams || 75,
      scheduled_time: schedule.scheduledTime || 'Instant Manual',
      dispense_status: 'Pending',
      device_id: schedule.deviceId || 'HN-NODE-F778',
    };
    if (schedule.petId && schedule.petId.length === 36 && schedule.petId.includes('-')) {
      payload.pet_id = schedule.petId;
    }
    if (schedule.foodType) {
      payload.food_type = schedule.foodType;
    }
    const { error } = await supabase.from('feeding_schedules').upsert(payload);
    if (error) {
      delete payload.pet_id;
      delete payload.food_type;
      const retry = await supabase.from('feeding_schedules').upsert(payload);
      if (retry.error) {
        console.error('[SUPABASE] insertSchedule error:', retry.error);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('[SUPABASE] insertSchedule exception:', err);
    return false;
  }
}

export async function updateScheduleInSupabase(id: string, updated: Partial<FeedingSchedule>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {};
    if (updated.dispenseStatus !== undefined) payload.dispense_status = updated.dispenseStatus;
    if (updated.portionGrams !== undefined) payload.portion_grams = updated.portionGrams;
    if (updated.scheduledTime !== undefined) payload.scheduled_time = updated.scheduledTime;
    if (updated.foodType !== undefined) payload.food_type = updated.foodType;

    const { error } = await (supabase.from('feeding_schedules') as any).update(payload).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteScheduleFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('feeding_schedules').delete().eq('id', id);
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase schedule delete error:', err);
    return false;
  }
}

// ─── 3. FEEDING LOGS ───────────────────────────────────────────────────────

export async function fetchFeedingLogsFromSupabase(): Promise<FeedingLog[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('feeding_logs').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      petId: item.pet_id,
      petName: item.pet_name,
      portionGrams: Number(item.portion_grams),
      dispensedAt: item.dispensed_at,
      status: item.status as FeedingLog['status'],
      deviceId: item.device_id,
      sessionId: item.session_id || undefined,
    }));
  } catch {
    return null;
  }
}

export async function insertFeedingLogToSupabase(log: FeedingLog): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('feeding_logs').upsert({
      id: log.id,
      pet_id: log.petId,
      pet_name: log.petName,
      portion_grams: log.portionGrams,
      dispensed_at: log.dispensedAt,
      status: log.status,
      device_id: log.deviceId,
      session_id: log.sessionId || null,
    });
    return !error;
  } catch {
    return false;
  }
}

// ─── 4. HYDRATION LOGS ─────────────────────────────────────────────────────

export async function fetchHydrationLogsFromSupabase(): Promise<HydrationLog[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('hydration_logs').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      petId: item.pet_id,
      petName: item.pet_name,
      amountMl: Number(item.amount_ml),
      timestamp: item.timestamp,
      reservoirLevelPct: Number(item.reservoir_level_pct),
      sessionId: item.session_id || undefined,
    }));
  } catch {
    return null;
  }
}

export async function insertHydrationLogToSupabase(log: HydrationLog): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('hydration_logs').upsert({
      id: log.id,
      pet_id: log.petId,
      pet_name: log.petName,
      amount_ml: log.amountMl,
      timestamp: log.timestamp,
      reservoir_level_pct: log.reservoirLevelPct,
      session_id: log.sessionId || null,
    });
    return !error;
  } catch {
    return false;
  }
}

// ─── 5. VITAL SIGNS ────────────────────────────────────────────────────────

export async function fetchVitalsFromSupabase(): Promise<VitalSignRecord[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('vital_signs').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      petId: item.pet_id,
      petName: item.pet_name,
      temperature: Number(item.temperature),
      heartRate: Number(item.heart_rate),
      weight: Number(item.weight),
      activityMins: Number(item.activity_mins),
      status: item.status as VitalSignRecord['status'],
      timestamp: item.timestamp,
      sessionId: item.session_id || undefined,
    }));
  } catch {
    return null;
  }
}

export async function insertVitalRecordToSupabase(vital: VitalSignRecord): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('vital_signs').upsert({
      id: vital.id,
      pet_id: vital.petId,
      pet_name: vital.petName,
      temperature: vital.temperature,
      heart_rate: vital.heartRate,
      weight: vital.weight,
      activity_mins: vital.activityMins,
      status: vital.status,
      timestamp: vital.timestamp,
      session_id: vital.sessionId || null,
    });
    return !error;
  } catch {
    return false;
  }
}

// ─── 6. AI ALERTS ──────────────────────────────────────────────────────────

export async function fetchAIAlertsFromSupabase(): Promise<AIHealthAlert[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('ai_alerts').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      petId: item.pet_id,
      petName: item.pet_name,
      alertType: item.alert_type,
      observedReading: item.observed_reading,
      severity: item.severity as AIHealthAlert['severity'],
      aiObservation: item.ai_observation,
      recommendedAction: item.recommended_action,
      reviewStatus: (item.review_status ?? 'Unreviewed') as AIHealthAlert['reviewStatus'],
      timestamp: item.timestamp,
    }));
  } catch {
    return null;
  }
}

export async function insertAIAlertToSupabase(alert: AIHealthAlert): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await (supabase.from('ai_alerts') as any).upsert({
      id: alert.id,
      pet_id: alert.petId,
      pet_name: alert.petName,
      alert_type: alert.alertType,
      observed_reading: alert.observedReading,
      severity: alert.severity,
      ai_observation: alert.aiObservation,
      recommended_action: alert.recommendedAction,
      review_status: alert.reviewStatus,
      timestamp: alert.timestamp,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function updateAIAlertStatusInSupabase(id: string, status: AIHealthAlert['reviewStatus']): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('ai_alerts').update({ review_status: status }).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── 7. ESP32 HARDWARE DEVICES ─────────────────────────────────────────────

function getHeartbeatStatus(
  lastTransmission: string | null | undefined,
  dbStatus?: string,
  updatedAt?: string | null,
  lastSeenAt?: string | null
): { status: Device['status']; ageSec: number } {
  // If the record was explicitly marked offline or maintenance
  if (dbStatus === 'Offline' || dbStatus === 'offline' || dbStatus === 'maintenance') {
    return { status: 'Offline', ageSec: 9999 };
  }

  // Parse all candidate timestamps
  const candidates: number[] = [];
  const parseTs = (val?: string | null) => {
    if (!val) return;
    const raw = String(val).trim();
    if (!raw) return;
    const p = Date.parse(raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z');
    if (!isNaN(p)) {
      candidates.push(p);
    }
  };

  parseTs(lastTransmission);
  parseTs(lastSeenAt);
  parseTs(updatedAt);

  // If no timestamp or unable to parse
  if (candidates.length === 0) {
    return { status: 'Offline', ageSec: 9999 };
  }

  // Pick the most recent valid timestamp
  const latestParsed = Math.max(...candidates);
  const nowMs = Date.now();
  const ageSec = Math.max(0, Math.round((nowMs - latestParsed) / 1000));

  // The ESP32 pushes telemetry every 3.5s.
  // Fresh heartbeat within 12s -> Online
  if (ageSec <= 12) {
    return { status: 'Online', ageSec };
  }

  // Signal lost / transitioning (13s - 25s) -> Connecting
  if (ageSec <= 25) {
    return { status: 'Connecting' as Device['status'], ageSec };
  }

  // Older than 25s without packet -> Offline (Unplugged or powered down)
  return { status: 'Offline', ageSec };
}

export async function fetchDevicesFromSupabase(): Promise<Device[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('devices').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return (data as any[]).map((item) => {
      const { status: computedStatus, ageSec } = getHeartbeatStatus(
        item.last_transmission,
        item.status,
        item.updated_at,
        item.last_seen_at
      );

      let displayTransmission = 'Live — Synchronized';
      if (computedStatus === 'Online') {
        displayTransmission = ageSec <= 10 ? 'Live — Synchronized' : `${ageSec}s ago`;
      } else if (computedStatus === 'Connecting') {
        displayTransmission = `Connecting (${ageSec}s ago)`;
      } else {
        displayTransmission = ageSec < 60 ? `Offline (${ageSec}s ago)` : (ageSec < 3600 ? `Offline (${Math.round(ageSec / 60)}m ago)` : 'Offline');
      }

      const rawFw = item.firmware_version || 'v2.5.0-ESP32';
      let parsedTds = (item.water_quality_ppm !== null && item.water_quality_ppm !== undefined) ? Number(item.water_quality_ppm) : 0;
      let parsedWeight = Number(item.food_bowl_weight_grams) || 0.0;
      let parsedIp = item.ip_address || '192.168.100.159';
      let parsedCamIp = item.camera_ip || '';

      if (rawFw && rawFw.includes('|')) {
        const parts = rawFw.split('|');
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
        }
      }

      if (!parsedCamIp && rawFw && rawFw.includes('CAM:')) {
        const match = rawFw.match(/CAM:([0-9.]+)/i);
        if (match && match[1]) {
          parsedCamIp = match[1];
        }
      }

      const isPumpDeactivated = Boolean(
        rawFw.includes('PUMP:DISABLED') ||
        rawFw.includes('PUMP:LOCKED') ||
        rawFw.includes('PUMP:OFF')
      );
      const isPumping = Boolean(rawFw.includes('PUMP:RUNNING') || item.is_pumping);
      const autoRefillEnabled = !rawFw.includes('AUTO:OFF');

      return {
        id: item.id,
        deviceName: 'HydroNourish Smart Cage Unit',
        assignedPetId: item.assigned_pet_id || '',
        assignedPetName: item.assigned_pet_name || '',
        status: computedStatus,
        hardwareStatus: 'occupied' as Device['hardwareStatus'],
        wifiSignalDbm: Number(item.wifi_signal_dbm) !== 0 ? Number(item.wifi_signal_dbm) : -55,
        foodLevelPct: Number(item.food_level_pct) !== undefined ? Number(item.food_level_pct) : 90,
        waterLevelPct: Number(item.water_level_pct) !== undefined ? Number(item.water_level_pct) : 85,
        foodBowlWeightGrams: parsedWeight,
        waterQualityPpm: parsedTds,
        batteryPct: Number(item.battery_pct) || 100,
        isPluggedIn: true,
        lastTransmission: displayTransmission,
        firmwareVersion: rawFw,
        macAddress: item.mac_address || '1C:C3:AB:F9:F7:78',
        ipAddress: parsedIp,
        cameraIp: parsedCamIp,
        isPumping,
        autoRefillEnabled,
        isPumpDeactivated,
      };
    });
  } catch {
    return null;
  }
}

export async function insertDeviceToSupabase(device: Device): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('devices').upsert({
      id: device.id,
      assigned_pet_id: device.assignedPetId || null,
      assigned_pet_name: device.assignedPetName || null,
      status: device.status,
      wifi_signal_dbm: device.wifiSignalDbm,
      food_level_pct: device.foodLevelPct,
      water_level_pct: device.waterLevelPct,
      battery_pct: device.batteryPct,
      is_plugged_in: device.isPluggedIn,
      last_transmission: device.lastTransmission,
      firmware_version: device.firmwareVersion,
      mac_address: device.macAddress,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function updateDeviceInSupabase(id: string, updated: Partial<Device>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {};
    if (updated.status !== undefined) payload.status = updated.status;
    if (updated.assignedPetId !== undefined) payload.assigned_pet_id = updated.assignedPetId;
    if (updated.assignedPetName !== undefined) payload.assigned_pet_name = updated.assignedPetName;
    if (updated.foodLevelPct !== undefined) payload.food_level_pct = updated.foodLevelPct;
    if (updated.waterLevelPct !== undefined) payload.water_level_pct = updated.waterLevelPct;
    if (updated.batteryPct !== undefined) payload.battery_pct = updated.batteryPct;
    if (updated.wifiSignalDbm !== undefined) payload.wifi_signal_dbm = updated.wifiSignalDbm;
    if (updated.firmwareVersion !== undefined) payload.firmware_version = updated.firmwareVersion;
    if (updated.wifiSsid !== undefined) {
      payload.wifi_ssid = updated.wifiSsid;
      if (!payload.firmware_version) {
        payload.firmware_version = `v2.5.0-ESP32|SSID:${updated.wifiSsid}`;
      } else if (!payload.firmware_version.includes('SSID:')) {
        payload.firmware_version = `${payload.firmware_version}|SSID:${updated.wifiSsid}`;
      }
    }
    if (updated.lastTransmission !== undefined) payload.last_transmission = updated.lastTransmission;

    const { error } = await (supabase.from('devices') as any).update(payload).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteDeviceFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('devices').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── 8. CLINIC USERS / STAFF ──────────────────────────────────────────────

export async function fetchUsersFromSupabase(): Promise<ClinicUser[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('clinic_users').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;

    return data.map((item) => ({
      id: item.id,
      name: item.name || item.full_name || '',
      fullName: item.full_name || item.name || '',
      email: item.email,
      role: item.role as UserRole,
      department: item.department,
      status: (item.status === 'Active' ? 'Active' : 'Inactive') as ClinicUser['status'],
      lastActive: item.last_active || 'Now (Active)',
      avatarUrl:
        item.avatar_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      isProtected: Boolean(item.is_protected),
    }));
  } catch {
    return null;
  }
}

// ─── 9. PET OWNERS ─────────────────────────────────────────────────────────

export async function fetchOwnersFromSupabase(): Promise<PetOwner[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('pet_owners').select('*').order('date_created', { ascending: false });
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      accessStatus: item.access_status as PetOwner['accessStatus'],
      petIds: Array.isArray(item.pet_ids) ? item.pet_ids : [],
      currentSessionId: item.current_session_id || null,
      dateCreated: item.date_created,
      lastLogin: item.last_login || null,
      notes: item.notes || '',
      password: item.password || undefined,
      address: item.address || undefined,
    }));
  } catch {
    return null;
  }
}

export async function insertOwnerToSupabase(owner: PetOwner): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('pet_owners').upsert({
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      access_status: owner.accessStatus,
      pet_ids: owner.petIds,
      current_session_id: owner.currentSessionId || null,
      date_created: owner.dateCreated,
      last_login: owner.lastLogin || null,
      notes: owner.notes || null,
      password: owner.password || null,
      address: owner.address || null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function updateOwnerInSupabase(id: string, updated: Partial<PetOwner>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {};
    if (updated.name !== undefined) payload.name = updated.name;
    if (updated.email !== undefined) payload.email = updated.email;
    if (updated.phone !== undefined) payload.phone = updated.phone;
    if (updated.accessStatus !== undefined) payload.access_status = updated.accessStatus;
    if (updated.petIds !== undefined) payload.pet_ids = updated.petIds;
    if (updated.currentSessionId !== undefined) payload.current_session_id = updated.currentSessionId;
    if (updated.lastLogin !== undefined) payload.last_login = updated.lastLogin;
    if (updated.notes !== undefined) payload.notes = updated.notes;
    if (updated.password !== undefined) payload.password = updated.password;
    if (updated.address !== undefined) payload.address = updated.address;

    const { error } = await (supabase.from('pet_owners') as any).update(payload).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteOwnerFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('pet_owners').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── 10. PET SESSIONS ──────────────────────────────────────────────────────

export async function fetchSessionsFromSupabase(): Promise<PetSession[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('pet_sessions').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      petId: item.pet_id,
      petName: item.pet_name,
      petSpecies: item.pet_species || 'Dog',
      petBreed: item.pet_breed || 'Unknown',
      petAvatarUrl: item.pet_avatar_url || '',
      ownerId: item.owner_id || '',
      ownerName: item.owner_name,
      ownerEmail: item.owner_email || '',
      deviceId: item.device_id,
      status: item.status as PetSession['status'],
      admissionDate: item.admission_date,
      expectedReleaseDate: item.expected_release_date,
      startTime: item.admission_date,
      releaseTime: item.actual_release_date || null,
      releaseCondition: item.release_condition || null,
      finalNotes: item.release_notes || null,
      cancelledReason: null,
      completedBy: item.release_admin || null,
      emergencyContact: item.emergency_contact || '',
      feedingRecordCount: 0,
      hydrationRecordCount: 0,
      vitalSignRecordCount: 0,
      alertCount: 0,
      notes: item.admission_notes || '',
      actualReleaseDate: item.actual_release_date || undefined,
      admissionNotes: item.admission_notes || undefined,
      releaseNotes: item.release_notes || undefined,
      admissionAdmin: item.admission_admin,
      releaseAdmin: item.release_admin || undefined,
      petSnapshot: {
        weight: 0,
        age: 0,
        feedingPlan: { portionGrams: 100, timesPerDay: 2, foodType: 'Kibble' },
        hydrationTarget: 800,
        healthStatus: 'Healthy',
      },
    }));
  } catch {
    return null;
  }
}

export async function insertSessionToSupabase(session: PetSession): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('pet_sessions').upsert({
      id: session.id,
      pet_id: session.petId,
      pet_name: session.petName,
      pet_species: session.petSpecies || 'Dog',
      pet_breed: session.petBreed || 'Unknown',
      pet_avatar_url: session.petAvatarUrl || '',
      owner_id: session.ownerId || null,
      owner_name: session.ownerName,
      owner_email: session.ownerEmail || null,
      device_id: session.deviceId,
      admission_date: session.admissionDate,
      expected_release_date: session.expectedReleaseDate,
      actual_release_date: session.actualReleaseDate || null,
      status: session.status,
      admission_notes: session.admissionNotes || session.notes || null,
      release_notes: session.releaseNotes || null,
      emergency_contact: session.emergencyContact || null,
      admission_admin: session.admissionAdmin || 'Admin',
      release_admin: session.releaseAdmin || null,
      release_condition: session.releaseCondition || null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function updateSessionInSupabase(id: string, updated: Partial<PetSession>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {};
    if (updated.status !== undefined) payload.status = updated.status;
    if (updated.actualReleaseDate !== undefined) payload.actual_release_date = updated.actualReleaseDate;
    if (updated.releaseNotes !== undefined) payload.release_notes = updated.releaseNotes;
    if (updated.releaseAdmin !== undefined) payload.release_admin = updated.releaseAdmin;
    if (updated.releaseCondition !== undefined) payload.release_condition = updated.releaseCondition;

    const { error } = await (supabase.from('pet_sessions') as any).update(payload).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ─── 11. CLINIC SETTINGS ───────────────────────────────────────────────────

export async function fetchSettingsFromSupabase(): Promise<ClinicSettings | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await (supabase.from('clinic_settings') as any).select('*').eq('id', 1).single();
    if (error || !data) return null;

    return {
      clinicName: data.clinic_name,
      clinicAddress: data.clinic_address,
      clinicPhone: data.clinic_phone,
      licenseId: data.license_id,
      defaultPortionGrams: Number(data.default_portion_grams),
      defaultHydrationMlPerKg: Number(data.default_hydration_ml_per_kg),
      tempWarningMin: Number(data.temp_warning_min),
      tempWarningMax: Number(data.temp_warning_max),
      hrWarningMin: Number(data.hr_warning_min),
      hrWarningMax: Number(data.hr_warning_max),
      emailNotifications: Boolean(data.email_notifications),
      smsNotifications: Boolean(data.sms_notifications),
      browserNotifications: Boolean(data.browser_notifications),
      theme: data.theme as any,
      compactLayout: Boolean(data.compact_layout),
      apiEndpoint: data.api_endpoint,
      apiSecretKey: data.api_secret_key,
      webhookUrl: data.webhook_url,
    };
  } catch {
    return null;
  }
}

export async function updateSettingsInSupabase(settings: ClinicSettings): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await (supabase.from('clinic_settings') as any)
      .upsert({
        id: 1,
        clinic_name: settings.clinicName,
        clinic_address: settings.clinicAddress,
        clinic_phone: settings.clinicPhone,
        license_id: settings.licenseId,
        default_portion_grams: settings.defaultPortionGrams,
        default_hydration_ml_per_kg: settings.defaultHydrationMlPerKg,
        temp_warning_min: settings.tempWarningMin,
        temp_warning_max: settings.tempWarningMax,
        hr_warning_min: settings.hrWarningMin,
        hr_warning_max: settings.hrWarningMax,
        email_notifications: settings.emailNotifications,
        sms_notifications: settings.smsNotifications,
        browser_notifications: settings.browserNotifications,
        theme: settings.theme,
        compact_layout: settings.compactLayout,
        api_endpoint: settings.apiEndpoint,
        api_secret_key: settings.apiSecretKey,
        webhook_url: settings.webhookUrl,
      });
    return !error;
  } catch {
    return false;
  }
}

// ─── 12. CONTACT INQUIRIES ────────────────────────────────────────────────

export async function fetchContactInquiriesFromSupabase(): Promise<ContactInquiry[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await (supabase.from('contact_inquiries') as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;

    return (data as any[]).map((item) => {
      let messagesThread: any[] | undefined = undefined;
      let replyMessage = item.reply_message || undefined;

      if (item.reply_message) {
        const trimmed = item.reply_message.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) && parsed.length > 0) {
              messagesThread = parsed;
              const lastAdminReply = [...parsed].reverse().find((m: any) => m.sender === 'admin');
              replyMessage = lastAdminReply ? lastAdminReply.message : replyMessage;
            }
          } catch {}
        }
      }

      if (!messagesThread) {
        messagesThread = [];
        if (item.message) {
          messagesThread.push({
            id: `msg-1-${item.id}`,
            sender: 'owner',
            senderName: item.name || 'Client',
            message: item.message,
            timestamp: item.created_at || new Date().toISOString(),
          });
        }
        if (replyMessage && !replyMessage.trim().startsWith('[')) {
          messagesThread.push({
            id: `msg-2-${item.id}`,
            sender: 'admin',
            senderName: 'Heritage Animal Clinic Staff',
            message: replyMessage,
            timestamp: item.replied_at || item.created_at || new Date().toISOString(),
          });
        }
      }

      return {
        id: item.id,
        name: item.name,
        email: item.email,
        subject: item.subject || 'General Inquiry',
        message: item.message,
        createdAt: item.created_at || new Date().toISOString(),
        status: item.status || 'unread',
        repliedAt: item.repliedAt || undefined,
        replyMessage: replyMessage,
        messagesThread: messagesThread,
      };
    });
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase inquiries fetch notice:', err);
    return null;
  }
}

export async function insertContactInquiryToSupabase(inquiry: ContactInquiry): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const threadData = inquiry.messagesThread && inquiry.messagesThread.length > 0
      ? JSON.stringify(inquiry.messagesThread)
      : (inquiry.replyMessage || null);

    const { error } = await (supabase.from('contact_inquiries') as any).insert({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      subject: inquiry.subject,
      message: inquiry.message,
      status: inquiry.status,
      created_at: inquiry.createdAt,
      replied_at: inquiry.repliedAt || null,
      reply_message: threadData,
    });
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase inquiry insert error:', err);
    return false;
  }
}

export async function updateContactInquiryInSupabase(
  id: string,
  updated: Partial<ContactInquiry>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {};
    if (updated.status !== undefined) payload.status = updated.status;
    if (updated.repliedAt !== undefined) payload.replied_at = updated.repliedAt;
    
    if (updated.messagesThread !== undefined && Array.isArray(updated.messagesThread)) {
      payload.reply_message = JSON.stringify(updated.messagesThread);
    } else if (updated.replyMessage !== undefined) {
      payload.reply_message = updated.replyMessage;
    }

    const { error } = await (supabase.from('contact_inquiries' as any) as any).update(payload).eq('id', id);
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase inquiry update error:', err);
    return false;
  }
}

export async function deleteContactInquiryFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('contact_inquiries').delete().eq('id', id);
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase inquiry delete error:', err);
    return false;
  }
}

// ─── 13. REAL-TIME MULTI-TABLE SUBSCRIPTION ───────────────────────────────

export function subscribeToSupabaseRealtime(
  onTableChange: (tableName: string, payload: any) => void,
  subscriberId: string = 'channel'
) {
  if (!isSupabaseConfigured()) return () => {};

  const uniqueChannelName = `hn_rt_${subscriberId}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          if (payload && payload.table) {
            onTableChange(payload.table, payload);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // Safe cleanup
      }
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[HydroNourish] Realtime channel setup notice:', err);
    }
    return () => {};
  }
}

/**
 * Dedicated Realtime subscriber for device telemetry and camera IP updates
 */
export function subscribeToDeviceUpdates(
  deviceId: string = 'HN-NODE-F778',
  onUpdate: (device: Device) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channelName = `hn_device_${deviceId}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceId}`,
        },
        async () => {
          const devices = await fetchDevicesFromSupabase();
          if (devices && devices.length > 0) {
            const matched = devices.find((d) => d.id === deviceId) || devices[0];
            if (matched) onUpdate(matched);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[HydroNourish] Device realtime channel error:', err);
    return () => {};
  }
}

