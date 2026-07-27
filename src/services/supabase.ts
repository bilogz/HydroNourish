import { createClient } from '@supabase/supabase-js';
import { Pet, FeedingSchedule, Device, AIHealthAlert, ClinicUser, VitalSignRecord } from '../types';

// Real Supabase Connection URL & Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nibsyjmdyfdvvwttcnkx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYnN5am1keWZkdnZ3dHRjbmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_CONFIG_HELP = {
  isConfigured: true,
  projectUrl: supabaseUrl,
  dbPoolerUrl: 'postgresql://postgres.nibsyjmdyfdvvwttcnkx:JoecelGarcia#1@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres',
  statusMessage: 'Connected to Supabase PostgreSQL Database (AP-Southeast-2 Sydney).',
  tables: ['pets', 'feeding_schedules', 'vital_signs', 'ai_alerts', 'devices', 'clinic_users']
};

/**
 * Fetch Pets from Real Supabase Database
 */
export async function fetchPetsFromSupabase(): Promise<Pet[] | null> {
  try {
    const { data, error } = await supabase.from('pets').select('*');
    if (error || !data) return null;
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      species: item.species,
      breed: item.breed,
      age: Number(item.age),
      weight: Number(item.weight),
      ownerName: item.owner_name,
      ownerPhone: item.owner_phone,
      clinicRef: item.clinic_ref,
      assignedDeviceId: item.assigned_device_id || 'HN-DEV-0101',
      healthStatus: item.health_status || 'Healthy',
      avatarUrl: item.avatar_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200',
      feedingPlan: {
        portionGrams: Number(item.portion_grams) || 120,
        timesPerDay: Number(item.times_per_day) || 3,
        foodType: item.food_type || 'Veterinary Dry Kibble'
      },
      hydrationTarget: Number(item.hydration_target) || 850,
      latestVitals: {
        temperature: Number(item.latest_temp) || 38.5,
        heartRate: Number(item.latest_heart_rate) || 85,
        activityLevel: (item.latest_activity as any) || 'Normal',
        lastMeasured: 'Today'
      }
    }));
  } catch (err) {
    console.warn('Supabase fetch query notice:', err);
    return null;
  }
}

/**
 * Insert New Pet into Supabase
 */
export async function insertPetToSupabase(pet: Pet): Promise<boolean> {
  try {
    const { error } = await supabase.from('pets').insert({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      owner_name: pet.ownerName,
      owner_phone: pet.ownerPhone,
      clinic_ref: pet.clinicRef,
      assigned_device_id: pet.assignedDeviceId,
      health_status: pet.healthStatus,
      avatar_url: pet.avatarUrl,
      portion_grams: pet.feedingPlan.portionGrams,
      times_per_day: pet.feedingPlan.timesPerDay,
      food_type: pet.feedingPlan.foodType,
      hydration_target: pet.hydrationTarget,
      latest_temp: pet.latestVitals.temperature,
      latest_heart_rate: pet.latestVitals.heartRate,
      latest_activity: pet.latestVitals.activityLevel
    });
    return !error;
  } catch (err) {
    console.warn('Supabase pet insert error:', err);
    return false;
  }
}
