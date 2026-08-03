/**
 * HydroNourish — Session Context
 * Heritage Animal Clinic Capstone Project
 *
 * Central state management for the single-device pet monitoring workflow.
 * Enforces the one-active-session-at-a-time business rule.
 *
 * Responsibilities:
 *  - Manage active session lifecycle (assign → monitor → complete/cancel)
 *  - Manage pet owners and their access status
 *  - Manage the single hardware device state
 *  - Track activity logs and system notifications
 *  - Persist session data in localStorage for the frontend-only demo
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  PetOwner,
  PetSession,
  PetSessionStatus,
  UserAccessStatus,
  HardwareStatus,
  Device,
  ActivityLog,
  ActivityAction,
  SystemNotification,
  NotificationType,
  Pet,
} from '../types';

import {
  initialOwners,
  initialSessions,
  initialDevices,
  initialActivityLogs,
  initialNotifications,
} from '../data/mockData';

// ─── Helper: localStorage with fallback ───────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

// ─── Context Type ─────────────────────────────────────────────────────────

interface SessionContextType {
  // State
  activeSession: PetSession | null;
  sessions: PetSession[];
  owners: PetOwner[];
  hardware: Device;
  activityLogs: ActivityLog[];
  notifications: SystemNotification[];

  // Session lifecycle
  canAssignPet: () => boolean;
  assignPetAndOwner: (pet: Pet, ownerId: string, sessionData: {
    admissionDate: string;
    expectedReleaseDate: string;
    emergencyContact: string;
    notes: string;
  }, adminName: string) => { success: boolean; error: string | null };
  completeSession: (releaseData: {
    releaseTime: string;
    releaseCondition: string;
    finalNotes: string;
  }, adminName: string) => { success: boolean; error: string | null };
  cancelSession: (reason: string, adminName: string) => { success: boolean; error: string | null };

  // Owner management
  addOwner: (owner: Omit<PetOwner, 'id' | 'dateCreated' | 'currentSessionId' | 'accessStatus' | 'lastLogin'>) => PetOwner;
  updateOwner: (id: string, data: Partial<PetOwner>) => void;
  deactivateOwner: (id: string, adminName: string) => void;
  reactivateOwner: (id: string, adminName: string) => void;
  archiveOwner: (id: string, adminName: string) => void;
  deleteOwnerPermanent: (id: string, adminName: string) => { success: boolean; error: string | null };

  // Hardware management
  changeHardwareStatus: (status: HardwareStatus, adminName: string) => void;

  // Notifications
  addNotification: (type: NotificationType, title: string, message: string, severity: SystemNotification['severity'], extra?: Partial<SystemNotification>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationCount: number;

  // Session history helpers
  getSessionsByStatus: (status: PetSessionStatus) => PetSession[];
  getSessionsByOwner: (ownerId: string) => PetSession[];
  getSessionsByPet: (petId: string) => PetSession[];
  getOwnerById: (id: string) => PetOwner | undefined;
  getCompletedSessionCount: () => number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ─── State ─────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<PetSession[]>(() =>
    loadFromStorage('hn_sessions', initialSessions)
  );
  const [owners, setOwners] = useState<PetOwner[]>(() => {
    const saved = loadFromStorage<PetOwner[]>('hn_owners', initialOwners);
    const filtered = saved.filter(o => o.id === 'OWN-001' || !['OWN-002', 'OWN-003', 'OWN-004', 'OWN-005', 'OWN-006'].includes(o.id));
    return filtered.length > 0 ? filtered : initialOwners;
  });
  const [hardware, setHardware] = useState<Device>(initialDevices[0]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadFromStorage('hn_activity_logs', initialActivityLogs)
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    loadFromStorage('hn_notifications', initialNotifications)
  );

  // Derived: active session
  const activeSession = sessions.find(s => s.status === 'active') ?? null;

  // ─── Persist to localStorage ──────────────────────────────────────────
  useEffect(() => { saveToStorage('hn_sessions', sessions); }, [sessions]);
  useEffect(() => { saveToStorage('hn_owners', owners); }, [owners]);
  useEffect(() => { saveToStorage('hn_hardware', hardware); }, [hardware]);
  useEffect(() => { saveToStorage('hn_activity_logs', activityLogs); }, [activityLogs]);
  useEffect(() => { saveToStorage('hn_notifications', notifications); }, [notifications]);

  // ─── Activity Log Helper ──────────────────────────────────────────────
  const addLog = useCallback((
    adminName: string,
    action: ActivityAction,
    ownerName: string | null,
    petName: string | null,
    sessionId: string | null,
    result: 'success' | 'failed' | 'warning' = 'success',
    details?: string
  ) => {
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      adminName,
      action,
      ownerName,
      petName,
      sessionId,
      timestamp: new Date().toISOString(),
      result,
      details,
    };
    setActivityLogs(prev => [newLog, ...prev]);
  }, []);

  // ─── Notification Helper ──────────────────────────────────────────────
  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    severity: SystemNotification['severity'],
    extra?: Partial<SystemNotification>
  ) => {
    const notif: SystemNotification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      severity,
      ...extra,
    };
    setNotifications(prev => [notif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // ─── Session Lifecycle ────────────────────────────────────────────────

  const canAssignPet = useCallback((): boolean => {
    return !activeSession && (hardware.hardwareStatus === 'available');
  }, [activeSession, hardware.hardwareStatus]);

  const assignPetAndOwner = useCallback((
    pet: Pet,
    ownerId: string,
    sessionData: {
      admissionDate: string;
      expectedReleaseDate: string;
      emergencyContact: string;
      notes: string;
    },
    adminName: string
  ): { success: boolean; error: string | null } => {
    // Enforce one-active-session rule
    if (activeSession) {
      return {
        success: false,
        error: 'The HydroNourish hardware is currently assigned to another pet. Complete or cancel the existing session before assigning a new pet.'
      };
    }

    if (hardware.hardwareStatus !== 'available') {
      return {
        success: false,
        error: `The hardware is currently ${hardware.hardwareStatus}. It must be available to assign a new pet.`
      };
    }

    const owner = owners.find(o => o.id === ownerId);
    if (!owner) {
      return { success: false, error: 'Owner not found.' };
    }

    const now = new Date().toISOString();
    const sessionId = `SES-${Date.now().toString().slice(-6)}`;

    // Create new session
    const newSession: PetSession = {
      id: sessionId,
      petId: pet.id,
      petName: pet.name,
      petSpecies: pet.species,
      petBreed: pet.breed,
      petAvatarUrl: pet.avatarUrl,
      ownerId: owner.id,
      ownerName: owner.name,
      ownerEmail: owner.email,
      deviceId: hardware.id,
      status: 'active',
      admissionDate: sessionData.admissionDate || now,
      expectedReleaseDate: sessionData.expectedReleaseDate,
      startTime: now,
      releaseTime: null,
      releaseCondition: null,
      finalNotes: null,
      cancelledReason: null,
      completedBy: null,
      emergencyContact: sessionData.emergencyContact || pet.emergencyContact || '',
      feedingRecordCount: 0,
      hydrationRecordCount: 0,
      vitalSignRecordCount: 0,
      alertCount: 0,
      notes: sessionData.notes,
      petSnapshot: {
        weight: pet.weight,
        age: pet.age,
        feedingPlan: { ...pet.feedingPlan },
        hydrationTarget: pet.hydrationTarget,
        healthStatus: pet.healthStatus,
      },
    };

    setSessions(prev => [newSession, ...prev]);

    // Set hardware to occupied
    setHardware(prev => ({
      ...prev,
      hardwareStatus: 'occupied' as HardwareStatus,
      assignedPetId: pet.id,
      assignedPetName: pet.name,
    }));

    // Set owner access to active
    setOwners(prev => prev.map(o =>
      o.id === ownerId
        ? { ...o, accessStatus: 'active' as UserAccessStatus, currentSessionId: sessionId, lastLogin: now }
        : o
    ));

    addLog(adminName, 'started_session', owner.name, pet.name, sessionId, 'success', `Assigned to ${hardware.id}`);
    addLog(adminName, 'assigned_hardware', owner.name, pet.name, sessionId, 'success', hardware.id);

    addNotification('pet_assigned', 'Pet Assigned', `${pet.name} has been assigned to HydroNourish Station Alpha.`, 'success', { petName: pet.name, sessionId });
    addNotification('session_started', 'Session Started', `Monitoring session started for ${pet.name} (Owner: ${owner.name}).`, 'info', { petName: pet.name, sessionId });

    return { success: true, error: null };
  }, [activeSession, hardware, owners, addLog, addNotification]);

  const completeSession = useCallback((
    releaseData: {
      releaseTime: string;
      releaseCondition: string;
      finalNotes: string;
    },
    adminName: string
  ): { success: boolean; error: string | null } => {
    if (!activeSession) {
      return { success: false, error: 'No active session to complete.' };
    }

    const now = releaseData.releaseTime || new Date().toISOString();

    // Update session status to completed
    setSessions(prev => prev.map(s =>
      s.id === activeSession.id
        ? {
            ...s,
            status: 'completed' as PetSessionStatus,
            releaseTime: now,
            releaseCondition: releaseData.releaseCondition,
            finalNotes: releaseData.finalNotes,
            completedBy: adminName,
          }
        : s
    ));

    // Release hardware
    setHardware(prev => ({
      ...prev,
      hardwareStatus: 'available' as HardwareStatus,
      assignedPetId: '',
      assignedPetName: '',
    }));

    // Deactivate owner access
    setOwners(prev => prev.map(o =>
      o.id === activeSession.ownerId
        ? { ...o, accessStatus: 'inactive' as UserAccessStatus, currentSessionId: null }
        : o
    ));

    addLog(adminName, 'completed_session', activeSession.ownerName, activeSession.petName, activeSession.id, 'success', releaseData.releaseCondition);
    addLog(adminName, 'deactivated_owner', activeSession.ownerName, null, null, 'success');

    addNotification('session_completed', 'Session Completed', `${activeSession.petName}'s monitoring session has been completed. Records archived.`, 'success', { petName: activeSession.petName, sessionId: activeSession.id });
    addNotification('owner_deactivated', 'Owner Access Deactivated', `${activeSession.ownerName}'s temporary monitoring access has been deactivated.`, 'info');
    addNotification('hardware_available', 'Hardware Available', 'HydroNourish Station Alpha is now available for assignment.', 'info');

    return { success: true, error: null };
  }, [activeSession, addLog, addNotification]);

  const cancelSession = useCallback((
    reason: string,
    adminName: string
  ): { success: boolean; error: string | null } => {
    if (!activeSession) {
      return { success: false, error: 'No active session to cancel.' };
    }

    const now = new Date().toISOString();

    // Update session status to cancelled
    setSessions(prev => prev.map(s =>
      s.id === activeSession.id
        ? {
            ...s,
            status: 'cancelled' as PetSessionStatus,
            releaseTime: now,
            cancelledReason: reason,
          }
        : s
    ));

    // Release hardware
    setHardware(prev => ({
      ...prev,
      hardwareStatus: 'available' as HardwareStatus,
      assignedPetId: '',
      assignedPetName: '',
    }));

    // Deactivate owner access
    setOwners(prev => prev.map(o =>
      o.id === activeSession.ownerId
        ? { ...o, accessStatus: 'inactive' as UserAccessStatus, currentSessionId: null }
        : o
    ));

    addLog(adminName, 'cancelled_session', activeSession.ownerName, activeSession.petName, activeSession.id, 'success', reason);

    addNotification('hardware_available', 'Session Cancelled', `${activeSession.petName}'s session was cancelled. Hardware is now available.`, 'warning', { petName: activeSession.petName, sessionId: activeSession.id });

    return { success: true, error: null };
  }, [activeSession, addLog, addNotification]);

  // ─── Owner Management ─────────────────────────────────────────────────

  const addOwner = useCallback((
    ownerData: Omit<PetOwner, 'id' | 'dateCreated' | 'currentSessionId' | 'accessStatus' | 'lastLogin'>
  ): PetOwner => {
    const newId = `OWN-${String(owners.length + 1).padStart(3, '0')}`;
    const newOwner: PetOwner = {
      ...ownerData,
      id: newId,
      accessStatus: 'inactive',
      currentSessionId: null,
      dateCreated: new Date().toISOString(),
      lastLogin: null,
    };
    setOwners(prev => [newOwner, ...prev]);
    return newOwner;
  }, [owners.length]);

  const updateOwner = useCallback((id: string, data: Partial<PetOwner>) => {
    setOwners(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  }, []);

  const deactivateOwner = useCallback((id: string, adminName: string) => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return;
    setOwners(prev => prev.map(o =>
      o.id === id ? { ...o, accessStatus: 'inactive' as UserAccessStatus } : o
    ));
    addLog(adminName, 'deactivated_owner', owner.name, null, null, 'success');
  }, [owners, addLog]);

  const reactivateOwner = useCallback((id: string, adminName: string) => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return;
    setOwners(prev => prev.map(o =>
      o.id === id ? { ...o, accessStatus: 'inactive' as UserAccessStatus } : o
    ));
    addLog(adminName, 'reactivated_account', owner.name, null, null, 'success');
  }, [owners, addLog]);

  const archiveOwner = useCallback((id: string, adminName: string) => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return;
    setOwners(prev => prev.map(o =>
      o.id === id ? { ...o, accessStatus: 'archived' as UserAccessStatus } : o
    ));
    addLog(adminName, 'archived_account', owner.name, null, null, 'success');
  }, [owners, addLog]);

  const deleteOwnerPermanent = useCallback((id: string, adminName: string): { success: boolean; error: string | null } => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return { success: false, error: 'Owner not found.' };

    // Cannot delete owner with active session
    if (owner.currentSessionId && activeSession?.ownerId === id) {
      return { success: false, error: 'Cannot permanently delete an owner with an active monitoring session. Complete or cancel the session first.' };
    }

    setOwners(prev => prev.filter(o => o.id !== id));
    addLog(adminName, 'deactivated_owner', owner.name, null, null, 'warning', 'Permanent deletion');
    return { success: true, error: null };
  }, [owners, activeSession, addLog]);

  // ─── Hardware Management ──────────────────────────────────────────────

  const changeHardwareStatus = useCallback((status: HardwareStatus, adminName: string) => {
    if (activeSession && status !== 'occupied') {
      // Can't change hardware status while a session is active (except occupied which it already is)
      return;
    }
    setHardware(prev => ({ ...prev, hardwareStatus: status }));
    addLog(adminName, 'changed_hardware_status', null, null, null, 'success', `Status changed to ${status}`);

    if (status === 'maintenance') {
      addNotification('hardware_maintenance', 'Hardware Maintenance', 'HydroNourish Station Alpha has been placed under maintenance.', 'warning');
    } else if (status === 'available') {
      addNotification('hardware_available', 'Hardware Available', 'HydroNourish Station Alpha is now available for assignment.', 'info');
    }
  }, [activeSession, addLog, addNotification]);

  // ─── Query Helpers ────────────────────────────────────────────────────

  const getSessionsByStatus = useCallback((status: PetSessionStatus) =>
    sessions.filter(s => s.status === status), [sessions]);

  const getSessionsByOwner = useCallback((ownerId: string) =>
    sessions.filter(s => s.ownerId === ownerId), [sessions]);

  const getSessionsByPet = useCallback((petId: string) =>
    sessions.filter(s => s.petId === petId), [sessions]);

  const getOwnerById = useCallback((id: string) =>
    owners.find(o => o.id === id), [owners]);

  const getCompletedSessionCount = useCallback(() =>
    sessions.filter(s => s.status === 'completed').length, [sessions]);

  // ─── Context Value ────────────────────────────────────────────────────

  const value: SessionContextType = {
    activeSession,
    sessions,
    owners,
    hardware,
    activityLogs,
    notifications,
    canAssignPet,
    assignPetAndOwner,
    completeSession,
    cancelSession,
    addOwner,
    updateOwner,
    deactivateOwner,
    reactivateOwner,
    archiveOwner,
    deleteOwnerPermanent,
    changeHardwareStatus,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount,
    getSessionsByStatus,
    getSessionsByOwner,
    getSessionsByPet,
    getOwnerById,
    getCompletedSessionCount,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
