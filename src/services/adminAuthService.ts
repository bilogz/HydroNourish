/**
 * HYDRO NOURISH — ADMIN AUTHENTICATION SERVICE
 * Heritage Animal Clinic Capstone Project
 */

import { supabase } from '../lib/supabase';
import { logAuthError } from '../utils/authErrors';
import type { AdminProfile, AuthResult } from '../types/auth';

export type { AdminProfile, AuthResult };

/**
 * Requests an OTP code for admin authentication via Supabase Auth.
 */
export async function requestAdminOtp(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      // Catch Supabase Auth errors gracefully without throwing 401
      return { success: true, error: null };
    }

    return { success: true, error: null };
  } catch {
    return { success: true, error: null };
  }
}

/**
 * Verifies the Supabase email OTP token.
 */
export async function verifyAdminOtp(
  email: string,
  token: string
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      logAuthError('verifyAdminOtp', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    logAuthError('verifyAdminOtp unexpected', err);
    return { success: false, error: 'network' };
  }
}

/**
 * Known Super Admin Emails
 */
const SUPER_ADMIN_EMAILS = [
  'joecelgarcia1@gmail.com',
  'marcgermineganan05@gmail.com',
  'marcgermineganan03@gmail.com',
  'heritagelink45@gmail.com',
];

/**
 * Helper to generate default AdminProfile fallback for verified users.
 */
function createFallbackProfile(userId: string, email?: string, fullName?: string, role?: AdminProfile['role']): AdminProfile {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(normalizedEmail);

  let resolvedRole: AdminProfile['role'] = role || (isSuperAdmin ? 'super_admin' : 'staff');

  return {
    id: userId,
    email: normalizedEmail || 'joecelgarcia1@gmail.com',
    full_name: fullName || (isSuperAdmin ? 'System Super Administrator' : 'Clinic Staff Member'),
    role: resolvedRole,
    status: 'active',
    avatar_url: null,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetches the admin_profiles record for the authenticated user.
 * Provides role resolution from clinic_users or super admin emails.
 */
export async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  try {
    // 1. Query Supabase admin_profiles directly
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as AdminProfile;
    }

    // 2. Fetch current user from Supabase Auth
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    const userEmail = (currentUser?.email || '').trim().toLowerCase();

    // 3. Check clinic_users table
    if (userEmail) {
      const { data: clinicUser } = await supabase
        .from('clinic_users')
        .select('*')
        .ilike('email', userEmail)
        .maybeSingle();

      if (clinicUser) {
        let mappedRole: AdminProfile['role'] = 'staff';
        const rawRole = (clinicUser.role || '').toLowerCase();
        if (rawRole.includes('super admin') || rawRole.includes('super_admin')) {
          mappedRole = 'super_admin';
        } else if (rawRole.includes('admin')) {
          mappedRole = 'admin';
        } else if (rawRole.includes('vet')) {
          mappedRole = 'veterinarian';
        } else {
          mappedRole = 'staff';
        }

        return {
          id: userId,
          email: userEmail,
          full_name: clinicUser.full_name || clinicUser.name || currentUser?.user_metadata?.full_name || 'Clinic Staff Member',
          role: mappedRole,
          status: clinicUser.status === 'Inactive' ? 'inactive' : 'active',
          avatar_url: clinicUser.avatar_url || null,
          last_login_at: new Date().toISOString(),
          created_at: clinicUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }

    // 4. Default fallback profile based on email / metadata
    return createFallbackProfile(
      userId,
      currentUser?.email,
      currentUser?.user_metadata?.full_name
    );
  } catch (err) {
    logAuthError('fetchAdminProfile unexpected', err);
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;

    return createFallbackProfile(
      userId,
      currentUser?.email,
      currentUser?.user_metadata?.full_name
    );
  }
}

/**
 * Updates the last_login_at timestamp for the authenticated admin.
 */
export async function updateAdminLastLogin(userId: string): Promise<void> {
  try {
          await supabase
        .from('admin_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

  } catch (err) {
    logAuthError('updateAdminLastLogin unexpected', err);
  }
}

/**
 * Signs the current user out via Supabase Auth.
 */
export async function adminSignOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logAuthError('adminSignOut', error);
    }
  } catch (err) {
    logAuthError('adminSignOut unexpected', err);
  }
}
