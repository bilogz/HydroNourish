/**
 * HydroNourish — Supabase Data Service
 * Heritage Animal Clinic Capstone Project
 *
 * Provides data-fetching helpers for pet records.
 * Auth is handled separately in src/services/adminAuthService.ts.
 * The Supabase client is imported from src/lib/supabase.ts.
 */

import { supabase } from '../lib/supabase';
import type { Pet } from '../types';

/**
 * Fetch Pets from the Supabase pets table.
 * Returns null on error so callers can fall back to local mock data.
 */
export async function fetchPetsFromSupabase(): Promise<Pet[] | null> {
  const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  if (!rawKey || rawKey.includes('.placeholder')) {
    return null; // Avoid making remote calls with placeholder key
  }

  try {
    const { data, error } = await supabase.from('pets').select('*');
    if (error || !data) return null;

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      species: item.species as Pet['species'],
      breed: item.breed,
      age: Number(item.age),
      weight: Number(item.weight),
      ownerName: item.owner_name,
      ownerPhone: item.owner_phone,
      clinicRef: item.clinic_ref,
      assignedDeviceId: item.assigned_device_id ?? 'Cage 1',
      healthStatus: (item.health_status ?? 'Healthy') as Pet['healthStatus'],
      avatarUrl:
        item.avatar_url ??
        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200',
      feedingPlan: {
        portionGrams: Number(item.portion_grams) || 120,
        timesPerDay: Number(item.times_per_day) || 3,
        foodType: item.food_type ?? 'Veterinary Dry Kibble',
      },
      hydrationTarget: Number(item.hydration_target) || 850,
      latestVitals: {
        temperature: Number(item.latest_temp) || 38.5,
        heartRate: Number(item.latest_heart_rate) || 85,
        activityLevel: (item.latest_activity ?? 'Normal') as Pet['latestVitals']['activityLevel'],
        lastMeasured: 'Today',
      },
      notes: '',
    }));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[HydroNourish] Supabase pets fetch notice — falling back to mock data.');
    }
    return null;
  }
}

/**
 * Insert a new Pet record into Supabase.
 * Returns true on success, false on error.
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
      latest_activity: pet.latestVitals.activityLevel,
    });
    return !error;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[HydroNourish] Supabase pet insert notice.');
    }
    return false;
  }
}

/**
 * Fetch Users/Admin Profiles from Supabase admin_profiles table.
 * Returns null if Supabase is unavailable or table is empty.
 */
export async function fetchUsersFromSupabase(): Promise<import('../types').ClinicUser[] | null> {
  const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  if (!rawKey || rawKey.includes('.placeholder')) {
    return null;
  }

  try {
    const { data, error } = await supabase.from('admin_profiles').select('*');
    if (error || !data || data.length === 0) return null;

    return data.map((item) => {
      const roleMap: Record<string, import('../types').UserRole> = {
        super_admin: 'Super Admin',
        admin: 'Administrator',
        veterinarian: 'Veterinarian',
        staff: 'Clinic Staff',
      };
      const role = roleMap[item.role] || (item.role as import('../types').UserRole) || 'Administrator';

      return {
        id: item.id,
        name: item.full_name,
        fullName: item.full_name,
        email: item.email,
        role: role,
        department: item.department || 'Clinic Management',
        status: item.status === 'active' ? 'Active' : 'Inactive',
        lastActive: item.last_login_at ? new Date(item.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now (Active)',
        avatarUrl:
          item.avatar_url ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        isProtected: role === 'Super Admin' || item.email === 'joecelgarcia1@gmail.com',
      };
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[HydroNourish] Supabase users fetch notice.');
    }
    return null;
  }
}
