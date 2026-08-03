/**
 * HydroNourish — Dynamic ESP32 Smart Cage Telemetry Engine
 * Heritage Animal Clinic Capstone Project
 *
 * Simulates real-time telemetry streaming from ESP32 cage units.
 * Evaluates readings against clinical bounds and dynamically produces
 * live vital signs, hydration records, and AI observations.
 */

import { generateAIVeterinaryObservation, PetTelemetryInput } from './aiService';
import { insertVitalRecordToSupabase, insertAIAlertToSupabase, updateDeviceInSupabase } from './supabase';
import type { VitalSignRecord, AIHealthAlert, Device, Pet } from '../types';

export interface TelemetryReading {
  temperature: number;
  heartRate: number;
  waterConsumedMl: number;
  foodConsumedGrams: number;
  waterLevelPct: number;
  foodLevelPct: number;
}

/**
 * Generate a realistic telemetry delta reading based on current levels.
 */
export function generateTelemetryDelta(currentDevice: Device, currentPet?: Pet): TelemetryReading {
  const baseTemp = currentPet?.latestVitals?.temperature || 38.5;
  const baseHr = currentPet?.latestVitals?.heartRate || 85;

  // Small natural variance
  const tempVariance = (Math.random() * 0.4 - 0.2); // ±0.2°C
  const hrVariance = Math.floor(Math.random() * 8 - 4); // ±4 bpm

  // 15% chance of small hydration drink event
  const drankWater = Math.random() < 0.15;
  const waterConsumedMl = drankWater ? Math.floor(Math.random() * 35 + 15) : 0;

  // Calculate new reservoir percentage
  const newWaterPct = Math.max(0, currentDevice.waterLevelPct - (waterConsumedMl > 0 ? 2 : 0));
  const newFoodPct = Math.max(0, currentDevice.foodLevelPct - (Math.random() < 0.1 ? 1 : 0));

  return {
    temperature: Number((baseTemp + tempVariance).toFixed(1)),
    heartRate: Math.max(60, Math.min(180, baseHr + hrVariance)),
    waterConsumedMl,
    foodConsumedGrams: 0,
    waterLevelPct: newWaterPct,
    foodLevelPct: newFoodPct,
  };
}

/**
 * Process a dynamic telemetry payload:
 * 1. Creates a VitalSignRecord
 * 2. Runs AI observation if thresholds are breached
 * 3. Persists to database
 */
export async function processTelemetryPayload(
  pet: Pet,
  device: Device,
  reading: TelemetryReading,
  onNewVital: (vital: VitalSignRecord) => void,
  onNewAlert: (alert: AIHealthAlert) => void,
  onDeviceUpdate: (updated: Partial<Device>) => void
): Promise<void> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const vitalId = `VIT-${Date.now().toString().slice(-4)}`;

  const isAnomalous = reading.temperature > 39.2 || reading.temperature < 37.5 || reading.heartRate > 130 || reading.heartRate < 60;
  const vitalStatus: VitalSignRecord['status'] = isAnomalous ? 'Warning' : 'Normal';

  const newVital: VitalSignRecord = {
    id: vitalId,
    petId: pet.id,
    petName: pet.name,
    temperature: reading.temperature,
    heartRate: reading.heartRate,
    weight: pet.weight,
    activityMins: Math.floor(Math.random() * 15 + 30),
    status: vitalStatus,
    timestamp: 'Just now',
  };

  onNewVital(newVital);
  await insertVitalRecordToSupabase(newVital);

  // Update Device levels
  const devUpdate: Partial<Device> = {
    waterLevelPct: reading.waterLevelPct,
    foodLevelPct: reading.foodLevelPct,
    lastTransmission: 'Just now',
  };
  onDeviceUpdate(devUpdate);
  await updateDeviceInSupabase(device.id, devUpdate);

  // Trigger AI Observation if vitals are anomalous or water intake threshold reached
  if (isAnomalous || (reading.waterConsumedMl > 0 && Math.random() < 0.3)) {
    const input: PetTelemetryInput = {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weightKg: pet.weight,
      temperatureC: reading.temperature,
      heartRateBpm: reading.heartRate,
      waterConsumedMl: reading.waterConsumedMl,
      waterTargetMl: pet.hydrationTarget,
    };

    const aiRes = await generateAIVeterinaryObservation(input);

    const alertId = `ALT-${Date.now().toString().slice(-4)}`;
    const newAlert: AIHealthAlert = {
      id: alertId,
      petId: pet.id,
      petName: pet.name,
      alertType: isAnomalous ? 'Vital Sign Anomaly Detected' : 'Hydration Intake Logged',
      observedReading: `Temp: ${reading.temperature}°C, HR: ${reading.heartRate} bpm`,
      severity: aiRes.severity,
      aiObservation: aiRes.observationText,
      recommendedAction: aiRes.recommendedAction,
      reviewStatus: 'Unreviewed',
      timestamp: timestamp,
    };

    onNewAlert(newAlert);
    await insertAIAlertToSupabase(newAlert);
  }
}
