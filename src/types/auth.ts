/**
 * HydroNourish — Auth Type Definitions
 * Heritage Animal Clinic Capstone Project
 */

import type { User, Session } from '@supabase/supabase-js';

// Re-export Supabase types for convenience
export type { User, Session };

/**
 * Admin / Staff account role.
 */
export type AdminRole = 'super_admin' | 'admin' | 'veterinarian' | 'staff' | 'clinic_staff';

/**
 * Admin account status — must match the check constraint in admin_profiles.
 */
export type AdminStatus = 'active' | 'inactive' | 'suspended';

/**
 * Shape of a record in the admin_profiles table.
 */
export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  status: AdminStatus;
  avatar_url: string | null;
  phone?: string | null;
  department?: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generic result returned by all auth service functions.
 */
export interface AuthResult {
  success: boolean;
  error: string | null;
}

/**
 * OTP login step enum.
 */
export type OtpStep = 'email' | 'otp';

/**
 * Value shape exposed by AuthContext.
 */
export interface AuthContextValue {
  user: User | null;
  adminProfile: AdminProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  requestOtp: (email: string) => Promise<AuthResult>;
  verifyOtp: (email: string, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshAdminProfile: () => Promise<void>;
}
