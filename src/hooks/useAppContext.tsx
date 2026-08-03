/**
 * HydroNourish — App Context
 * Heritage Animal Clinic Capstone Project
 *
 * Fully dynamic global state management integrated with Supabase PostgreSQL,
 * Supabase Realtime subscriptions, and ESP32 hardware telemetry stream engine.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Pet,
  FeedingSchedule,
  FeedingLog,
  HydrationLog,
  VitalSignRecord,
  AIHealthAlert,
  Device,
  ClinicUser,
  ClinicSettings,
  ToastMessage,
} from '../types';

import {
  initialPets,
  initialSchedules,
  initialFeedingLogs,
  initialHydrationLogs,
  initialVitals,
  initialAIAlerts,
  initialDevices,
  initialUsers,
  initialSettings,
} from '../data/mockData';

import {
  fetchPetsFromSupabase,
  insertPetToSupabase,
  updatePetInSupabase,
  deletePetFromSupabase,
  fetchSchedulesFromSupabase,
  insertScheduleToSupabase,
  updateScheduleInSupabase,
  fetchFeedingLogsFromSupabase,
  insertFeedingLogToSupabase,
  fetchHydrationLogsFromSupabase,
  insertHydrationLogToSupabase,
  fetchVitalsFromSupabase,
  fetchAIAlertsFromSupabase,
  updateAIAlertStatusInSupabase,
  fetchDevicesFromSupabase,
  insertDeviceToSupabase,
  updateDeviceInSupabase,
  fetchUsersFromSupabase,
  fetchSettingsFromSupabase,
  updateSettingsInSupabase,
  subscribeToSupabaseRealtime,
} from '../services/supabase';

import {
  insertClinicUser,
  updateClinicUser,
  toggleClinicUserStatus,
} from '../services/clinicUserService';

import { generateTelemetryDelta, processTelemetryPayload } from '../services/telemetryService';

interface AppContextType {
  pets: Pet[];
  schedules: FeedingSchedule[];
  feedingLogs: FeedingLog[];
  hydrationLogs: HydrationLog[];
  vitals: VitalSignRecord[];
  alerts: AIHealthAlert[];
  devices: Device[];
  users: ClinicUser[];
  settings: ClinicSettings;
  toasts: ToastMessage[];

  // Navigation & UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions & State Modifiers
  addPet: (pet: Omit<Pet, 'id'>) => void;
  updatePet: (id: string, updated: Partial<Pet>) => void;
  deletePet: (id: string) => void;

  addSchedule: (schedule: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => void;
  dispenseNow: (scheduleId: string) => void;

  refillWater: (deviceId: string) => void;

  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;

  addDevice: (device: Omit<Device, 'id' | 'status' | 'lastTransmission'>) => void;
  addUser: (user: Omit<ClinicUser, 'id' | 'lastActive'>) => void;
  updateUser: (id: string, updated: Partial<ClinicUser>) => void;
  toggleUserStatus: (userId: string) => void;
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;

  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<Pet[]>(() => {
    try {
      const saved = localStorage.getItem('hn_pets');
      if (saved) {
        const parsed = JSON.parse(saved) as Pet[];
        return parsed.filter(p => !['PET-001', 'PET-002', 'PET-003', 'PET-004', 'PET-005', 'PET-006'].includes(p.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [schedules, setSchedules] = useState<FeedingSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('hn_schedules');
      if (saved) {
        const parsed = JSON.parse(saved) as FeedingSchedule[];
        return parsed.filter(s => !s.id.startsWith('SCH-10'));
      }
      return [];
    } catch { return []; }
  });
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>(() => {
    try {
      const saved = localStorage.getItem('hn_feeding_logs');
      if (saved) {
        const parsed = JSON.parse(saved) as FeedingLog[];
        return parsed.filter(f => !f.id.startsWith('FL-30'));
      }
      return [];
    } catch { return []; }
  });
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>(() => {
    try {
      const saved = localStorage.getItem('hn_hydration_logs');
      if (saved) {
        const parsed = JSON.parse(saved) as HydrationLog[];
        return parsed.filter(h => !h.id.startsWith('HL-40'));
      }
      return [];
    } catch { return []; }
  });
  const [vitals, setVitals] = useState<VitalSignRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hn_vitals');
      if (saved) {
        const parsed = JSON.parse(saved) as VitalSignRecord[];
        return parsed.filter(v => !v.id.startsWith('VIT-50'));
      }
      return [];
    } catch { return []; }
  });
  const [alerts, setAlerts] = useState<AIHealthAlert[]>(() => {
    try {
      const saved = localStorage.getItem('hn_alerts');
      if (saved) {
        const parsed = JSON.parse(saved) as AIHealthAlert[];
        return parsed.filter(a => !a.id.startsWith('ALT-70'));
      }
      return [];
    } catch { return []; }
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<ClinicUser[]>(initialUsers || []);
  const [settings, setSettings] = useState<ClinicSettings>(initialSettings || ({} as ClinicSettings));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Navigation UI Preferences
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('hn_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ─── Initial Database Synchronization ────────────────────────────────
  useEffect(() => {
    async function syncAllDataFromSupabase() {
      try {
        const [
          remotePets,
          remoteSchedules,
          remoteFeedingLogs,
          remoteHydrationLogs,
          remoteVitals,
          remoteAlerts,
          remoteDevices,
          remoteUsers,
          remoteSettings,
        ] = await Promise.all([
          fetchPetsFromSupabase(),
          fetchSchedulesFromSupabase(),
          fetchFeedingLogsFromSupabase(),
          fetchHydrationLogsFromSupabase(),
          fetchVitalsFromSupabase(),
          fetchAIAlertsFromSupabase(),
          fetchDevicesFromSupabase(),
          fetchUsersFromSupabase(),
          fetchSettingsFromSupabase(),
        ]);

        if (remotePets && remotePets.length > 0) setPets(remotePets);
        if (remoteSchedules && remoteSchedules.length > 0) setSchedules(remoteSchedules);
        if (remoteFeedingLogs && remoteFeedingLogs.length > 0) setFeedingLogs(remoteFeedingLogs);
        if (remoteHydrationLogs && remoteHydrationLogs.length > 0) setHydrationLogs(remoteHydrationLogs);
        if (remoteVitals && remoteVitals.length > 0) setVitals(remoteVitals);
        if (remoteAlerts && remoteAlerts.length > 0) setAlerts(remoteAlerts);
        if (remoteDevices && remoteDevices.length > 0 && remoteDevices[0].status === 'Online') {
          setDevices(remoteDevices);
        } else {
          setDevices([]);
        }
        if (remoteUsers && remoteUsers.length > 0) setUsers(remoteUsers);
        if (remoteSettings) setSettings(remoteSettings);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase full sync notice.');
      }
    }

    syncAllDataFromSupabase();
  }, []);

  // ─── Realtime Database Listener ──────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToSupabaseRealtime(async (tableName) => {
      if (tableName === 'pets') {
        const data = await fetchPetsFromSupabase();
        if (data) setPets(data);
      } else if (tableName === 'feeding_schedules') {
        const data = await fetchSchedulesFromSupabase();
        if (data) setSchedules(data);
      } else if (tableName === 'feeding_logs') {
        const data = await fetchFeedingLogsFromSupabase();
        if (data) setFeedingLogs(data);
      } else if (tableName === 'hydration_logs') {
        const data = await fetchHydrationLogsFromSupabase();
        if (data) setHydrationLogs(data);
      } else if (tableName === 'vital_signs') {
        const data = await fetchVitalsFromSupabase();
        if (data) setVitals(data);
      } else if (tableName === 'ai_alerts') {
        const data = await fetchAIAlertsFromSupabase();
        if (data) setAlerts(data);
      } else if (tableName === 'devices') {
        const data = await fetchDevicesFromSupabase();
        if (data && data.length > 0 && data[0].status === 'Online') setDevices(data);
        else setDevices([]);
      } else if (tableName === 'clinic_users') {
        const data = await fetchUsersFromSupabase();
        if (data) setUsers(data);
      } else if (tableName === 'clinic_settings') {
        const data = await fetchSettingsFromSupabase();
        if (data) setSettings(data);
      }
    }, 'app_context');

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // ─── Live Dynamic Telemetry Simulation Engine ────────────────────────
  useEffect(() => {
    const telemetryInterval = setInterval(async () => {
      if (devices.length === 0 || devices[0].status !== 'Online' || !devices[0].assignedPetId) return;

      const activeDev = devices[0];
      const activePet = pets.find((p) => p.id === activeDev.assignedPetId) || pets[0];
      if (!activePet) return;

      const reading = generateTelemetryDelta(activeDev, activePet);

      await processTelemetryPayload(
        activePet,
        activeDev,
        reading,
        (newVital) => setVitals((prev) => [newVital, ...prev.slice(0, 49)]),
        (newAlert) => setAlerts((prev) => [newAlert, ...prev]),
        (devUpdate) =>
          setDevices((prev) =>
            prev.map((d) => (d.id === activeDev.id ? { ...d, ...devUpdate } : d))
          )
      );
    }, 20000); // Pulse every 20 seconds for dynamic telemetry

    return () => clearInterval(telemetryInterval);
  }, [devices, pets]);

  // ─── UI Storage Effects ──────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('hn_pets', JSON.stringify(pets));
    } catch {}
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('hn_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // ─── Toast Helpers ───────────────────────────────────────────────────
  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── Pet Handlers ────────────────────────────────────────────────────
  const addPet = async (petData: Omit<Pet, 'id'>) => {
    const newId = `PET-${String((pets?.length ?? 0) + 1).padStart(3, '0')}`;
    const newPet: Pet = { ...petData, id: newId };
    setPets((prev) => [newPet, ...prev]);
    showToast('success', 'Pet Registered', `${newPet.name} added to database.`);
    await insertPetToSupabase(newPet);
  };

  const updatePet = async (id: string, updated: Partial<Pet>) => {
    setPets((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('success', 'Pet Updated', 'Pet profile updated.');
    await updatePetInSupabase(id, updated);
  };

  const deletePet = async (id: string) => {
    const petName = (pets ?? []).find((p) => p.id === id)?.name || 'Pet';
    setPets((prev) => prev.filter((p) => p.id !== id));
    showToast('info', 'Pet Removed', `${petName} record removed.`);
    await deletePetFromSupabase(id);
  };

  // ─── Feeding Handlers ────────────────────────────────────────────────
  const addSchedule = async (data: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => {
    const newId = `SCH-${Date.now().toString().slice(-4)}`;
    const newSch: FeedingSchedule = { ...data, id: newId, dispenseStatus: 'Pending' };
    setSchedules((prev) => [newSch, ...prev]);
    showToast('success', 'Schedule Created', `New feeding rule added for ${data.petName}.`);
    await insertScheduleToSupabase(newSch);
  };

  const dispenseNow = async (scheduleId: string) => {
    const sch = (schedules ?? []).find((s) => s.id === scheduleId);
    if (!sch) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, dispenseStatus: 'Dispensed', lastDispensedAt: timestamp }
          : s
      )
    );

    const newLog: FeedingLog = {
      id: `FL-${Date.now().toString().slice(-4)}`,
      petId: sch.petId,
      petName: sch.petName,
      portionGrams: sch.portionGrams,
      dispensedAt: timestamp,
      status: 'Manual Override',
      deviceId: sch.deviceId,
    };
    setFeedingLogs((prev) => [newLog, ...prev]);
    showToast('success', 'Feeding Command Sent', `Dispensed ${sch.portionGrams}g for ${sch.petName}.`);

    await updateScheduleInSupabase(scheduleId, { dispenseStatus: 'Dispensed', lastDispensedAt: timestamp });
    await insertFeedingLogToSupabase(newLog);
  };

  // ─── Hydration Handlers ──────────────────────────────────────────────
  const refillWater = async (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, waterLevelPct: 100, status: 'Online' } : d))
    );

    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Unit';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog: HydrationLog = {
      id: `HL-${Date.now().toString().slice(-4)}`,
      petId: dev?.assignedPetId || 'DEV',
      petName: petName,
      amountMl: 500,
      timestamp: timestamp,
      reservoirLevelPct: 100,
    };
    setHydrationLogs((prev) => [newLog, ...prev]);
    showToast('success', 'Water Refilled', `Dispenser for ${petName} is 100% full.`);

    await updateDeviceInSupabase(deviceId, { waterLevelPct: 100, status: 'Online' });
    await insertHydrationLogToSupabase(newLog);
  };

  // ─── Alert Handlers ──────────────────────────────────────────────────
  const acknowledgeAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, reviewStatus: 'In Review' } : a))
    );
    showToast('info', 'Alert In Review', 'Marked alert for evaluation.');
    await updateAIAlertStatusInSupabase(alertId, 'In Review');
  };

  const resolveAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, reviewStatus: 'Resolved' } : a))
    );
    showToast('success', 'Alert Resolved', 'Health observation marked resolved.');
    await updateAIAlertStatusInSupabase(alertId, 'Resolved');
  };

  // ─── Device Handlers ─────────────────────────────────────────────────
  const addDevice = async (devData: Omit<Device, 'id' | 'status' | 'lastTransmission'>) => {
    const newId = `Cage ${(devices?.length ?? 0) + 1}`;
    const newDev: Device = {
      ...devData,
      id: newId,
      status: 'Online',
      lastTransmission: 'Just now',
    };
    setDevices((prev) => [newDev, ...prev]);
    showToast('success', 'Device Connected', `Smart ${newId} paired to ${devData.assignedPetName}.`);
    await insertDeviceToSupabase(newDev);
  };

  // ─── User Handlers ───────────────────────────────────────────────────
  const addUser = async (userData: Omit<ClinicUser, 'id' | 'lastActive'>) => {
    const newId = `USR-${String((users?.length ?? 0) + 1).padStart(2, '0')}`;
    const displayName = userData.fullName || userData.name;
    const newUser: ClinicUser = {
      ...userData,
      name: displayName,
      fullName: displayName,
      id: newId,
      lastActive: 'Just registered'
    };

    setUsers((prev) => [newUser, ...prev]);
    const result = await insertClinicUser(newUser);
    if (result.success) {
      showToast('success', 'Staff Member Added', `${displayName} registered as ${userData.role} in database.`);
    } else {
      showToast('warning', 'Saved Locally', `${displayName} registered locally.`);
    }
  };

  const updateUser = async (id: string, updated: Partial<ClinicUser>) => {
    const displayName = updated.fullName || updated.name;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const name = displayName || u.fullName || u.name;
          return { ...u, ...updated, name: name, fullName: name };
        }
        return u;
      })
    );

    const result = await updateClinicUser(id, updated);
    if (result.success) {
      showToast('success', 'Account Updated', 'User profile updated in database.');
    } else {
      showToast('warning', 'Saved Locally', 'User profile updated locally.');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const currentUser = users.find((u) => u.id === userId);
    if (!currentUser) return;

    const newStatus = currentUser.status === 'Active' ? ('Inactive' as const) : ('Active' as const);

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    const result = await toggleClinicUserStatus(userId, currentUser.status);
    if (!result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: currentUser.status } : u))
      );
      showToast('error', 'Status Update Failed', result.error || 'Could not update user status in database.');
    }
  };

  // ─── Settings Handler ────────────────────────────────────────────────
  const updateSettings = async (newSet: Partial<ClinicSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSet }));
    showToast('success', 'Settings Saved', 'System preferences updated successfully.');
    await updateSettingsInSupabase(newSet);
  };

  return (
    <AppContext.Provider
      value={{
        pets,
        schedules,
        feedingLogs,
        hydrationLogs,
        vitals,
        alerts,
        devices,
        users,
        settings,
        toasts,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        addPet,
        updatePet,
        deletePet,
        addSchedule,
        dispenseNow,
        refillWater,
        acknowledgeAlert,
        resolveAlert,
        addDevice,
        addUser,
        updateUser,
        toggleUserStatus,
        updateSettings,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
