/**
 * HydroNourish — Admin Login Lockout Utility
 * Heritage Animal Clinic Capstone Project
 *
 * Enforces security rate limiting:
 * If an admin enters an incorrect password 5 times,
 * the account/email is locked for 5 minutes (300 seconds).
 * Lockout status is persisted in localStorage so browser refreshes do not bypass it.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'hn_admin_login_locks';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes = 300,000 ms

interface LockRecord {
  failedCount: number;
  lockUntil: number | null; // Timestamp in ms
}

type LockStore = Record<string, LockRecord>;

function getStore(): LockStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LockStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: LockStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export interface AdminLockoutState {
  failedCount: number;
  isLocked: boolean;
  lockUntil: number | null;
  remainingSeconds: number;
}

/**
 * Gets the current lockout state for a given admin email address.
 */
export function getAdminLockoutState(email: string): AdminLockoutState {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { failedCount: 0, isLocked: false, lockUntil: null, remainingSeconds: 0 };
  }

  const store = getStore();
  const record = store[normalized];

  if (!record) {
    return { failedCount: 0, isLocked: false, lockUntil: null, remainingSeconds: 0 };
  }

  const now = Date.now();

  if (record.lockUntil && now < record.lockUntil) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return {
      failedCount: record.failedCount,
      isLocked: true,
      lockUntil: record.lockUntil,
      remainingSeconds: Math.max(0, remainingSeconds),
    };
  }

  // If lockout expired, clean up the lock date
  if (record.lockUntil && now >= record.lockUntil) {
    delete store[normalized];
    saveStore(store);
    return { failedCount: 0, isLocked: false, lockUntil: null, remainingSeconds: 0 };
  }

  return {
    failedCount: record.failedCount,
    isLocked: false,
    lockUntil: null,
    remainingSeconds: 0,
  };
}

/**
 * Records a failed password attempt for an admin email address.
 * Increments failure count, and triggers a 5-minute lock if failedCount reaches 5.
 */
export function recordFailedAdminLogin(email: string): AdminLockoutState {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { failedCount: 0, isLocked: false, lockUntil: null, remainingSeconds: 0 };
  }

  const store = getStore();
  const existing = store[normalized] || { failedCount: 0, lockUntil: null };
  const now = Date.now();

  const newFailedCount = existing.failedCount + 1;
  let lockUntil: number | null = null;
  let isLocked = false;
  let remainingSeconds = 0;

  if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
    lockUntil = now + LOCKOUT_DURATION_MS;
    isLocked = true;
    remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
  }

  store[normalized] = {
    failedCount: newFailedCount,
    lockUntil,
  };

  saveStore(store);

  return {
    failedCount: newFailedCount,
    isLocked,
    lockUntil,
    remainingSeconds,
  };
}

/**
 * Resets the failed attempts and lock status upon successful login.
 */
export function resetAdminLoginLockout(email: string): void {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const store = getStore();
  if (store[normalized]) {
    delete store[normalized];
    saveStore(store);
  }
}

/**
 * Helper to format seconds into "M:SS" or "Xm Ys".
 */
export function formatRemainingTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  return `${secs}s`;
}

/**
 * React hook to reactively subscribe to lockout state with live 1-second countdown.
 */
export function useAdminLoginLockout(email: string) {
  const [state, setState] = useState<AdminLockoutState>(() => getAdminLockoutState(email));

  useEffect(() => {
    // Initial fetch when email changes
    const current = getAdminLockoutState(email);
    setState(current);

    if (!current.isLocked) return;

    // Ticking timer while locked out
    const interval = setInterval(() => {
      const updated = getAdminLockoutState(email);
      setState(updated);
      if (!updated.isLocked) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [email]);

  return {
    ...state,
    formattedTime: formatRemainingTime(state.remainingSeconds),
    maxAttempts: MAX_FAILED_ATTEMPTS,
  };
}
