/**
 * ============================================================================
 * HYDRO NOURISH — VISION ANALYTICS & TELEMETRY SERVICE
 * ============================================================================
 * Manages optical scan persistence, calculates dwell time metrics,
 * formats Recharts timelines, and synchronizes critical alerts to Supabase.
 * ============================================================================
 */

import { PetVisionAnalyticsRecord, AIHealthAlert } from '../types';
import { insertAIAlertToSupabase } from './supabase';

const STORAGE_KEY = 'hn_vision_analytics_v1';

export interface VisionDailySummary {
  totalVisits: number;
  feedingMinutes: number;
  hydrationMinutes: number;
  averageHealthScore: number;
  averageConfidence: number;
  lastVisitTime: string;
  activityBreakdown: Array<{ name: string; value: number; color: string }>;
  hourlyTimeline: Array<{ hour: string; feeding: number; hydrating: number; resting: number }>;
}

/**
 * Seed realistic records for today if storage is empty
 */
function getInitialSeedRecords(): PetVisionAnalyticsRecord[] {
  const now = new Date();
  const formatTime = (hoursAgo: number, minutesOffset = 0) => {
    const d = new Date(now.getTime() - hoursAgo * 3600000 + minutesOffset * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return [
    {
      id: 'VA-INIT-01',
      petId: 'PET-001',
      petName: 'Max',
      species: 'Canine (Dog)',
      breed: 'Golden Retriever',
      timestamp: formatTime(6, 15),
      confidenceScore: 98.4,
      activity: 'Feeding',
      healthScore: 96,
      dwellTimeSeconds: 240,
      ambientLux: 180,
      actionTriggered: 'Auto-Dispensed',
      actionDetails: 'AI Autopilot dispensed 75g morning ration',
      clinicalNotes: ['Eager consumption pattern', 'Posture alert and erect'],
      provider: 'Gemini 1.5 Vision',
      boundingBox: { top: 20, left: 24, width: 54, height: 60 }
    },
    {
      id: 'VA-INIT-02',
      petId: 'PET-001',
      petName: 'Max',
      species: 'Canine (Dog)',
      breed: 'Golden Retriever',
      timestamp: formatTime(4, 30),
      confidenceScore: 97.9,
      activity: 'Hydrating',
      healthScore: 95,
      dwellTimeSeconds: 95,
      ambientLux: 195,
      actionTriggered: 'Auto-Refilled',
      actionDetails: 'Refilling drinking water (10s pump active)',
      clinicalNotes: ['Continuous hydration rhythm', 'Normal oral clearance'],
      provider: 'Gemini 1.5 Vision',
      boundingBox: { top: 22, left: 26, width: 52, height: 58 }
    },
    {
      id: 'VA-INIT-03',
      petId: 'PET-001',
      petName: 'Max',
      species: 'Canine (Dog)',
      breed: 'Golden Retriever',
      timestamp: formatTime(2, 45),
      confidenceScore: 99.1,
      activity: 'Stationary / Resting',
      healthScore: 98,
      dwellTimeSeconds: 720,
      ambientLux: 160,
      actionTriggered: 'None',
      clinicalNotes: ['Sternal recumbency near station', 'Respiratory rate serene (~20 bpm)'],
      provider: 'HydroNourish Neural Edge',
      boundingBox: { top: 26, left: 18, width: 62, height: 52 }
    },
    {
      id: 'VA-INIT-04',
      petId: 'PET-001',
      petName: 'Max',
      species: 'Canine (Dog)',
      breed: 'Golden Retriever',
      timestamp: formatTime(1, 10),
      confidenceScore: 98.6,
      activity: 'Approaching Bowl',
      healthScore: 96,
      dwellTimeSeconds: 65,
      ambientLux: 140,
      actionTriggered: 'Auto-Dispensed',
      actionDetails: 'AI verified meal schedule; dispensed 75g portion',
      clinicalNotes: ['Target pet confirmed', 'Steady gait'],
      provider: 'Gemini 1.5 Vision',
      boundingBox: { top: 18, left: 22, width: 56, height: 62 }
    }
  ];
}

/**
 * Load all stored vision analytics records from LocalStorage
 */
export function getVisionAnalyticsRecords(petId?: string): PetVisionAnalyticsRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let records: PetVisionAnalyticsRecord[] = [];
    if (raw) {
      records = JSON.parse(raw);
    } else {
      records = getInitialSeedRecords();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    if (petId && petId !== 'All') {
      return records.filter((r) => r.petId === petId);
    }
    return records;
  } catch {
    return getInitialSeedRecords();
  }
}

/**
 * Persist a new vision telemetry observation record
 */
export async function saveVisionAnalyticsRecord(
  event: Omit<PetVisionAnalyticsRecord, 'id' | 'timestamp'>
): Promise<PetVisionAnalyticsRecord> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const id = `VA-${Date.now().toString().slice(-6)}`;

  const newRecord: PetVisionAnalyticsRecord = {
    ...event,
    id,
    timestamp
  };

  try {
    const current = getVisionAnalyticsRecords();
    const updated = [newRecord, ...current.slice(0, 75)]; // retain 75 records
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to persist vision record in localStorage', err);
  }

  // If distress or high-priority anomaly was detected, also log to Supabase ai_alerts!
  if (event.actionTriggered === 'Distress Alert' || event.healthScore < 70) {
    const alert: AIHealthAlert = {
      id: `ALT-VIS-${Date.now().toString().slice(-4)}`,
      petId: event.petId || 'PET-001',
      petName: event.petName || 'Patient',
      alertType: 'Vision Optical Anomaly',
      observedReading: `Visual Health Score: ${event.healthScore}/100 • Behavior: ${event.activity}`,
      severity: event.healthScore < 60 ? 'Critical' : 'Warning',
      aiObservation: event.clinicalNotes.join(' • ') || 'Abnormal physical posture or distress observed on camera feed.',
      recommendedAction: event.actionDetails || 'Immediate veterinary evaluation of feeding posture recommended.',
      timestamp,
      reviewStatus: 'Unreviewed'
    };

    insertAIAlertToSupabase(alert).catch(() => {});
  }

  return newRecord;
}

/**
 * Clear vision history
 */
export function clearVisionAnalyticsHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Calculate aggregated daily station metrics & hourly timeline
 */
export function calculateDailyVisionSummary(petId?: string): VisionDailySummary {
  const records = getVisionAnalyticsRecords(petId);

  if (records.length === 0) {
    return {
      totalVisits: 0,
      feedingMinutes: 0,
      hydrationMinutes: 0,
      averageHealthScore: 95,
      averageConfidence: 98,
      lastVisitTime: 'None today',
      activityBreakdown: [
        { name: 'Feeding', value: 0, color: '#10b981' },
        { name: 'Hydrating', value: 0, color: '#0ea5e9' },
        { name: 'Resting', value: 0, color: '#8b5cf6' },
        { name: 'Approaching', value: 0, color: '#f59e0b' }
      ],
      hourlyTimeline: []
    };
  }

  let totalFeedingSec = 0;
  let totalHydrationSec = 0;
  let sumHealth = 0;
  let sumConfidence = 0;

  let feedingCount = 0;
  let hydratingCount = 0;
  let restingCount = 0;
  let approachingCount = 0;

  // Buckets for hourly timeline (last 8 hours)
  const hourBuckets: Record<string, { feeding: number; hydrating: number; resting: number }> = {};
  const currentHour = new Date().getHours();
  for (let i = 7; i >= 0; i--) {
    const h = (currentHour - i + 24) % 24;
    const label = `${h.toString().padStart(2, '0')}:00`;
    hourBuckets[label] = { feeding: 0, hydrating: 0, resting: 0 };
  }

  records.forEach((r, idx) => {
    sumHealth += r.healthScore || 95;
    sumConfidence += r.confidenceScore || 98;

    if (r.activity === 'Feeding') {
      totalFeedingSec += r.dwellTimeSeconds || 120;
      feedingCount++;
    } else if (r.activity === 'Hydrating') {
      totalHydrationSec += r.dwellTimeSeconds || 60;
      hydratingCount++;
    } else if (r.activity === 'Stationary / Resting') {
      restingCount++;
    } else {
      approachingCount++;
    }

    // Map into approximate timeline slot
    const keys = Object.keys(hourBuckets);
    const keyIdx = (keys.length - 1 - (idx % keys.length) + keys.length) % keys.length;
    const targetKey = keys[keyIdx];
    if (hourBuckets[targetKey]) {
      if (r.activity === 'Feeding') hourBuckets[targetKey].feeding++;
      else if (r.activity === 'Hydrating') hourBuckets[targetKey].hydrating++;
      else hourBuckets[targetKey].resting++;
    }
  });

  const timelineData = Object.entries(hourBuckets).map(([hour, counts]) => ({
    hour,
    feeding: counts.feeding,
    hydrating: counts.hydrating,
    resting: counts.resting
  }));

  return {
    totalVisits: records.length,
    feedingMinutes: Math.round(totalFeedingSec / 60),
    hydrationMinutes: Math.round(totalHydrationSec / 60),
    averageHealthScore: Math.round(sumHealth / records.length),
    averageConfidence: Number((sumConfidence / records.length).toFixed(1)),
    lastVisitTime: records[0]?.timestamp || 'Just now',
    activityBreakdown: [
      { name: 'Feeding', value: feedingCount || 1, color: '#10b981' },
      { name: 'Hydrating', value: hydratingCount || 1, color: '#0ea5e9' },
      { name: 'Resting', value: restingCount || 1, color: '#8b5cf6' },
      { name: 'Approaching', value: approachingCount || 1, color: '#f59e0b' }
    ],
    hourlyTimeline: timelineData
  };
}

/**
 * Export vision records as CSV data
 */
export function exportVisionAnalyticsCSV(petId?: string): string {
  const records = getVisionAnalyticsRecords(petId);
  const headers = [
    'ID',
    'Pet Name',
    'Species',
    'Timestamp',
    'Activity',
    'Confidence (%)',
    'Health Score',
    'Dwell Time (s)',
    'Action Triggered',
    'Action Details',
    'AI Provider'
  ];

  const rows = records.map((r) => [
    r.id,
    `"${r.petName}"`,
    `"${r.species}"`,
    r.timestamp,
    r.activity,
    r.confidenceScore,
    r.healthScore,
    r.dwellTimeSeconds,
    r.actionTriggered,
    `"${r.actionDetails || ''}"`,
    r.provider
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
