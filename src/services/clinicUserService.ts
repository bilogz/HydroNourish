/**
 * HydroNourish — Clinic User Service
 * Heritage Animal Clinic Capstone Project
 *
 * Handles all Supabase CRUD operations for the `clinic_users` table.
 * Used by useAppContext to persist user management actions to the database.
 */

import { supabase } from '../lib/supabase';
import type { ClinicUser } from '../types';
import type { Database } from '../types/database';

/**
 * Department options available in Heritage Animal Clinic's HydroNourish system.
 * Used as a dropdown in Create/Edit user modals.
 */
export const CLINIC_DEPARTMENTS = [
  'Veterinary Medicine',
  'Veterinary Surgery',
  'Animal Nursing & Care',
  'Laboratory & Diagnostics',
  'Pharmacy',
  'Reception & Client Services',
  'IT & Systems Administration',
  'Clinic Management',
  'General Operations',
] as const;

export type ClinicDepartment = (typeof CLINIC_DEPARTMENTS)[number];

// ─── Fetch all clinic users ─────────────────────────────────────────

export async function fetchClinicUsers(): Promise<ClinicUser[] | null> {
  try {
    const { data, error } = await supabase
      .from('clinic_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      fullName: item.name as string,
      email: item.email as string,
      role: item.role as ClinicUser['role'],
      department: (item.department as string) || 'General Operations',
      status: (item.status as string) === 'Active' ? 'Active' as const : 'Inactive' as const,
      lastActive: (item.last_active as string) || 'Just registered',
      avatarUrl:
        (item.avatar_url as string) ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      isProtected:
        (item.role as string) === 'Super Admin' ||
        (item.email as string) === 'joecelgarcia1@gmail.com',
    }));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[HydroNourish] clinic_users fetch error:', err);
    }
    return null;
  }
}

// ─── Insert a new clinic user ───────────────────────────────────────

export async function insertClinicUser(
  user: ClinicUser
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('clinic_users').insert({
      id: user.id,
      name: user.fullName || user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      last_active: user.lastActive || 'Just registered',
      avatar_url: user.avatarUrl,
    });

    if (error) {
      console.error('[HydroNourish] Insert clinic_user error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[HydroNourish] Insert clinic_user exception:', msg);
    return { success: false, error: msg };
  }
}

// ─── Update an existing clinic user ─────────────────────────────────

export async function updateClinicUser(
  id: string,
  updates: Partial<ClinicUser>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Map ClinicUser fields → clinic_users column names
    const dbUpdates: Database['public']['Tables']['clinic_users']['Update'] = {};
    if (updates.name !== undefined || updates.fullName !== undefined) {
      dbUpdates.name = updates.fullName || updates.name;
    }
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.lastActive !== undefined) dbUpdates.last_active = updates.lastActive;

    if (Object.keys(dbUpdates).length === 0) {
      return { success: true }; // nothing to update
    }

    const { error } = await supabase
      .from('clinic_users')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('[HydroNourish] Update clinic_user error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[HydroNourish] Update clinic_user exception:', msg);
    return { success: false, error: msg };
  }
}

// ─── Toggle user status (Active ↔ Inactive) ────────────────────────

export async function toggleClinicUserStatus(
  id: string,
  currentStatus: 'Active' | 'Inactive'
): Promise<{ success: boolean; newStatus: 'Active' | 'Inactive'; error?: string }> {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

  try {
    const { error } = await supabase
      .from('clinic_users')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('[HydroNourish] Toggle status error:', error.message);
      return { success: false, newStatus: currentStatus, error: error.message };
    }
    return { success: true, newStatus };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, newStatus: currentStatus, error: msg };
  }
}
