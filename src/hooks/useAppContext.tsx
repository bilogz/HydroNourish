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
  ContactInquiry,
  ChatMessageItem,
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
  initialInquiries,
} from '../data/mockData';

import {
  fetchPetsFromSupabase,
  insertPetToSupabase,
  updatePetInSupabase,
  deletePetFromSupabase,
  fetchSchedulesFromSupabase,
  insertScheduleToSupabase,
  updateScheduleInSupabase,
  deleteScheduleFromSupabase,
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
  fetchContactInquiriesFromSupabase,
  insertContactInquiryToSupabase,
  updateContactInquiryInSupabase,
  deleteContactInquiryFromSupabase,
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
  inquiries: ContactInquiry[];
  unreadInquiriesCount: number;

  // Navigation & UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions & State Modifiers
  addPet: (pet: Omit<Pet, 'id'>) => Promise<Pet>;
  updatePet: (id: string, updated: Partial<Pet>) => void;
  deletePet: (id: string) => void;

  addSchedule: (schedule: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => Promise<void>;
  addFeedingSchedule: (schedule: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => Promise<void>;
  addWaterSchedule: (schedule: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => Promise<void>;
  updateSchedule: (id: string, updated: Partial<FeedingSchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  toggleSchedule: (id: string) => Promise<void>;
  dispenseNow: (scheduleId: string) => void;
  dispenseDirect: (deviceId: string, grams?: number, foodType?: string) => void;
  dispenseWaterDirect: (deviceId: string, amountMl?: number) => void;
  startPumpDirect: (deviceId: string) => Promise<void>;
  stopPumpDirect: (deviceId: string) => Promise<void>;
  toggleAutoRefillDirect: (deviceId: string, enable?: boolean) => Promise<void>;
  togglePumpMasterDirect: (deviceId: string) => Promise<void>;
  deactivatePumpDirect: (deviceId: string, deactivate?: boolean) => Promise<void>;

  refillWater: (deviceId: string) => void;

  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;

  addDevice: (device: Omit<Device, 'id' | 'status' | 'lastTransmission'>) => void;
  updateDevice: (id: string, updated: Partial<Device>) => Promise<void>;
  removeDevice: (id: string) => void;
  addUser: (user: Omit<ClinicUser, 'id' | 'lastActive'>) => void;
  updateUser: (id: string, updated: Partial<ClinicUser>) => void;
  toggleUserStatus: (userId: string) => void;
  updateSettings: (newSettings: Partial<ClinicSettings>) => void;

  // Contact Inquiries & Chat
  addInquiry: (inquiryData: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
  markInquiryStatus: (id: string, status: ContactInquiry['status'], replyMessage?: string, senderName?: string) => Promise<void>;
  sendOwnerFollowUpMessage: (inquiryId: string, messageText: string, senderName?: string) => Promise<boolean>;
  deleteInquiry: (id: string) => Promise<void>;

  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Universal Non-Destructive Thread Merger
export const mergeChatThreads = (
  existingThread?: ChatMessageItem[],
  incomingThread?: ChatMessageItem[]
): ChatMessageItem[] => {
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const combined: ChatMessageItem[] = [];

  const list = [...(existingThread || []), ...(incomingThread || [])];

  for (const m of list) {
    if (!m || typeof m.message !== 'string') continue;
    const msgText = m.message.trim();
    if (!msgText) continue;

    const id = m.id || `msg-${m.sender}-${m.timestamp}-${msgText.slice(0, 15)}`;
    const fingerprint = `${m.sender}:${msgText}`;

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Filter exact duplicate messages within a 2-second window
    if (seenFingerprints.has(fingerprint)) {
      const existing = combined.find((c) => c.sender === m.sender && c.message.trim() === msgText);
      if (existing) {
        const timeDiff = Math.abs(new Date(m.timestamp).getTime() - new Date(existing.timestamp).getTime());
        if (timeDiff < 2500) continue;
      }
    }
    seenFingerprints.add(fingerprint);

    combined.push({
      id,
      sender: m.sender,
      senderName: m.senderName,
      message: msgText,
      timestamp: m.timestamp || new Date().toISOString(),
    });
  }

  combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return combined;
};

// Non-Destructive Device State Merger
export const mergeDeviceUpdates = (existing: Device[], incoming: Device[]): Device[] => {
  if (!incoming || incoming.length === 0) return existing;
  const map = new Map<string, Device>();
  (existing || []).forEach((d) => map.set(d.id, d));
  incoming.forEach((d) => {
    const prev = map.get(d.id);
    if (prev) {
      map.set(d.id, { ...prev, ...d });
    } else {
      map.set(d.id, d);
    }
  });
  return Array.from(map.values());
};

// Anti-bounce lock for manual hardware overrides
const pendingUserOverrides = new Map<string, any>();

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

  // Contact Inquiries State
  const [inquiries, setInquiries] = useState<ContactInquiry[]>(() => {
    try {
      const saved = localStorage.getItem('hn_inquiries');
      if (saved) return JSON.parse(saved) as ContactInquiry[];
      return initialInquiries || [];
    } catch {
      return initialInquiries || [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hn_inquiries', JSON.stringify(inquiries));
    } catch {}
  }, [inquiries]);

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
          remoteInquiries,
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
          fetchContactInquiriesFromSupabase(),
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
        if (remoteInquiries && remoteInquiries.length > 0) setInquiries(remoteInquiries);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[HydroNourish] Supabase full sync notice.');
      }
    }

    syncAllDataFromSupabase();

    // Fast 1.5-second polling for active ESP32 hardware telemetry
    const devicePollInterval = setInterval(async () => {
      const devData = await fetchDevicesFromSupabase();
      if (devData) {
        setDevices((prev) => mergeDeviceUpdates(prev, devData));
      }
    }, 1500);

    return () => clearInterval(devicePollInterval);
  }, []);

// Web Audio synthesized chime for live incoming notifications
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
};

const broadcastInquiryArrival = (inquiry: ContactInquiry) => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('hn_realtime_inquiries_bus');
      channel.postMessage({ type: 'NEW_INQUIRY', inquiry });
      channel.close();
    }
  } catch {}
  try {
    localStorage.setItem('hn_realtime_inquiry_sync', JSON.stringify({ inquiry, timestamp: Date.now() }));
  } catch {}
};

const broadcastInquiryUpdate = (id: string, updates: Partial<ContactInquiry>) => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('hn_realtime_inquiries_bus');
      channel.postMessage({ type: 'UPDATE_INQUIRY', id, updates });
      channel.close();
    }
  } catch {}
  try {
    localStorage.setItem('hn_realtime_inquiry_update_sync', JSON.stringify({ id, updates, timestamp: Date.now() }));
  } catch {}
};

  // ─── Realtime Database Listener & Cross-Tab Inquiries Sync ────────────────
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
        if (data) setDevices((prev) => mergeDeviceUpdates(prev, data));
      } else if (tableName === 'clinic_users') {
        const data = await fetchUsersFromSupabase();
        if (data) setUsers(data);
      } else if (tableName === 'clinic_settings') {
        const data = await fetchSettingsFromSupabase();
        if (data) setSettings(data);
      } else if (tableName === 'contact_inquiries') {
        const data = await fetchContactInquiriesFromSupabase();
        if (data) {
          setInquiries((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const brandNew = data.filter((d) => !existingIds.has(d.id));
            if (brandNew.length > 0) {
              playNotificationChime();
              showToast('info', '📬 New Contact Inquiry', `${brandNew[0].name}: "${brandNew[0].subject}"`);
            }

            return data.map((remote) => {
              const local = prev.find((p) => p.id === remote.id);
              if (!local) return remote;

              const mergedThread = mergeChatThreads(local.messagesThread, remote.messagesThread);
              return {
                ...remote,
                messagesThread: mergedThread,
              };
            });
          });
        }
      }
    }, 'app_context');

    // Cross-tab BroadcastChannel & LocalStorage Event Listeners for zero-latency inquiries
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('hn_realtime_inquiries_bus');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_INQUIRY' && event.data?.inquiry) {
            const incoming: ContactInquiry = event.data.inquiry;
            setInquiries((prev) => {
              if (prev.some((i) => i.id === incoming.id)) return prev;
              playNotificationChime();
              showToast('info', '📬 New Contact Inquiry', `${incoming.name}: "${incoming.subject}"`);
              return [incoming, ...prev];
            });
          } else if (event.data?.type === 'UPDATE_INQUIRY' && event.data?.id) {
            const { id, updates } = event.data;
            setInquiries((prev) =>
              prev.map((inq) => {
                if (inq.id !== id) return inq;
                const mergedThread = updates.messagesThread
                  ? mergeChatThreads(inq.messagesThread, updates.messagesThread)
                  : inq.messagesThread;
                return {
                  ...inq,
                  ...updates,
                  messagesThread: mergedThread,
                };
              })
            );
          }
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hn_realtime_inquiry_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.inquiry) {
            const incoming: ContactInquiry = parsed.inquiry;
            setInquiries((prev) => {
              if (prev.some((i) => i.id === incoming.id)) return prev;
              playNotificationChime();
              showToast('info', '📬 New Contact Inquiry', `${incoming.name}: "${incoming.subject}"`);
              return [incoming, ...prev];
            });
          }
        } catch {}
      } else if (e.key === 'hn_realtime_inquiry_update_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.id && parsed?.updates) {
            const { id, updates } = parsed;
            setInquiries((prev) =>
              prev.map((inq) => {
                if (inq.id !== id) return inq;
                const mergedThread = updates.messagesThread
                  ? mergeChatThreads(inq.messagesThread, updates.messagesThread)
                  : inq.messagesThread;
                return {
                  ...inq,
                  ...updates,
                  messagesThread: mergedThread,
                };
              })
            );
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Fast 2-second background polling for new inquiries from Supabase
    const inquiriesPollInterval = setInterval(async () => {
      const remoteInquiries = await fetchContactInquiriesFromSupabase();
      if (remoteInquiries && remoteInquiries.length > 0) {
        setInquiries((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const brandNew = remoteInquiries.filter((r) => !existingIds.has(r.id));
          if (brandNew.length > 0) {
            playNotificationChime();
            showToast('info', '📬 New Contact Inquiry', `${brandNew[0].name}: "${brandNew[0].subject}"`);
          }

          return remoteInquiries.map((remote) => {
            const local = prev.find((p) => p.id === remote.id);
            if (!local) return remote;

            const remoteThread = remote.messagesThread || [];
            const localThread = local.messagesThread || [];

            let mergedThread = remoteThread;
            if (localThread.length > 0 && remoteThread.length > 0) {
              const seenIds = new Set<string>();
              const combined: ChatMessageItem[] = [];
              for (const m of [...localThread, ...remoteThread]) {
                if (m && m.id && !seenIds.has(m.id)) {
                  seenIds.add(m.id);
                  combined.push(m);
                }
              }
              combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              mergedThread = combined;
            } else if (localThread.length > 0) {
              mergedThread = localThread;
            }

            return {
              ...remote,
              messagesThread: mergedThread.length > 0 ? mergedThread : remote.messagesThread,
            };
          });
        });
      }
    }, 2000);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(inquiriesPollInterval);
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

      const reading = generateTelemetryDelta(activeDev);

      await processTelemetryPayload(
        activePet,
        activeDev,
        reading,
        (newAlert) => setAlerts((prev) => [newAlert, ...prev]),
        (devUpdate: Partial<Device>) =>
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
  const addPet = async (petData: Omit<Pet, 'id'>): Promise<Pet> => {
    const count = (pets?.length ?? 0) + 1;
    const newId = `PET-${String(count).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    const newPet: Pet = { ...petData, id: newId };
    setPets((prev) => [newPet, ...(prev || [])]);
    showToast('success', 'Pet Registered', `${newPet.name} added to database.`);
    await insertPetToSupabase(newPet);
    return newPet;
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

  // ─── Feeding & Hydration Unified Schedulers ─────────────────────────
  const addSchedule = async (data: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => {
    const isWater =
      data.type === 'water' ||
      data.foodType?.toLowerCase().includes('water') ||
      data.foodType?.toLowerCase().includes('pump');
    const prefix = isWater ? 'SCH-WTR' : 'SCH-FEED';
    const newId = `${prefix}-${Date.now().toString().slice(-6)}`;
    const newSch: FeedingSchedule = {
      ...data,
      id: newId,
      type: isWater ? 'water' : 'food',
      dispenseStatus: 'Dispensed',
      enabled: data.enabled !== undefined ? data.enabled : true,
    };
    setSchedules((prev) => [newSch, ...prev]);
    showToast(
      'success',
      isWater ? '💧 Automated Water Schedule Created' : '🍖 Automated Feeding Schedule Created',
      `Scheduled ${data.portionGrams}${isWater ? 'ml' : 'g'} at ${data.scheduledTime} for ${data.petName}.`
    );
    await insertScheduleToSupabase(newSch);
  };

  const addFeedingSchedule = async (data: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => {
    await addSchedule({ ...data, type: 'food' });
  };

  const addWaterSchedule = async (data: Omit<FeedingSchedule, 'id' | 'dispenseStatus'>) => {
    await addSchedule({
      ...data,
      type: 'water',
      foodType: data.foodType || 'Fresh Filtered Water (Pump)',
    });
  };

  const updateSchedule = async (id: string, updated: Partial<FeedingSchedule>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    showToast('info', 'Schedule Updated', 'Schedule preferences synchronized.');
    await updateScheduleInSupabase(id, updated);
  };

  const deleteSchedule = async (id: string) => {
    const sch = (schedules ?? []).find((s) => s.id === id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('info', 'Schedule Removed', `Schedule rule for ${sch?.petName || 'patient'} removed.`);
    await deleteScheduleFromSupabase(id);
  };

  const toggleSchedule = async (id: string) => {
    const sch = (schedules ?? []).find((s) => s.id === id);
    if (!sch) return;
    const newEnabled = sch.enabled === false ? true : false;
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: newEnabled } : s)));
    showToast(
      newEnabled ? 'success' : 'warning',
      newEnabled ? 'Schedule Resumed' : 'Schedule Paused',
      `${sch.petName}'s schedule at ${sch.scheduledTime} is now ${newEnabled ? 'active' : 'paused'}.`
    );
    await updateScheduleInSupabase(id, { dispenseStatus: newEnabled ? 'Dispensed' : 'Failed' });
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

    // ⚡ Zero-Latency Parallel Dispatch: Direct LAN REST + Supabase Cloud Queue
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    try {
      if (cleanIp) {
        fetch(`http://${cleanIp}/api/dispense/food`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        fetch(`http://${cleanIp}/api/dispense/food`, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      }
      fetch('http://hydronourish.local/api/dispense/food', { method: 'POST', mode: 'no-cors' }).catch(() => {});
      fetch('http://192.168.4.1/api/dispense/food', { method: 'POST', mode: 'no-cors' }).catch(() => {});
    } catch {}

    await insertScheduleToSupabase(newSch);
  };

  const dispenseWaterDirect = async (deviceId: string, amountMl: number = 500) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.159';

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

    // ⚡ Ultra-Fast Parallel Dispatch: Direct LAN REST + Supabase Cloud Queue
    try {
      const endpoints = [
        `http://${cleanIp}/api/dispense/water?amount=${amountMl}`,
        `http://192.168.100.159/api/dispense/water?amount=${amountMl}`,
        `http://hydronourish.local/api/dispense/water?amount=${amountMl}`
      ];
      endpoints.forEach((url) => {
        fetch(url, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        const img = new Image();
        img.src = `${url}&_t=${Date.now()}`;
      });
    } catch {}

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

  const startPumpDirect = async (deviceId: string) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.159';

    // 1. Direct LAN call
    try {
      const endpoints = [
        `http://${cleanIp}/api/pump/on`,
        `http://192.168.100.159/api/pump/on`,
        `http://hydronourish.local/api/pump/on`
      ];
      endpoints.forEach((url) => {
        fetch(url, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        const img = new Image();
        img.src = `${url}?_t=${Date.now()}`;
      });
    } catch {}

    // 2. Immediate Optimistic update
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              isPumping: true,
              isPumpDeactivated: false,
            }
          : d
      )
    );

    // 3. Supabase Cloud Remote Command
    const newSch: FeedingSchedule = {
      id: `SCH-PUMPON-${Date.now()}`,
      deviceId: deviceId,
      foodType: 'Force Pump ON',
      portionGrams: 0,
      scheduledTime: 'Instant Manual',
      dispenseStatus: 'Pending',
      petId: petId,
      petName: petName,
    };

    setSchedules((prev) => [newSch, ...prev]);
    showToast('success', '🌊 Water Pump Started', `Turned water pump ON for node ${deviceId}.`);

    await insertScheduleToSupabase(newSch);
  };

  const stopPumpDirect = async (deviceId: string) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.159';

    // 1. Fast Local LAN Call (Dual HTTP / mDNS endpoints with catch to avoid unhandled errors)
    try {
      const endpoints = [
        `http://${cleanIp}/api/pump/stop`,
        `http://${cleanIp}/api/pump/off`,
        `http://192.168.100.159/api/pump/stop`,
        `http://hydronourish.local/api/pump/stop`
      ];
      endpoints.forEach((url) => {
        fetch(url, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        const img = new Image();
        img.src = `${url}?_t=${Date.now()}`;
      });
    } catch {}

    // 2. Supabase Cloud Remote Command
    const newSch: FeedingSchedule = {
      id: `SCH-STOP-${Date.now()}`,
      deviceId: deviceId,
      foodType: 'Stop Water',
      portionGrams: 0,
      scheduledTime: 'Instant Manual',
      dispenseStatus: 'Pending',
      petId: petId,
      petName: petName,
    };

    setSchedules((prev) => [newSch, ...prev]);
    showToast('info', 'Water Pump Stopped', `Deactivated water pump relay on node ${deviceId}.`);

    await insertScheduleToSupabase(newSch);
  };

  const toggleAutoRefillDirect = async (deviceId: string, enable?: boolean) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const shouldEnable = enable !== undefined ? enable : !dev?.firmwareVersion?.includes('AUTO:ON');
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.159';

    // 1. Direct LAN call
    try {
      const endpoints = [
        `http://${cleanIp}/api/auto-refill?enabled=${shouldEnable ? '1' : '0'}`,
        `http://192.168.100.159/api/auto-refill?enabled=${shouldEnable ? '1' : '0'}`,
        `http://hydronourish.local/api/auto-refill?enabled=${shouldEnable ? '1' : '0'}`
      ];
      endpoints.forEach((url) => {
        fetch(url, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        const img = new Image();
        img.src = `${url}&_t=${Date.now()}`;
      });
    } catch {}

    // 2. Supabase Cloud Remote Command
    const newSch: FeedingSchedule = {
      id: `SCH-${shouldEnable ? 'AUTOON' : 'AUTOOFF'}-${Date.now()}`,
      deviceId: deviceId,
      foodType: shouldEnable ? 'Auto Refill Enable' : 'Auto Refill Disable',
      portionGrams: 0,
      scheduledTime: 'Instant Manual',
      dispenseStatus: 'Pending',
      petId: petId,
      petName: petName,
    };

    setSchedules((prev) => [newSch, ...prev]);
    showToast(
      shouldEnable ? 'success' : 'info',
      shouldEnable ? '🔄 Auto-Refill Enabled' : '⏸️ Auto-Refill Disabled',
      shouldEnable
        ? `Node ${deviceId} will automatically refill reservoir when water level drops <= 10%.`
        : `Automatic refill paused for node ${deviceId}.`
    );

    await insertScheduleToSupabase(newSch);
  };

  const togglePumpMasterDirect = async (deviceId: string) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    
    const isCurrentlyDeactivated = Boolean(
      dev?.firmwareVersion?.includes('PUMP:DISABLED') ||
      dev?.firmwareVersion?.includes('PUMP:LOCKED')
    );
    const makeDeactivated = !isCurrentlyDeactivated;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`hn_pump_deactivated_${deviceId}`);
    }

    const nextAction = makeDeactivated ? 'Deactivate Pump' : 'Activate Pump';
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.159';

    // 1. Direct LAN call with IDEMPOTENT endpoints (strictly deactivate or activate, NEVER toggle)
    try {
      const path = makeDeactivated ? '/api/pump/deactivate' : '/api/pump/activate';
      const endpoints = [
        `http://${cleanIp}${path}`,
        `http://192.168.100.159${path}`,
        `http://hydronourish.local${path}`
      ];
      endpoints.forEach((url) => {
        fetch(url, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      });
    } catch {}

    // 2. Lock anti-bounce override & Immediate Optimistic update
    pendingUserOverrides.set(deviceId, {
      ...pendingUserOverrides.get(deviceId),
      pumpDeactivated: makeDeactivated,
      time: Date.now()
    });

    let newFw = dev?.firmwareVersion || 'v2.5.0-ESP32';
    if (makeDeactivated) {
      newFw = newFw.replace('PUMP:ACTIVE', 'PUMP:DISABLED').replace('PUMP:RUNNING', 'PUMP:DISABLED');
      if (!newFw.includes('PUMP:DISABLED')) newFw += '|PUMP:DISABLED';
    } else {
      newFw = newFw.replace('PUMP:DISABLED', 'PUMP:ACTIVE').replace('PUMP:LOCKED', 'PUMP:ACTIVE').replace('PUMP:OFF', 'PUMP:ACTIVE');
    }

    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              firmwareVersion: newFw,
              isPumpDeactivated: makeDeactivated,
            }
          : d
      )
    );

    // 3. Supabase Cloud Remote Command & Device Metadata Sync
    const newSch: FeedingSchedule = {
      id: `SCH-${makeDeactivated ? 'DEACT' : 'ACT'}-${Date.now()}`,
      deviceId: deviceId,
      foodType: nextAction,
      portionGrams: 0,
      scheduledTime: 'Instant Manual',
      dispenseStatus: 'Pending',
      petId: petId,
      petName: petName,
    };

    setSchedules((prev) => [newSch, ...prev]);
    showToast(
      makeDeactivated ? 'warning' : 'success',
      makeDeactivated ? '🔒 Water Pump DEACTIVATED' : '🔓 Water Pump ACTIVATED',
      makeDeactivated
        ? 'Water pump is completely locked OFF. It will stay deactivated until you click Activate.'
        : 'Water pump is now ACTIVATED and ready for normal operation.'
    );

    await updateDeviceInSupabase(deviceId, { firmwareVersion: newFw });
    await insertScheduleToSupabase(newSch);
  };

  const deactivatePumpDirect = async (deviceId: string, deactivate: boolean = true) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.159';

    try {
      const path = deactivate ? '/api/pump/deactivate' : '/api/pump/activate';
      const endpoints = [
        `http://${cleanIp}${path}`,
        `http://192.168.100.159${path}`,
        `http://hydronourish.local${path}`
      ];
      endpoints.forEach((url) => {
        fetch(url, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
        const img = new Image();
        img.src = `${url}?_t=${Date.now()}`;
      });
    } catch {}

    let newFw = dev?.firmwareVersion || 'v2.5.0-ESP32';
    if (deactivate) {
      newFw = newFw.replace('PUMP:ACTIVE', 'PUMP:DISABLED').replace('PUMP:RUNNING', 'PUMP:DISABLED');
      if (!newFw.includes('PUMP:DISABLED')) newFw += '|PUMP:DISABLED';
    } else {
      newFw = newFw.replace('PUMP:DISABLED', 'PUMP:ACTIVE').replace('PUMP:LOCKED', 'PUMP:ACTIVE').replace('PUMP:OFF', 'PUMP:ACTIVE');
    }

    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              firmwareVersion: newFw,
              isPumpDeactivated: deactivate,
            }
          : d
      )
    );

    const newSch: FeedingSchedule = {
      id: `SCH-${deactivate ? 'DEACT' : 'ACT'}-${Date.now()}`,
      deviceId: deviceId,
      foodType: deactivate ? 'Deactivate Pump' : 'Activate Pump',
      portionGrams: 0,
      scheduledTime: 'Instant Manual',
      dispenseStatus: 'Pending',
      petId: petId,
      petName: petName,
    };

    setSchedules((prev) => [newSch, ...prev]);
    showToast(
      deactivate ? 'warning' : 'success',
      deactivate ? 'Water Pump Locked OFF' : 'Water Pump Activated',
      `Master safety lock ${deactivate ? 'engaged' : 'released'} for ${deviceId}.`
    );

    await updateDeviceInSupabase(deviceId, { firmwareVersion: newFw });
    await insertScheduleToSupabase(newSch);
  };

  // ─── Automated Time & Day Cloud & Hardware Scheduler Engine ───────────────
  useEffect(() => {
    const executedMinutes = new Set<string>();

    const schedulerTimer = setInterval(async () => {
      const now = new Date();
      const curH = now.getHours();
      const curM = now.getMinutes();
      const curDay = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
      const minKey = `${now.toDateString()}-${curH}:${curM}`;

      for (const sch of schedules) {
        if (sch.enabled === false) continue;
        if (!sch.scheduledTime || sch.scheduledTime === 'Instant Manual') continue;

        // Parse scheduled time e.g. "08:00 AM", "02:30 PM", "8:00 AM • Everyday"
        const match = sch.scheduledTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) continue;

        let schHour = parseInt(match[1], 10);
        const schMin = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();

        if (ampm === 'PM' && schHour < 12) schHour += 12;
        if (ampm === 'AM' && schHour === 12) schHour = 0;

        if (schHour === curH && schMin === curM) {
          const runKey = `${sch.id}-${minKey}`;
          if (executedMinutes.has(runKey)) continue;
          executedMinutes.add(runKey);

          // Day match check
          const daysStr = (sch.days || sch.scheduledTime).toLowerCase();
          let dayMatches = true;
          if (daysStr.includes('weekday') && (curDay === 0 || curDay === 6)) dayMatches = false;
          if (daysStr.includes('weekend') && curDay >= 1 && curDay <= 5) dayMatches = false;

          // Day token check
          if (daysStr.includes(',') || daysStr.includes('mon') || daysStr.includes('tue') || daysStr.includes('wed') || daysStr.includes('thu') || daysStr.includes('fri') || daysStr.includes('sat') || daysStr.includes('sun')) {
            const dayTokens = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const tokenMatched = dayTokens.some((tok, idx) => daysStr.includes(tok) && curDay === idx);
            if (tokenMatched) dayMatches = true;
          }

          if (dayMatches) {
            const isWater =
              sch.type === 'water' ||
              sch.foodType?.toLowerCase().includes('water') ||
              sch.foodType?.toLowerCase().includes('pump');
            const targetDev = sch.deviceId || 'HN-NODE-F778';

            if (isWater) {
              await dispenseWaterDirect(targetDev, sch.portionGrams || 250);
              playNotificationChime();
              showToast('success', '💧 Scheduled Water Refill Executed', `Dispensed ${sch.portionGrams || 250}ml water for ${sch.petName}.`);
            } else {
              await dispenseDirect(targetDev, sch.portionGrams || 75, sch.foodType || 'Scheduled Feeder Dispense');
              playNotificationChime();
              showToast('success', '🍖 Scheduled Meal Dispensed', `Dispensed ${sch.portionGrams || 75}g kibble for ${sch.petName}.`);
            }
          }
        }
      }
    }, 12000);

    return () => clearInterval(schedulerTimer);
  }, [schedules]);

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

  const updateDevice = async (id: string, updated: Partial<Device>) => {
    setDevices((prev) => (prev ?? []).map((d) => (d.id === id ? { ...d, ...updated } : d)));
    await updateDeviceInSupabase(id, updated);
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
    const updatedSettings = { ...settings, ...newSet };
    setSettings(updatedSettings);
    showToast('success', 'Settings Saved', 'System preferences updated successfully.');
    await updateSettingsInSupabase(updatedSettings);
  };

  // ─── Contact Inquiries & Chat Handlers ─────────────────────────────
  const addInquiry = async (
    inquiryData: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>
  ): Promise<boolean> => {
    const newId = `INQ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const initialThread: ChatMessageItem[] = [
      {
        id: `msg-init-${newId}`,
        sender: 'owner',
        senderName: inquiryData.name || 'Pet Owner',
        message: inquiryData.message,
        timestamp: new Date().toISOString(),
      },
    ];

    const newInquiry: ContactInquiry = {
      ...inquiryData,
      id: newId,
      createdAt: new Date().toISOString(),
      status: 'unread',
      messagesThread: initialThread,
    };

    setInquiries((prev) => [newInquiry, ...prev]);
    broadcastInquiryArrival(newInquiry);
    showToast(
      'success',
      'Inquiry Received',
      `Thank you ${inquiryData.name}! Your message has been received by Heritage Animal Clinic.`
    );
    await insertContactInquiryToSupabase(newInquiry);
    return true;
  };

  const markInquiryStatus = async (
    id: string,
    status: ContactInquiry['status'],
    replyMessage?: string,
    senderName: string = 'Heritage Animal Clinic Staff'
  ) => {
    let finalThread: ChatMessageItem[] | undefined = undefined;

    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id !== id) return inq;

        // Collect all previous messages safely
        let baseThread: ChatMessageItem[] = [];
        if (inq.messagesThread && inq.messagesThread.length > 0) {
          baseThread = inq.messagesThread;
        } else if (inq.replyMessage && inq.replyMessage.trim().startsWith('[') && inq.replyMessage.trim().endsWith(']')) {
          try {
            const p = JSON.parse(inq.replyMessage.trim());
            if (Array.isArray(p)) baseThread = p;
          } catch {}
        }

        if (baseThread.length === 0) {
          if (inq.message) {
            baseThread.push({
              id: `msg-1-${inq.id}`,
              sender: 'owner',
              senderName: inq.name || 'Client',
              message: inq.message,
              timestamp: inq.createdAt,
            });
          }
          if (inq.replyMessage && !inq.replyMessage.trim().startsWith('[')) {
            baseThread.push({
              id: `msg-2-${inq.id}`,
              sender: 'admin',
              senderName: senderName,
              message: inq.replyMessage,
              timestamp: inq.repliedAt || inq.createdAt,
            });
          }
        }

        const newMsgList: ChatMessageItem[] = [];
        if (replyMessage && replyMessage.trim()) {
          newMsgList.push({
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            sender: 'admin',
            senderName: senderName,
            message: replyMessage.trim(),
            timestamp: new Date().toISOString(),
          });
        }

        const updatedThread = mergeChatThreads(baseThread, newMsgList);
        finalThread = updatedThread;

        try {
          localStorage.setItem(`hn_thread_${id}`, JSON.stringify(updatedThread));
        } catch {}

        return {
          ...inq,
          status,
          ...(status === 'replied' && replyMessage
            ? { repliedAt: new Date().toISOString(), replyMessage: replyMessage.trim() }
            : {}),
          messagesThread: updatedThread,
        };
      })
    );

    const updates: Partial<ContactInquiry> = {
      status,
      ...(status === 'replied' && replyMessage
        ? { repliedAt: new Date().toISOString(), replyMessage: replyMessage.trim(), messagesThread: finalThread }
        : { messagesThread: finalThread }),
    };

    broadcastInquiryUpdate(id, updates);

    const statusLabels: Record<string, string> = {
      unread: 'Marked as Unread',
      read: 'Marked as Read',
      replied: 'Reply Sent via Website',
      archived: 'Archived',
    };

    showToast('info', 'Inquiry Status', `Message ${statusLabels[status] || status}.`);
    await updateContactInquiryInSupabase(id, updates);
  };

  const sendOwnerFollowUpMessage = async (
    inquiryId: string,
    messageText: string,
    senderName?: string
  ): Promise<boolean> => {
    let finalThread: ChatMessageItem[] | undefined = undefined;

    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id !== inquiryId) return inq;

        let baseThread: ChatMessageItem[] = [];
        if (inq.messagesThread && inq.messagesThread.length > 0) {
          baseThread = inq.messagesThread;
        } else if (inq.replyMessage && inq.replyMessage.trim().startsWith('[') && inq.replyMessage.trim().endsWith(']')) {
          try {
            const p = JSON.parse(inq.replyMessage.trim());
            if (Array.isArray(p)) baseThread = p;
          } catch {}
        }

        if (baseThread.length === 0) {
          if (inq.message) {
            baseThread.push({
              id: `msg-1-${inq.id}`,
              sender: 'owner',
              senderName: inq.name || 'Pet Owner',
              message: inq.message,
              timestamp: inq.createdAt,
            });
          }
          if (inq.replyMessage && !inq.replyMessage.trim().startsWith('[')) {
            baseThread.push({
              id: `msg-2-${inq.id}`,
              sender: 'admin',
              senderName: 'Heritage Animal Clinic Staff',
              message: inq.replyMessage,
              timestamp: inq.repliedAt || inq.createdAt,
            });
          }
        }

        const newMsgList: ChatMessageItem[] = [
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            sender: 'owner',
            senderName: senderName || inq.name || 'Pet Owner',
            message: messageText.trim(),
            timestamp: new Date().toISOString(),
          },
        ];

        const updatedThread = mergeChatThreads(baseThread, newMsgList);
        finalThread = updatedThread;

        try {
          localStorage.setItem(`hn_thread_${inquiryId}`, JSON.stringify(updatedThread));
        } catch {}

        return {
          ...inq,
          status: 'unread',
          messagesThread: updatedThread,
        };
      })
    );

    const updates: Partial<ContactInquiry> = {
      status: 'unread',
      messagesThread: finalThread,
    };

    broadcastInquiryUpdate(inquiryId, updates);
    await updateContactInquiryInSupabase(inquiryId, updates);
    return true;
  };

  const deleteInquiry = async (id: string) => {
    setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    showToast('info', 'Inquiry Deleted', 'Inquiry record removed.');
    await deleteContactInquiryFromSupabase(id);
  };

  const unreadInquiriesCount = (inquiries || []).filter(
    (inq) => inq && inq.status === 'unread'
  ).length;

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
        inquiries,
        unreadInquiriesCount,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        addPet,
        updatePet,
        deletePet,
        addSchedule,
        addFeedingSchedule,
        addWaterSchedule,
        updateSchedule,
        deleteSchedule,
        toggleSchedule,
        dispenseNow,
        dispenseDirect,
        dispenseWaterDirect,
        startPumpDirect,
        stopPumpDirect,
        toggleAutoRefillDirect,
        togglePumpMasterDirect,
        deactivatePumpDirect,
        refillWater,
        acknowledgeAlert,
        resolveAlert,
        addDevice,
        updateDevice,
        removeDevice,
        addUser,
        updateUser,
        toggleUserStatus,
        updateSettings,
        addInquiry,
        markInquiryStatus,
        sendOwnerFollowUpMessage,
        deleteInquiry,
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
