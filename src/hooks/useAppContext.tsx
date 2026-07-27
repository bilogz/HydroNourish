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
  ToastMessage
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
  initialSettings
} from '../data/mockData';
import { fetchPetsFromSupabase, insertPetToSupabase } from '../services/supabase';

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
  
  currentUser: ClinicUser;
  setCurrentUser: React.Dispatch<React.SetStateAction<ClinicUser>>;
  
  // Navigation & UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  login: () => void;
  loginAsUser: (email: string) => void;
  logout: () => void;

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
      return saved ? JSON.parse(saved) : (initialPets || []);
    } catch (e) {
      return initialPets || [];
    }
  });

  const [schedules, setSchedules] = useState<FeedingSchedule[]>(initialSchedules || []);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>(initialFeedingLogs || []);
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>(initialHydrationLogs || []);
  const [vitals, setVitals] = useState<VitalSignRecord[]>(initialVitals || []);
  const [alerts, setAlerts] = useState<AIHealthAlert[]>(initialAIAlerts || []);
  const [devices, setDevices] = useState<Device[]>(initialDevices || []);
  const [users, setUsers] = useState<ClinicUser[]>(initialUsers || []);
  const [settings, setSettings] = useState<ClinicSettings>(initialSettings || ({} as any));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('hn_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    try {
      localStorage.setItem('hn_pets', JSON.stringify(pets));
    } catch (e) {}
  }, [pets]);

  // Sync with real Supabase database on mount
  useEffect(() => {
    async function syncDatabase() {
      try {
        const remotePets = await fetchPetsFromSupabase();
        if (remotePets && Array.isArray(remotePets) && remotePets.length > 0) {
          setPets(remotePets);
        }
      } catch (err) {
        console.warn('Supabase sync fallback to initial data:', err);
      }
    }
    syncDatabase();
  }, []);

  useEffect(() => {
    localStorage.setItem('hn_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('hn_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Current Active User State (Defaults to Super Admin Joecel Garcia)
  const [currentUser, setCurrentUser] = useState<ClinicUser>(() => {
    const saved = localStorage.getItem('hn_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialUsers[0]; // Joecel Garcia (Super Admin)
  });

  useEffect(() => {
    localStorage.setItem('hn_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const login = () => {
    setIsAuthenticated(true);
    showToast('success', 'Signed In', 'Welcome back to HydroNourish Dashboard.');
  };

  const loginAsUser = (userEmail: string) => {
    const found = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase()) || {
      id: 'USR-SUPER-01',
      name: 'Joecel Garcia',
      email: 'joecelgarcia1@gmail.com',
      role: 'Super Admin' as const,
      department: 'Chief Executive & Master System Controller',
      status: 'Active' as const,
      lastActive: 'Now (Active)'
    };
    setCurrentUser(found);
    setIsAuthenticated(true);
    showToast('success', `${found.role} Access`, `Welcome back, ${found.name}!`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    showToast('info', 'Logged Out', 'You have been signed out safely.');
  };

  // Pet Handlers
  const addPet = (petData: Omit<Pet, 'id'>) => {
    const newId = `PET-${String(pets.length + 1).padStart(3, '0')}`;
    const newPet: Pet = { ...petData, id: newId };
    setPets(prev => [newPet, ...prev]);
    showToast('success', 'Pet Registered', `${newPet.name} has been added to Heritage Animal Clinic.`);
  };

  const updatePet = (id: string, updated: Partial<Pet>) => {
    setPets(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
    showToast('success', 'Pet Updated', 'Pet profile changes saved.');
  };

  const deletePet = (id: string) => {
    const petName = pets.find(p => p.id === id)?.name || 'Pet';
    setPets(prev => prev.filter(p => p.id !== id));
    showToast('info', 'Pet Removed', `${petName} record deleted.`);
  };

  // Feeding Handlers
  const addSchedule = (data: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => {
    const newId = `SCH-${Date.now().toString().slice(-4)}`;
    const newSch: FeedingSchedule = {
      ...data,
      id: newId,
      dispenseStatus: 'Pending'
    };
    setSchedules(prev => [newSch, ...prev]);
    showToast('success', 'Schedule Created', `New feeding rule added for ${data.petName}.`);
  };

  const dispenseNow = (scheduleId: string) => {
    const sch = schedules.find(s => s.id === scheduleId);
    if (!sch) return;

    setSchedules(prev =>
      prev.map(s =>
        s.id === scheduleId
          ? { ...s, dispenseStatus: 'Dispensed', lastDispensedAt: 'Just now' }
          : s
      )
    );

    // Create log entry
    const newLog: FeedingLog = {
      id: `FL-${Date.now().toString().slice(-4)}`,
      petId: sch.petId,
      petName: sch.petName,
      portionGrams: sch.portionGrams,
      dispensedAt: 'Just now',
      status: 'Manual Override',
      deviceId: sch.deviceId
    };
    setFeedingLogs(prev => [newLog, ...prev]);

    showToast('success', 'Feeding Command Sent', `Dispensed ${sch.portionGrams}g portion for ${sch.petName}.`);
  };

  // Hydration Handlers
  const refillWater = (deviceId: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === deviceId ? { ...d, waterLevelPct: 100, status: 'Online' } : d))
    );

    const dev = devices.find(d => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Unit';

    // Log refill
    const newLog: HydrationLog = {
      id: `HL-${Date.now().toString().slice(-4)}`,
      petId: dev?.assignedPetId || 'DEV',
      petName: petName,
      amountMl: 500,
      timestamp: 'Just now',
      reservoirLevelPct: 100
    };
    setHydrationLogs(prev => [newLog, ...prev]);

    showToast('success', 'Water Reservoir Refilled', `Dispenser container for ${petName} is now 100% full.`);
  };

  // Alert Handlers
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, reviewStatus: 'In Review' } : a))
    );
    showToast('info', 'Alert In Review', 'Marked alert for veterinary staff evaluation.');
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, reviewStatus: 'Resolved' } : a))
    );
    showToast('success', 'Alert Resolved', 'Health observation marked resolved.');
  };

  // Device Handlers
  const addDevice = (devData: Omit<Device, 'id' | 'status' | 'lastTransmission'>) => {
    const newId = `HN-DEV-0${devices.length + 101}`;
    const newDev: Device = {
      ...devData,
      id: newId,
      status: 'Online',
      lastTransmission: 'Just now'
    };
    setDevices(prev => [newDev, ...prev]);
    showToast('success', 'Device Connected', `Unit ${newId} paired to pet ${devData.assignedPetName}.`);
  };

  // User Handlers
  const addUser = (userData: Omit<ClinicUser, 'id' | 'lastActive'>) => {
    const newId = `USR-${String(users.length + 1).padStart(2, '0')}`;
    const newUser: ClinicUser = {
      ...userData,
      id: newId,
      lastActive: 'Just registered'
    };
    setUsers(prev => [newUser, ...prev]);
    showToast('success', 'Staff Member Added', `${userData.name} registered as ${userData.role}.`);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' }
          : u
      )
    );
    showToast('info', 'User Status Updated', 'Account state changed.');
  };

  // Settings Handler
  const updateSettings = (newSet: Partial<ClinicSettings>) => {
    setSettings(prev => ({ ...prev, ...newSet }));
    showToast('success', 'Settings Saved', 'System preferences updated successfully.');
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
        currentUser,
        setCurrentUser,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        isAuthenticated,
        login,
        loginAsUser,
        logout,
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
        toggleUserStatus,
        updateSettings,
        showToast,
        removeToast
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
