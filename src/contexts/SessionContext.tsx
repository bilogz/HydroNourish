/**
 * HydroNourish — Session Context
 * Heritage Animal Clinic Capstone Project
 *
 * Central state management for single-device pet monitoring sessions and pet owners,
 * integrated dynamically with Supabase PostgreSQL and real-time database channels.
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

import {
  fetchOwnersFromSupabase,
  insertOwnerToSupabase,
  updateOwnerInSupabase,
  deleteOwnerFromSupabase,
  fetchSessionsFromSupabase,
  insertSessionToSupabase,
  updateSessionInSupabase,
  fetchDevicesFromSupabase,
  updateDeviceInSupabase,
  subscribeToSupabaseRealtime,
} from '../services/supabase';

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
  } catch {}
}

interface SessionContextType {
  activeSession: PetSession | null;
  sessions: PetSession[];
  owners: PetOwner[];
  hardware: Device;
  activityLogs: ActivityLog[];
  notifications: SystemNotification[];

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

  addOwner: (owner: Omit<PetOwner, 'id' | 'dateCreated' | 'currentSessionId' | 'accessStatus' | 'lastLogin'>) => PetOwner;
  updateOwner: (id: string, data: Partial<PetOwner>) => void;
  deactivateOwner: (id: string, adminName: string) => void;
  reactivateOwner: (id: string, adminName: string) => void;
  archiveOwner: (id: string, adminName: string) => void;
  deleteOwnerPermanent: (id: string, adminName: string) => { success: boolean; error: string | null };

  changeHardwareStatus: (status: HardwareStatus, adminName: string) => void;

  addNotification: (type: NotificationType, title: string, message: string, severity: SystemNotification['severity'], extra?: Partial<SystemNotification>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationCount: number;

  getSessionsByStatus: (status: PetSessionStatus) => PetSession[];
  getSessionsByOwner: (ownerId: string) => PetSession[];
  getSessionsByPet: (petId: string) => PetSession[];
  getOwnerById: (id: string) => PetOwner | undefined;
  getCompletedSessionCount: () => number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const defaultEmptyHardware: Device = {
  id: 'No Device Connected',
  deviceName: 'No Hardware Device Connected',
  assignedPetId: '',
  assignedPetName: '',
  status: 'Offline',
  hardwareStatus: 'available',
  wifiSignalDbm: 0,
  foodLevelPct: 0,
  waterLevelPct: 0,
  batteryPct: 0,
  isPluggedIn: false,
  lastTransmission: 'Never',
  firmwareVersion: 'N/A',
  macAddress: '00:00:00:00:00:00',
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<PetSession[]>(() => {
    const saved = loadFromStorage<PetSession[]>('hn_sessions', []);
    return saved;
  });
  const [owners, setOwners] = useState<PetOwner[]>(() => {
    const saved = loadFromStorage<PetOwner[]>('hn_owners', []);
    return saved;
  });
  const [hardware, setHardware] = useState<Device>(defaultEmptyHardware);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = loadFromStorage<ActivityLog[]>('hn_activity_logs', []);
    return saved.filter(a => !a.id.startsWith('LOG-00'));
  });
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = loadFromStorage<SystemNotification[]>('hn_notifications', []);
    return saved.filter(n => !n.id.startsWith('NOTIF-00'));
  });

  const activeSession = sessions.find(s => s.status === 'active') ?? null;

  // ─── Supabase Initial Sync ───────────────────────────────────────────
  useEffect(() => {
    async function syncSessionData() {
      try {
        const [remoteOwners, remoteSessions, remoteDevices] = await Promise.all([
          fetchOwnersFromSupabase(),
          fetchSessionsFromSupabase(),
          fetchDevicesFromSupabase(),
        ]);

        if (remoteOwners && remoteOwners.length > 0) setOwners(remoteOwners);
        if (remoteSessions && remoteSessions.length > 0) setSessions(remoteSessions);
        if (remoteDevices && remoteDevices.length > 0) {
          const activeNode = remoteDevices.find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || remoteDevices[0];
          setHardware(activeNode);
        } else {
          setHardware(defaultEmptyHardware);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[HydroNourish] SessionContext sync notice.');
      }
    }

    syncSessionData();
  }, []);

  // ─── Realtime Subscriptions & Heartbeat Polling ─────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToSupabaseRealtime(async (tableName) => {
      if (tableName === 'pet_owners') {
        const data = await fetchOwnersFromSupabase();
        if (data) setOwners(data);
      } else if (tableName === 'pet_sessions') {
        const data = await fetchSessionsFromSupabase();
        if (data) setSessions(data);
      } else if (tableName === 'devices') {
        const data = await fetchDevicesFromSupabase();
        if (data && data.length > 0) setHardware(data[0]);
      }
    }, 'session_context');

    const hwInterval = setInterval(async () => {
      const remoteDevices = await fetchDevicesFromSupabase();
      if (remoteDevices && remoteDevices.length > 0) {
        const activeNode = remoteDevices.find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || remoteDevices[0];
        setHardware(activeNode);
      }
    }, 1500);

    return () => {
      clearInterval(hwInterval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // ─── Storage Persistence ─────────────────────────────────────────────
  useEffect(() => { saveToStorage('hn_sessions', sessions); }, [sessions]);
  useEffect(() => { saveToStorage('hn_owners', owners); }, [owners]);
  useEffect(() => { saveToStorage('hn_hardware', hardware); }, [hardware]);
  useEffect(() => { saveToStorage('hn_activity_logs', activityLogs); }, [activityLogs]);
  useEffect(() => { saveToStorage('hn_notifications', notifications); }, [notifications]);

  // ─── Log & Notification Helpers ─────────────────────────────────────
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
    return !activeSession && hardware.status === 'Online' && hardware.hardwareStatus === 'available';
  }, [activeSession, hardware.status, hardware.hardwareStatus]);

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
    if (activeSession) {
      return {
        success: false,
        error: 'The HydroNourish hardware is currently assigned to another pet. Complete or cancel the existing session first.'
      };
    }

    if (hardware.hardwareStatus !== 'available') {
      return {
        success: false,
        error: `The hardware is currently ${hardware.hardwareStatus}. It must be available to assign a new pet.`
      };
    }

    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return { success: false, error: 'Owner not found.' };

    const now = new Date().toISOString();
    const sessionId = `SES-${Date.now().toString().slice(-6)}`;

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

    setHardware(prev => ({
      ...prev,
      hardwareStatus: 'occupied' as HardwareStatus,
      assignedPetId: pet.id,
      assignedPetName: pet.name,
    }));

    setOwners(prev => prev.map(o =>
      o.id === ownerId
        ? { ...o, accessStatus: 'active' as UserAccessStatus, currentSessionId: sessionId, lastLogin: now }
        : o
    ));

    // Database persistence
    insertSessionToSupabase(newSession);
    updateDeviceInSupabase(hardware.id, { hardwareStatus: 'occupied', assignedPetId: pet.id, assignedPetName: pet.name });
    updateOwnerInSupabase(ownerId, { accessStatus: 'active', currentSessionId: sessionId, lastLogin: now });

    addLog(adminName, 'started_session', owner.name, pet.name, sessionId, 'success', `Assigned to ${hardware.id}`);
    addNotification('pet_assigned', 'Pet Assigned', `${pet.name} assigned to ${hardware.deviceName || hardware.id}.`, 'success', { petName: pet.name, sessionId });

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
    if (!activeSession) return { success: false, error: 'No active session to complete.' };

    const now = releaseData.releaseTime || new Date().toISOString();

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

    setHardware(prev => ({
      ...prev,
      hardwareStatus: 'available' as HardwareStatus,
      assignedPetId: '',
      assignedPetName: '',
    }));

    setOwners(prev => prev.map(o =>
      o.id === activeSession.ownerId
        ? { ...o, accessStatus: 'inactive' as UserAccessStatus, currentSessionId: null }
        : o
    ));

    // Database persistence
    updateSessionInSupabase(activeSession.id, {
      status: 'completed',
      actualReleaseDate: now,
      releaseCondition: releaseData.releaseCondition,
      releaseNotes: releaseData.finalNotes,
      releaseAdmin: adminName,
    });
    updateDeviceInSupabase(hardware.id, { hardwareStatus: 'available', assignedPetId: '', assignedPetName: '' });
    if (activeSession.ownerId) {
      updateOwnerInSupabase(activeSession.ownerId, { accessStatus: 'inactive', currentSessionId: null });
    }

    addLog(adminName, 'completed_session', activeSession.ownerName, activeSession.petName, activeSession.id, 'success', releaseData.releaseCondition);
    addNotification('session_completed', 'Session Completed', `${activeSession.petName}'s monitoring session completed.`, 'success', { petName: activeSession.petName, sessionId: activeSession.id });

    return { success: true, error: null };
  }, [activeSession, hardware.id, addLog, addNotification]);

  const cancelSession = useCallback((
    reason: string,
    adminName: string
  ): { success: boolean; error: string | null } => {
    if (!activeSession) return { success: false, error: 'No active session to cancel.' };

    const now = new Date().toISOString();

    setSessions(prev => prev.map(s =>
      s.id === activeSession.id
        ? { ...s, status: 'cancelled' as PetSessionStatus, releaseTime: now, cancelledReason: reason }
        : s
    ));

    setHardware(prev => ({
      ...prev,
      hardwareStatus: 'available' as HardwareStatus,
      assignedPetId: '',
      assignedPetName: '',
    }));

    setOwners(prev => prev.map(o =>
      o.id === activeSession.ownerId
        ? { ...o, accessStatus: 'inactive' as UserAccessStatus, currentSessionId: null }
        : o
    ));

    // Database persistence
    updateSessionInSupabase(activeSession.id, { status: 'cancelled', actualReleaseDate: now, releaseNotes: reason });
    updateDeviceInSupabase(hardware.id, { hardwareStatus: 'available', assignedPetId: '', assignedPetName: '' });
    if (activeSession.ownerId) {
      updateOwnerInSupabase(activeSession.ownerId, { accessStatus: 'inactive', currentSessionId: null });
    }

    addLog(adminName, 'cancelled_session', activeSession.ownerName, activeSession.petName, activeSession.id, 'success', reason);
    addNotification('hardware_available', 'Session Cancelled', `${activeSession.petName}'s session cancelled.`, 'warning');

    return { success: true, error: null };
  }, [activeSession, hardware.id, addLog, addNotification]);

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
    insertOwnerToSupabase(newOwner);
    return newOwner;
  }, [owners.length]);

  const updateOwner = useCallback((id: string, data: Partial<PetOwner>) => {
    setOwners(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
    updateOwnerInSupabase(id, data);
  }, []);

  const deactivateOwner = useCallback((id: string, adminName: string) => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return;
    setOwners(prev => prev.map(o => o.id === id ? { ...o, accessStatus: 'inactive' as UserAccessStatus } : o));
    updateOwnerInSupabase(id, { accessStatus: 'inactive' });
    addLog(adminName, 'deactivated_owner', owner.name, null, null, 'success');
  }, [owners, addLog]);

  const reactivateOwner = useCallback((id: string, adminName: string) => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return;
    setOwners(prev => prev.map(o => o.id === id ? { ...o, accessStatus: 'inactive' as UserAccessStatus } : o));
    updateOwnerInSupabase(id, { accessStatus: 'inactive' });
    addLog(adminName, 'reactivated_account', owner.name, null, null, 'success');
  }, [owners, addLog]);

  const archiveOwner = useCallback((id: string, adminName: string) => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return;
    setOwners(prev => prev.map(o => o.id === id ? { ...o, accessStatus: 'archived' as UserAccessStatus } : o));
    updateOwnerInSupabase(id, { accessStatus: 'archived' });
    addLog(adminName, 'archived_account', owner.name, null, null, 'success');
  }, [owners, addLog]);

  const deleteOwnerPermanent = useCallback((id: string, adminName: string): { success: boolean; error: string | null } => {
    const owner = owners.find(o => o.id === id);
    if (!owner) return { success: false, error: 'Owner not found.' };

    if (owner.currentSessionId && activeSession?.ownerId === id) {
      return { success: false, error: 'Cannot delete owner with active monitoring session.' };
    }

    setOwners(prev => prev.filter(o => o.id !== id));
    deleteOwnerFromSupabase(id);
    addLog(adminName, 'deactivated_owner', owner.name, null, null, 'warning', 'Permanent deletion');
    return { success: true, error: null };
  }, [owners, activeSession, addLog]);

  // ─── Hardware Management ──────────────────────────────────────────────
  const changeHardwareStatus = useCallback((status: HardwareStatus, adminName: string) => {
    if (activeSession && status !== 'occupied') return;
    setHardware(prev => ({ ...prev, hardwareStatus: status }));
    updateDeviceInSupabase(hardware.id, { hardwareStatus: status });
    addLog(adminName, 'changed_hardware_status', null, null, null, 'success', `Status changed to ${status}`);
  }, [activeSession, hardware.id, addLog]);

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

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
