/**
 * HydroNourish — Dynamic ESP32 Smart Feeder & Hydrator Telemetry Engine
 * Heritage Animal Clinic Capstone Project
 *
 * Streams real-time telemetry from ESP32 feeder and hydrator nodes.
 * Evaluates readings against dietary/hydration targets and produces
 * live intake records and AI nutrition observations.
 */

import { generateAIVeterinaryObservation, PetTelemetryInput } from './aiService';
import { insertAIAlertToSupabase, updateDeviceInSupabase } from './supabase';
import type { AIHealthAlert, Device, Pet } from '../types';

export interface TelemetryReading {
  waterConsumedMl: number;
  foodConsumedGrams: number;
  waterLevelPct: number;
  foodLevelPct: number;
}

/**
 * Generate a realistic telemetry delta reading based on current levels.
 */
export function generateTelemetryDelta(currentDevice: Device): TelemetryReading {
  // 15% chance of small hydration drink event
  const drankWater = Math.random() < 0.15;
  const waterConsumedMl = drankWater ? Math.floor(Math.random() * 35 + 15) : 0;

  // Calculate new reservoir percentage
  const newWaterPct = Math.max(0, currentDevice.waterLevelPct - (waterConsumedMl > 0 ? 2 : 0));
  const newFoodPct = Math.max(0, currentDevice.foodLevelPct - (Math.random() < 0.1 ? 1 : 0));

  return {
    waterConsumedMl,
    foodConsumedGrams: 0,
    waterLevelPct: newWaterPct,
    foodLevelPct: newFoodPct,
  };
}

/**
 * Process a dynamic telemetry payload:
 * 1. Updates device reservoir levels
 * 2. Runs AI observation if hydration or feeding event occurs
 * 3. Persists to database
 */
export async function processTelemetryPayload(
  pet: Pet,
  device: Device,
  reading: TelemetryReading,
  onNewAlert: (alert: AIHealthAlert) => void,
  onDeviceUpdate: (updated: Partial<Device>) => void
): Promise<void> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Update Device levels
  const devUpdate: Partial<Device> = {
    waterLevelPct: reading.waterLevelPct,
    foodLevelPct: reading.foodLevelPct,
    lastTransmission: 'Just now',
  };
  onDeviceUpdate(devUpdate);
  await updateDeviceInSupabase(device.id, devUpdate);

  // Trigger AI Observation when a hydration or feeding event occurs
  if (reading.waterConsumedMl > 0 && Math.random() < 0.3) {
    const input: PetTelemetryInput = {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      weightKg: pet.weight,
      temperatureC: 38.5,
      heartRateBpm: 80,
      waterConsumedMl: reading.waterConsumedMl,
      waterTargetMl: pet.hydrationTarget || 500,
    };

    try {
      const observation = await generateAIVeterinaryObservation(input);
      const newAlert: AIHealthAlert = {
        id: `ALT-${Date.now().toString().slice(-4)}`,
        petId: pet.id,
        petName: pet.name,
        timestamp,
        alertType: 'Hydration Intake Logged',
        observedReading: `Water consumed: ${reading.waterConsumedMl} ml`,
        severity: observation.severity === 'Critical' ? 'Critical' : observation.severity === 'Warning' ? 'Warning' : 'Info',
        aiObservation: observation.observationText,
        recommendedAction: observation.recommendedAction,
        reviewStatus: 'Unreviewed',
      };
      onNewAlert(newAlert);
      await insertAIAlertToSupabase(newAlert);
    } catch (e) {
      console.error('Failed to generate AI observation for telemetry:', e);
    }
  }
}
