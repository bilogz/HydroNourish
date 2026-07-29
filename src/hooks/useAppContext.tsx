/**
 * HydroNourish — App Context
 * Heritage Animal Clinic Capstone Project
 *
 * Provides global application state for pet data, schedules, alerts,
 * devices, users, settings, and UI preferences.
 *
 * Authentication is handled separately in src/contexts/AuthContext.tsx.
 * LocalStorage is used ONLY for harmless UI preferences (sidebar state).
 * It is never used for auth tokens, roles, or sensitive data.
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
import { fetchPetsFromSupabase, fetchUsersFromSupabase } from '../services/supabase';

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

  // Navigation & UI State (harmless preferences — OK in localStorage)
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
      return saved ? (JSON.parse(saved) as Pet[]) : (initialPets || []);
    } catch {
      return initialPets || [];
    }
  });

  const [schedules, setSchedules] = useState<FeedingSchedule[]>(initialSchedules || []);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>(initialFeedingLogs || []);
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>(initialHydrationLogs || []);
  const [vitals, setVitals] = useState<VitalSignRecord[]>(initialVitals || []);
  const [alerts, setAlerts] = useState<AIHealthAlert[]>(initialAIAlerts || []);
  const [devices, setDevices] = useState<Device[]>(initialDevices || []);
  const [users, setUsers] = useState<ClinicUser[]>(() => {
    try {
      const saved = localStorage.getItem('hn_users');
      if (saved) {
        const parsed = JSON.parse(saved) as ClinicUser[];
        // Filter out legacy dummy mock users if they exist in localStorage
        const filtered = parsed.filter(
          (u) =>
            u.email !== 'heritagelink45@gmail.com' &&
            u.email !== 's.jenkins@heritageanimalclinic.com' &&
            u.email !== 'a.grant@heritageanimalclinic.com' &&
            u.email !== 'm.santos@heritageanimalclinic.com' &&
            u.email !== 'admin@heritageanimalclinic.com'
        );
        return filtered.length > 0 ? filtered : (initialUsers || []);
      }
      return initialUsers || [];
    } catch {
      return initialUsers || [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hn_users', JSON.stringify(users));
    } catch {
      // Ignore storage errors
    }
  }, [users]);
  const [settings, setSettings] = useState<ClinicSettings>(
    initialSettings || ({} as ClinicSettings)
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ─── UI-only preferences in localStorage (safe, not auth-related) ────
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('hn_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ─── Sync Effects ─────────────────────────────────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem('hn_pets', JSON.stringify(pets));
    } catch {
      // Ignore storage errors
    }
  }, [pets]);

  // Sync with Supabase database on mount (pets and admin_profiles tables)
  useEffect(() => {
    async function syncDatabase() {
      try {
        const remotePets = await fetchPetsFromSupabase();
        if (remotePets && Array.isArray(remotePets) && remotePets.length > 0) {
          setPets(remotePets);
        }
      } catch {
        // Fall back to initial data silently
      }

      try {
        const remoteUsers = await fetchUsersFromSupabase();
        if (remoteUsers && Array.isArray(remoteUsers) && remoteUsers.length > 0) {
          setUsers(remoteUsers);
        }
      } catch {
        // Fall back silently
      }
    }
    syncDatabase();
  }, []);

  useEffect(() => {
    localStorage.setItem('hn_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // ─── Toast Helpers ────────────────────────────────────────────────────

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

  // ─── Pet Handlers ─────────────────────────────────────────────────────

  const addPet = (petData: Omit<Pet, 'id'>) => {
    const newId = `PET-${String((pets?.length ?? 0) + 1).padStart(3, '0')}`;
    const newPet: Pet = { ...petData, id: newId };
    setPets((prev) => [newPet, ...prev]);
    showToast('success', 'Pet Registered', `${newPet.name} has been added to Heritage Animal Clinic.`);
  };

  const updatePet = (id: string, updated: Partial<Pet>) => {
    setPets((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('success', 'Pet Updated', 'Pet profile changes saved.');
  };

  const deletePet = (id: string) => {
    const petName = (pets ?? []).find((p) => p.id === id)?.name || 'Pet';
    setPets((prev) => prev.filter((p) => p.id !== id));
    showToast('info', 'Pet Removed', `${petName} record deleted.`);
  };

  // ─── Feeding Handlers ─────────────────────────────────────────────────

  const addSchedule = (data: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => {
    const newId = `SCH-${Date.now().toString().slice(-4)}`;
    const newSch: FeedingSchedule = { ...data, id: newId, dispenseStatus: 'Pending' };
    setSchedules((prev) => [newSch, ...prev]);
    showToast('success', 'Schedule Created', `New feeding rule added for ${data.petName}.`);
  };

  const dispenseNow = (scheduleId: string) => {
    const sch = (schedules ?? []).find((s) => s.id === scheduleId);
    if (!sch) return;

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, dispenseStatus: 'Dispensed', lastDispensedAt: 'Just now' }
          : s
      )
    );

    const newLog: FeedingLog = {
      id: `FL-${Date.now().toString().slice(-4)}`,
      petId: sch.petId,
      petName: sch.petName,
      portionGrams: sch.portionGrams,
      dispensedAt: 'Just now',
      status: 'Manual Override',
      deviceId: sch.deviceId,
    };
    setFeedingLogs((prev) => [newLog, ...prev]);
    showToast('success', 'Feeding Command Sent', `Dispensed ${sch.portionGrams}g for ${sch.petName}.`);
  };

  // ─── Hydration Handlers ───────────────────────────────────────────────

  const refillWater = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, waterLevelPct: 100, status: 'Online' } : d))
    );

    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Unit';

    const newLog: HydrationLog = {
      id: `HL-${Date.now().toString().slice(-4)}`,
      petId: dev?.assignedPetId || 'DEV',
      petName: petName,
      amountMl: 500,
      timestamp: 'Just now',
      reservoirLevelPct: 100,
    };
    setHydrationLogs((prev) => [newLog, ...prev]);
    showToast('success', 'Water Reservoir Refilled', `Dispenser for ${petName} is now 100% full.`);
  };

  // ─── Alert Handlers ───────────────────────────────────────────────────

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, reviewStatus: 'In Review' } : a))
    );
    showToast('info', 'Alert In Review', 'Marked alert for veterinary staff evaluation.');
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, reviewStatus: 'Resolved' } : a))
    );
    showToast('success', 'Alert Resolved', 'Health observation marked resolved.');
  };

  // ─── Device Handlers ──────────────────────────────────────────────────

  const addDevice = (devData: Omit<Device, 'id' | 'status' | 'lastTransmission'>) => {
    const newId = `HN-DEV-0${(devices?.length ?? 0) + 101}`;
    const newDev: Device = {
      ...devData,
      id: newId,
      status: 'Online',
      lastTransmission: 'Just now',
    };
    setDevices((prev) => [newDev, ...prev]);
    showToast('success', 'Device Connected', `Unit ${newId} paired to ${devData.assignedPetName}.`);
  };

  // ─── User Handlers ────────────────────────────────────────────────────

  const addUser = (userData: Omit<ClinicUser, 'id' | 'lastActive'>) => {
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
    showToast('success', 'Staff Member Added', `${displayName} registered as ${userData.role}.`);
  };

  const updateUser = (id: string, updated: Partial<ClinicUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const displayName = updated.fullName || updated.name || u.fullName || u.name;
          return {
            ...u,
            ...updated,
            name: displayName,
            fullName: displayName
          };
        }
        return u;
      })
    );
    showToast('success', 'Account Updated', 'User account details updated successfully.');
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
      )
    );
    showToast('info', 'User Status Updated', 'Account state changed.');
  };

  // ─── Settings Handler ─────────────────────────────────────────────────

  const updateSettings = (newSet: Partial<ClinicSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSet }));
    showToast('success', 'Settings Saved', 'System preferences updated successfully.');
  };

  // ─── Provider ─────────────────────────────────────────────────────────

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
