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
  deleteDeviceFromSupabase,
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
  dispenseDirect: (deviceId: string, grams?: number, foodType?: string) => void;
  dispenseWaterDirect: (deviceId: string, amountMl?: number) => void;

  refillWater: (deviceId: string) => void;

  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;

  addDevice: (device: Omit<Device, 'id' | 'status' | 'lastTransmission'>) => void;
  removeDevice: (id: string) => void;
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
        return parsed;
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
        return parsed;
      }
      return [];
    } catch { return []; }
  });
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>(() => {
    try {
      const saved = localStorage.getItem('hn_feeding_logs');
      if (saved) {
        const parsed = JSON.parse(saved) as FeedingLog[];
        return parsed;
      }
      return [];
    } catch { return []; }
  });
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>(() => {
    try {
      const saved = localStorage.getItem('hn_hydration_logs');
      if (saved) {
        const parsed = JSON.parse(saved) as HydrationLog[];
        return parsed;
      }
      return [];
    } catch { return []; }
  });
  const [vitals, setVitals] = useState<VitalSignRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hn_vitals');
      if (saved) {
        const parsed = JSON.parse(saved) as VitalSignRecord[];
        return parsed;
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
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const saved = localStorage.getItem('hn_devices');
      if (saved) return JSON.parse(saved) as Device[];
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hn_devices', JSON.stringify(devices));
    } catch {}
  }, [devices]);

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
        if (remoteDevices) {
          setDevices(remoteDevices);
        }
        if (remoteUsers && remoteUsers.length > 0) setUsers(remoteUsers);
        if (remoteSettings) setSettings(remoteSettings);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase full sync notice.');
      }
    }

    syncAllDataFromSupabase();

    // Fast 1.5-second polling for active ESP32 hardware telemetry
    const devicePollInterval = setInterval(async () => {
      const devData = await fetchDevicesFromSupabase();
      if (devData) {
        setDevices(devData);
      }
    }, 1500);

    return () => clearInterval(devicePollInterval);
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
        if (data) setDevices(data);
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

    // --- Live Dynamic Telemetry Simulation Engine -------------------------
  useEffect(() => {
    const telemetryInterval = setInterval(async () => {
      if (devices.length === 0) return;
      const activeDev = devices.find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || devices[0];
      if (!activeDev || activeDev.status !== 'Online' || !activeDev.assignedPetId) return;

      // Pure real hardware telemetry: Do NOT inject random simulated deltas for real ESP32 hardware
      if (activeDev.id === 'HN-NODE-F778' || activeDev.id.startsWith('HN-NODE') || activeDev.macAddress?.includes('1C:C3:AB')) {
        return;
      }
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

    // Set to Pending so ESP32 detects the signal and physically rotates the servo
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, dispenseStatus: 'Pending' }
          : s
      )
    );

    showToast('info', 'Hardware Signal Sent', `Dispense trigger dispatched to node ${sch.deviceId || 'ESP32'}.`);
    await updateScheduleInSupabase(scheduleId, { dispenseStatus: 'Pending' });
  };

  const dispenseDirect = async (deviceId: string, portionGrams: number = 75, foodType: string = '90° Gate Cycle (+90° Open / -90° Close)') => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const targetDeviceId = deviceId || dev?.id || 'HN-NODE-F778';

    const newSch: FeedingSchedule = {
      id: `SCH-DIR-${Date.now().toString().slice(-4)}`,
      petId,
      petName,
      foodType,
      portionGrams: 75,
      scheduledTime: 'Instant Manual',
      dispenseStatus: 'Pending',
      deviceId: targetDeviceId,
    };

    setSchedules((prev) => [newSch, ...prev]);
    showToast('success', '90° Gate Cycle Triggered', `Opening +90° & closing -90° on node ${targetDeviceId}.`);

    // ⚡ Ultra-Fast Parallel Dispatch: Direct LAN REST + Supabase Cloud Queue
    try {
      fetch('http://192.168.100.159/api/dispense/food', { method: 'POST', mode: 'no-cors' }).catch(() => {});
      fetch('http://hydronourish.local/api/dispense/food', { method: 'POST', mode: 'no-cors' }).catch(() => {});
    } catch {}

    await insertScheduleToSupabase(newSch);
  };

  const dispenseWaterDirect = async (deviceId: string, amountMl: number = 250) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';

    const newSch: FeedingSchedule = {
      id: `SCH-WTR-${Date.now().toString().slice(-4)}`,
      petId,
      petName,
      foodType: 'Fresh Filtered Water',
      portionGrams: amountMl,
      scheduledTime: 'Instant Manual',
      dispenseStatus: 'Pending',
      deviceId: deviceId,
    };

    setSchedules((prev) => [newSch, ...prev]);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog: HydrationLog = {
      id: `HL-${Date.now().toString().slice(-4)}`,
      petId,
      petName,
      amountMl,
      timestamp,
      reservoirLevelPct: Math.min(100, Math.max(10, (dev?.waterLevelPct || 80) + 15)),
    };
    setHydrationLogs((prev) => [newLog, ...prev]);

    showToast('success', 'Water Dispense Triggered', `Triggered ${amountMl}ml water pump to ${deviceId}.`);
    await insertScheduleToSupabase(newSch);
    await insertHydrationLogToSupabase(newLog);
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
    const macTag = devData.macAddress ? devData.macAddress.replace(/:/g, '').slice(-4).toUpperCase() : Date.now().toString().slice(-4);
    const newId = `HN-NODE-${macTag}`;
    const newDev: Device = {
      ...devData,
      id: newId,
      status: 'Online',
      lastTransmission: 'Just now',
    };
    setDevices((prev) => [newDev, ...prev.filter(d => d.id !== newId)]);
    showToast('success', 'Device Connected', `Smart ${newId} paired to ${devData.assignedPetName}.`);
    await insertDeviceToSupabase(newDev);
  };

  const removeDevice = async (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    showToast('info', 'Device Disconnected', `Node ${id} unpaired successfully.`);
    await deleteDeviceFromSupabase(id);
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
        dispenseDirect,
        dispenseWaterDirect,
        refillWater,
        acknowledgeAlert,
        resolveAlert,
        addDevice,
        removeDevice,
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
