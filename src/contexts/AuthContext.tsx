/**
 * HydroNourish — Auth Context
 * Heritage Animal Clinic Capstone Project
 *
 * Provides real Supabase Auth session management.
 * Replaces all mock authentication that was in useAppContext.
 *
 * Rules:
 * - Never store session, token, or OTP in state/localStorage
 * - Let Supabase manage session persistence automatically
 * - Immediately sign out any authenticated user without a valid admin profile
 * - Prevent redirect loops by tracking loading state
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AdminProfile, AuthContextValue, AuthResult } from '../types/auth';
import {
  requestAdminOtp,
  verifyAdminOtp,
  fetchAdminProfile,
  updateAdminLastLogin,
  adminSignOut,
} from '../services/adminAuthService';
import { getAuthErrorMessage, logAuthError } from '../utils/authErrors';

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Track if we are mid-load to prevent duplicate profile fetches
  const profileFetchInProgress = useRef(false);

  /**
   * Loads the admin profile for the given userId.
   * If the user has no valid admin profile or is inactive/suspended,
   * they are signed out immediately.
   */
  const loadAdminProfile = useCallback(async (userId: string): Promise<void> => {
    if (profileFetchInProgress.current) return;
    profileFetchInProgress.current = true;

    try {
      const profile = await fetchAdminProfile(userId);

      if (!profile) {
        // Authenticated Supabase user but no admin record — sign out
        logAuthError('loadAdminProfile', 'No admin profile found for user');
        await adminSignOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        return;
      }

      if (profile.status !== 'active') {
        // Admin exists but is inactive or suspended — sign out
        logAuthError('loadAdminProfile', `Admin account status: ${profile.status}`);
        await adminSignOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        return;
      }

      const validRoles: AdminProfile['role'][] = ['admin', 'super_admin', 'veterinarian', 'staff', 'clinic_staff'];
      if (!validRoles.includes(profile.role)) {
        // Unknown role — sign out
        logAuthError('loadAdminProfile', `User has unrecognized role: ${profile.role}`);
        await adminSignOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        return;
      }

      setAdminProfile(profile);
    } catch (err) {
      logAuthError('loadAdminProfile unexpected', err);
      await adminSignOut();
      setUser(null);
      setSession(null);
      setAdminProfile(null);
    } finally {
      profileFetchInProgress.current = false;
    }
  }, []);

  // ─── Initial Session Check + Auth State Listener ──────────────────────

  useEffect(() => {
    let mounted = true;

    // 1. Get the current session synchronously on mount
    const initSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          logAuthError('initSession', error);
          setIsLoading(false);
          return;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await loadAdminProfile(initialSession.user.id);
        }
      } catch (err) {
        logAuthError('initSession unexpected', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, changedSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && changedSession?.user) {
          setSession(changedSession);
          setUser(changedSession.user);
          await loadAdminProfile(changedSession.user.id);
        } else if (event === 'TOKEN_REFRESHED' && changedSession) {
          setSession(changedSession);
          setUser(changedSession.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setAdminProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAdminProfile]);

  // ─── Auth Actions ──────────────────────────────────────────────────────

  /**
   * Requests a Supabase email OTP for the given email.
   * Always returns a neutral success message to prevent email enumeration.
   */
  const requestOtp = useCallback(async (email: string): Promise<AuthResult> => {
    const result = await requestAdminOtp(email);

    if (!result.success && result.error === 'rate_limit') {
      return {
        success: false,
        error: 'Too many requests. Please wait before trying again.',
      };
    }

    if (!result.success && result.error === 'network') {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }

    // Always return neutral success to prevent email enumeration
    return { success: true, error: null };
  }, []);

  /**
   * Verifies the email OTP token via Supabase.
   * On success, loads and validates the admin profile.
   * On unauthorized, signs out immediately.
   */
  const verifyOtp = useCallback(
    async (email: string, token: string): Promise<AuthResult> => {
      const verifyResult = await verifyAdminOtp(email, token);

      if (!verifyResult.success) {
        return {
          success: false,
          error: getAuthErrorMessage({ message: verifyResult.error ?? '' }),
        };
      }

      // OTP verified — get the newly authenticated session
      const { data: { session: newSession } } = await supabase.auth.getSession();

      if (!newSession?.user) {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      setSession(newSession);
      setUser(newSession.user);

      // Check admin profile
      const profile = await fetchAdminProfile(newSession.user.id);

      if (!profile) {
        await adminSignOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        return {
          success: false,
          error: 'This account is not authorized to access the administrator portal.',
        };
      }

      if (profile.status !== 'active') {
        await adminSignOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);

        const statusMsg =
          profile.status === 'suspended'
            ? 'This account has been suspended. Please contact your system administrator.'
            : 'This account is inactive. Please contact your system administrator.';

        return { success: false, error: statusMsg };
      }

      const validRoles: AdminProfile['role'][] = ['admin', 'super_admin', 'veterinarian', 'staff', 'clinic_staff'];
      if (!validRoles.includes(profile.role)) {
        await adminSignOut();
        setUser(null);
        setSession(null);
        setAdminProfile(null);
        return {
          success: false,
          error: 'This account does not have a recognized clinic access role.',
        };
      }

      setAdminProfile(profile);

      // Update last login timestamp (best-effort, non-blocking)
      void updateAdminLastLogin(newSession.user.id);

      return { success: true, error: null };
    },
    []
  );

  /**
   * Signs the admin out and clears all auth state.
   */
  const signOut = useCallback(async (): Promise<void> => {
    await adminSignOut();
    setUser(null);
    setSession(null);
    setAdminProfile(null);
  }, []);

  /**
   * Re-fetches the admin profile from Supabase.
   * Used after profile updates.
   */
  const refreshAdminProfile = useCallback(async (): Promise<void> => {
    if (!user) return;
    await loadAdminProfile(user.id);
  }, [user, loadAdminProfile]);

  // ─── Derived State ─────────────────────────────────────────────────────

  const isAuthenticated = !!session && !!user;
  const isAdmin =
    isAuthenticated &&
    !!adminProfile &&
    (adminProfile.role === 'admin' || adminProfile.role === 'super_admin') &&
    adminProfile.status === 'active';
  const isStaff =
    isAuthenticated &&
    !!adminProfile &&
    (adminProfile.role === 'staff' || adminProfile.role === 'veterinarian' || adminProfile.role === 'clinic_staff') &&
    adminProfile.status === 'active';

  // ─── Context Value ─────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    adminProfile,
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    isStaff,
    requestOtp,
    verifyOtp,
    signOut,
    refreshAdminProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
