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
  insertAIAlertToSupabase,
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
import { usbSerialService } from '../services/usbSerialService';

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
  openGateDirect: (deviceId: string) => Promise<void>;
  closeGateDirect: (deviceId: string) => Promise<void>;
  setPetEatingDirect: (deviceId: string, isEating: boolean) => Promise<void>;
  setPetDrinkingDirect: (deviceId: string, isDrinking: boolean) => Promise<void>;
  tareScaleDirect: (deviceId: string) => Promise<void>;
  tareWaterScaleDirect: (deviceId: string) => Promise<void>;
  calibrateWaterScaleDirect: (deviceId: string, knownMl?: number, factor?: number) => Promise<void>;
  calibrateScaleDirect: (deviceId: string, knownGrams?: number, factor?: number) => Promise<void>;
  fetchScaleWeightDirect: (deviceId: string) => Promise<number | null>;
  dispenseWaterDirect: (deviceId: string, amountMl?: number) => void;
  startPumpDirect: (deviceId: string) => Promise<void>;
  stopPumpDirect: (deviceId: string) => Promise<void>;
  dispenseCleaningWaterDirect: (deviceId: string, amountMl?: number) => Promise<void>;
  dispenseSprayWaterDirect: (deviceId: string, amountMl?: number) => Promise<void>;
  startDrainPumpDirect: (deviceId: string, durationMs?: number) => Promise<void>;
  stopDrainPumpDirect: (deviceId: string) => Promise<void>;
  invertDrainRelayDirect: (deviceId: string) => Promise<boolean>;
  runBowlSanitationCycle: (deviceId: string) => Promise<boolean>;
  toggleAutoRefillDirect: (deviceId: string, enable?: boolean) => Promise<void>;
  togglePumpMasterDirect: (deviceId: string) => Promise<void>;
  deactivatePumpDirect: (deviceId: string, deactivate?: boolean) => Promise<void>;

  refillWater: (deviceId: string) => void;

  addAlert: (alertData: Omit<AIHealthAlert, 'id' | 'timestamp' | 'reviewStatus'>) => Promise<AIHealthAlert>;
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

// Anti-bounce lock for manual hardware overrides
const pendingUserOverrides = new Map<string, {
  pumpDeactivated?: boolean;
  autoRefillEnabled?: boolean;
  firmwareVersion?: string;
  time: number;
}>();

// Non-Destructive Device State Merger
export const mergeDeviceUpdates = (existing: Device[], incoming: Device[]): Device[] => {
  if (!incoming || incoming.length === 0) return existing;
  const map = new Map<string, Device>();
  (existing || []).forEach((d) => map.set(d.id, d));
  const now = Date.now();

  incoming.forEach((d) => {
    const prev = map.get(d.id);
    if (prev) {
      const merged: Device = { ...prev, ...d };

      // 1. Check local storage preference for auto-refill
      const savedAuto = typeof window !== 'undefined' ? localStorage.getItem(`hn_auto_refill_${d.id}`) : null;
      // 2. Check pending user overrides (within 15 seconds)
      const override = pendingUserOverrides.get(d.id);
      const hasRecentAutoOverride = override && override.autoRefillEnabled !== undefined && (now - override.time < 15000);
      const hasRecentPumpOverride = override && override.pumpDeactivated !== undefined && (now - override.time < 15000);

      if (hasRecentAutoOverride) {
        merged.autoRefillEnabled = override.autoRefillEnabled;
      } else if (savedAuto !== null) {
        merged.autoRefillEnabled = savedAuto === '1';
      }

      if (hasRecentPumpOverride) {
        merged.isPumpDeactivated = override.pumpDeactivated;
      }

      // Ensure firmwareVersion tag aligns with autoRefillEnabled
      if (merged.autoRefillEnabled !== undefined) {
        let fw = merged.firmwareVersion || prev.firmwareVersion || 'v2.5.0-ESP32';
        if (merged.autoRefillEnabled) {
          fw = fw.replace('AUTO:OFF', 'AUTO:ON');
          if (!fw.includes('AUTO:ON')) fw += '|AUTO:ON';
        } else {
          fw = fw.replace('AUTO:ON', 'AUTO:OFF');
          if (!fw.includes('AUTO:OFF')) fw += '|AUTO:OFF';
        }
        merged.firmwareVersion = fw;
      }

      map.set(d.id, merged);
    } else {
      map.set(d.id, d);
    }
  });
  return Array.from(map.values());
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<Pet[]>(() => {
    try {
      const saved = localStorage.getItem('hn_pets');
      if (saved) {
        const parsed = JSON.parse(saved) as Pet[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return initialPets;
    } catch {
      return initialPets;
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

        if (remotePets && remotePets.length > 0) {
          setPets(remotePets);
        } else if (remotePets && remotePets.length === 0 && initialPets.length > 0) {
          setPets(initialPets);
          for (const pet of initialPets) {
            insertPetToSupabase(pet).catch(() => {});
          }
        }
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

    // Direct USB WebSerial Live Telemetry Wire
    const unsubUsb = usbSerialService.onTelemetry((telemetry) => {
      if (!telemetry) return;
      const targetId = telemetry.deviceId || 'HN-NODE-F778';
      setDevices((prev) => {
        const hasMatch = prev.some((d) => d.id === targetId);
        if (hasMatch) {
          return prev.map((d) => {
            if (d.id === targetId) {
              return {
                ...d,
                status: 'Online',
                lastTransmission: 'Live — Direct USB',
                foodBowlWeightGrams: typeof telemetry.foodBowlWeightGrams === 'number' ? telemetry.foodBowlWeightGrams : d.foodBowlWeightGrams,
                scaleReady: telemetry.scaleReady !== undefined ? telemetry.scaleReady : d.scaleReady,
                lastIntakeFoodGrams: typeof telemetry.lastIntakeFoodGrams === 'number' ? telemetry.lastIntakeFoodGrams : d.lastIntakeFoodGrams,
                foodLevelPct: typeof telemetry.foodLevel === 'number' ? telemetry.foodLevel : d.foodLevelPct,
                waterLevelPct: typeof telemetry.waterLevel === 'number' ? telemetry.waterLevel : d.waterLevelPct,
                waterQualityPpm: typeof telemetry.tds === 'number' ? telemetry.tds : d.waterQualityPpm,
                isPumping: telemetry.isPumping !== undefined ? telemetry.isPumping : d.isPumping,
                autoRefillEnabled: telemetry.autoRefill !== undefined ? telemetry.autoRefill : d.autoRefillEnabled,
              };
            }
            return d;
          });
        }
        return prev;
      });
    });

    return () => {
      clearInterval(devicePollInterval);
      unsubUsb();
    };
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
        if (data && data.length > 0) setPets(data);
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

    // Push schedule directly to ESP32 node via LAN
    try {
      const targetDev = (devices || []).find((d) => d.id === newSch.deviceId) || devices[0];
      const cleanIp = targetDev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      if (cleanIp) {
        fetch(`http://${cleanIp}/api/schedule/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newSch.id,
            type: newSch.type,
            time: newSch.scheduledTime,
            days: newSch.days || 'Everyday',
            amount: newSch.portionGrams,
            enabled: newSch.enabled,
            pet_name: newSch.petName,
            pet_id: newSch.petId
          }),
          mode: 'no-cors'
        }).catch(() => {});
      }
    } catch {}

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

    // Delete directly on ESP32 node if reachable
    try {
      const targetDev = (devices || []).find((d) => d.id === sch?.deviceId) || devices[0];
      const cleanIp = targetDev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      if (cleanIp && sch?.id) {
        fetch(`http://${cleanIp}/api/schedule/delete?id=${encodeURIComponent(sch.id)}`, {
          method: 'POST',
          mode: 'no-cors'
        }).catch(() => {});
      }
    } catch {}

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

    // Toggle on ESP32
    try {
      const targetDev = (devices || []).find((d) => d.id === sch?.deviceId) || devices[0];
      const cleanIp = targetDev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      if (cleanIp && sch?.id) {
        fetch(`http://${cleanIp}/api/schedule/toggle?id=${encodeURIComponent(sch.id)}&enabled=${newEnabled ? '1' : '0'}`, {
          method: 'POST',
          mode: 'no-cors'
        }).catch(() => {});
      }
    } catch {}

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

  // ⚡ Universal Zero-Delay Device Dispatcher (<10ms LAN HTTP + 0ms USB WebSerial)
  const dispatchFastDeviceCommand = (
    deviceId: string | undefined,
    path: string,
    options?: {
      method?: 'POST' | 'GET';
      body?: string;
      usbAction?: () => Promise<any> | void;
    }
  ) => {
    // 1. Instant Direct USB WebSerial Execution (0ms)
    if (options?.usbAction && usbSerialService.getIsConnected()) {
      try {
        const res = options.usbAction();
        if (res && typeof (res as Promise<any>).catch === 'function') {
          (res as Promise<any>).catch(() => {});
        }
      } catch {}
    }

    // 2. Resolve Candidate LAN IPs (Exclude dead .159, prioritize actual .157)
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const devIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    const candidateIps = [
      devIp && !devIp.includes('192.168.100.159') ? devIp : null,
      '192.168.100.157', // Active ESP32 node IP (1C:C3:AB:F9:F7:78)
      'hydronourish.local',
    ].filter(Boolean) as string[];

    const uniqueIps = Array.from(new Set(candidateIps));
    const endpointPath = path.startsWith('/') ? path : `/${path}`;

    // 3. Fast LAN fetch with strict 1200ms AbortController (prevents 5-second TCP SYN hangs)
    uniqueIps.forEach((ip) => {
      const url = `http://${ip}${endpointPath}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);

      fetch(url, {
        method: options?.method || 'POST',
        mode: 'no-cors',
        body: options?.body,
        signal: controller.signal,
      })
        .catch(() => {})
        .finally(() => clearTimeout(timer));
    });
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

    // ⚡ Zero-Latency Parallel Dispatch: Direct LAN REST + USB WebSerial
    dispatchFastDeviceCommand(targetDeviceId, '/api/dispense/food', {
      usbAction: () => usbSerialService.dispenseFood(portionGrams),
    });

    // Optimistically update device gate state
    setDevices((prev) =>
      prev.map((d) => (d.id === targetDeviceId ? { ...d, foodGateOpen: true } : d))
    );

    insertScheduleToSupabase(newSch).catch(() => {});
  };

  const openGateDirect = async (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, foodGateOpen: true } : d))
    );
    dispatchFastDeviceCommand(deviceId, '/api/gate/open', {
      usbAction: () => usbSerialService.openGate(),
    });
  };

  const closeGateDirect = async (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, foodGateOpen: false, petEatingActive: false } : d))
    );
    dispatchFastDeviceCommand(deviceId, '/api/gate/close', {
      usbAction: () => usbSerialService.closeGate(),
    });
  };

  const setPetEatingDirect = async (deviceId: string, isEating: boolean) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, petEatingActive: isEating } : d))
    );
    dispatchFastDeviceCommand(deviceId, `/api/pet/eating?eating=${isEating ? '1' : '0'}`);
  };

  const setPetDrinkingDirect = async (deviceId: string, isDrinking: boolean) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, petDrinkingActive: isDrinking } : d))
    );
    dispatchFastDeviceCommand(deviceId, `/api/pet/drinking?drinking=${isDrinking ? '1' : '0'}`);
  };

  const tareWaterScaleDirect = async (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, waterLiters: 0.0, waterLevelPct: 0 } : d))
    );
    dispatchFastDeviceCommand(deviceId, '/api/water/tare', {
      usbAction: () => usbSerialService.tareWaterScale(),
    });
    showToast('success', 'Water Scale Tared', 'Water reservoir load cell tared to 0 ml (Zero Reference)');
  };

  const calibrateWaterScaleDirect = async (deviceId: string, knownMl?: number, factor?: number) => {
    const query = knownMl ? `known_ml=${knownMl}` : `factor=${factor || 420.0}`;
    dispatchFastDeviceCommand(deviceId, `/api/water/calibrate?${query}`, {
      usbAction: () => usbSerialService.calibrateWaterScale(knownMl, factor),
    });
    showToast('success', 'Water Calibrated', `Water scale reference applied: ${knownMl ? `${knownMl}ml` : `factor ${factor}`}`);
  };

  const tareScaleDirect = async (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, foodBowlWeightGrams: 0.0, scaleReady: true } : d))
    );
    dispatchFastDeviceCommand(deviceId, '/api/scale/tare', {
      usbAction: () => usbSerialService.tareScale(),
    });
    showToast('success', 'Scale Tared', 'Food bowl scale tared to 0.0g (Zero Reference)');
  };

  const calibrateScaleDirect = async (deviceId: string, knownGrams?: number, factor?: number) => {
    const query = knownGrams ? `known_grams=${knownGrams}` : `factor=${factor || 420.0}`;
    dispatchFastDeviceCommand(deviceId, `/api/scale/calibrate?${query}`, {
      usbAction: () => usbSerialService.calibrateScale(knownGrams, factor),
    });
    showToast('success', 'Scale Calibrated', `Calibration reference applied: ${knownGrams ? `${knownGrams}g` : `factor ${factor}`}`);
  };

  const fetchScaleWeightDirect = async (deviceId: string): Promise<number | null> => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const devIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    const candidateIps = [
      devIp && !devIp.includes('192.168.100.159') ? devIp : null,
      '192.168.100.157',
      'hydronourish.local',
    ].filter(Boolean) as string[];

    for (const ip of candidateIps) {
      try {
        const res = await fetch(`http://${ip}/api/scale/weight`, { signal: AbortSignal.timeout(1200) });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.weight_grams === 'number') {
            setDevices((prev) =>
              prev.map((d) => (d.id === deviceId ? { ...d, foodBowlWeightGrams: data.weight_grams } : d))
            );
            return data.weight_grams;
          }
        }
      } catch {}
    }
    return null;
  };

  const dispenseWaterDirect = async (deviceId: string, amountMl: number = 500) => {
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

    // ⚡ Ultra-Fast Parallel Dispatch (<10ms LAN / 0ms USB)
    dispatchFastDeviceCommand(deviceId, `/api/dispense/water?amount=${amountMl}`, {
      usbAction: () => usbSerialService.dispenseWater(amountMl <= 500 ? amountMl * 10 : amountMl),
    });

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
    insertScheduleToSupabase(newSch).catch(() => {});
    insertHydrationLogToSupabase(newLog).catch(() => {});
  };

  const startPumpDirect = async (deviceId: string) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';

    // 1. Immediate Optimistic update
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

    // 2. Direct fast dispatch
    dispatchFastDeviceCommand(deviceId, '/api/pump/on', {
      usbAction: () => usbSerialService.setPump(true),
    });

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

    insertScheduleToSupabase(newSch).catch(() => {});
  };

  const stopPumpDirect = async (deviceId: string) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';

    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, isPumping: false } : d
      )
    );

    dispatchFastDeviceCommand(deviceId, '/api/pump/stop', {
      usbAction: () => usbSerialService.setPump(false),
    });

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

    insertScheduleToSupabase(newSch).catch(() => {});
  };

  // ─── Dual-Pump Sanitation & Drainage Handlers (Clean Water & 19W 12V Drain) ─
  const dispenseCleaningWaterDirect = async (deviceId: string, amountMl: number = 10000) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';
    const durationMs = amountMl <= 500 ? (amountMl === 200 || amountMl === 250 ? 10000 : amountMl * 12) : amountMl;

    // Ensure food gate is closed before spraying rinse water
    if (dev?.foodGateOpen) {
      await closeGateDirect(deviceId);
    }

    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, isCleaningRinse: true, sanitationStatus: 'rinsing_water', foodGateOpen: false, petEatingActive: false }
          : d
      )
    );

    dispatchFastDeviceCommand(deviceId, `/api/spray?duration=${durationMs}`, {
      usbAction: () => usbSerialService.dispenseCleaningWater(durationMs),
    });

    showToast('info', '🚿 Spray Water Active', `Spraying rinse water into bowl for ${petName} (${Math.round(durationMs / 1000)}s - food gate closed).`);

    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, isCleaningRinse: false } : d))
      );
    }, durationMs > 500 ? durationMs : 10000);
  };

  const dispenseSprayWaterDirect = dispenseCleaningWaterDirect;

  const startDrainPumpDirect = async (deviceId: string, durationMs: number = 6000) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, isDrainPumping: true, sanitationStatus: 'draining_19w' }
          : d
      )
    );

    dispatchFastDeviceCommand(deviceId, `/api/drain?duration=${durationMs}`, {
      usbAction: () => usbSerialService.disposeWaste(durationMs),
    });

    showToast('warning', '🌀 Drain Pump Active', `Draining bowl and evacuating wastewater (${Math.round(durationMs / 1000)}s cycle)...`);

    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? { ...d, isDrainPumping: false, sanitationStatus: 'completed' }
            : d
        )
      );
    }, durationMs);
  };

  const stopDrainPumpDirect = async (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, isDrainPumping: false, isCleaningRinse: false, sanitationStatus: 'idle' }
          : d
      )
    );

    dispatchFastDeviceCommand(deviceId, '/api/drain/stop', {
      usbAction: () => usbSerialService.sendRaw('DRAIN OFF'),
    });

    showToast('info', 'Drain Pump Stopped', 'Drain pump halted.');
  };

  const invertDrainRelayDirect = async (deviceId: string): Promise<boolean> => {
    dispatchFastDeviceCommand(deviceId, '/api/drain/invert', {
      usbAction: () => usbSerialService.sendRaw('DRAIN INVERT'),
    });
    showToast('info', 'Drain Polarity Toggled', 'Flipped drain relay Active-HIGH / Active-LOW logic.');
    return true;
  };

  const runBowlSanitationCycle = async (deviceId: string): Promise<boolean> => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    const petName = dev?.assignedPetName || 'Max';

    // Step 0: Ensure Food Gate is CLOSED before any water spray
    await closeGateDirect(deviceId);

    showToast('info', '🔄 20-Second Sanitation Initiated', `Phase 1: Food gate closed & dispensing clean rinse water (GPIO 18 - 10s) for ${petName}...`);

    // Stage 1: Dispense Cleaning Rinse Water (10.0s)
    await dispenseCleaningWaterDirect(deviceId, 10000);
    await new Promise((res) => setTimeout(res, 10000));

    // Stage 2: Evacuate Wastewater via 12V 19W Drain Pump (9.0s)
    showToast('warning', '⚡ Phase 2: Evacuating Water', '19W 12V water pump engaged to drain wastewater (GPIO 23 - 9s)...');
    await startDrainPumpDirect(deviceId, 9000);
    await new Promise((res) => setTimeout(res, 9000));

    // Stage 3: Zero / Tare scales (1.0s)
    await tareScaleDirect(deviceId);
    await tareWaterScaleDirect(deviceId);
    await new Promise((res) => setTimeout(res, 1000));

    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, sanitationStatus: 'completed' } : d
      )
    );

    showToast('success', '✨ Clean Waste Completed (20s cycle)', 'Food gate confirmed closed, food bowl washed with spray rinse (10s), completely evacuated by 12V drain pump (9s), and scales tared to 0.0g!');
    return true;
  };

  const toggleAutoRefillDirect = async (deviceId: string, enable?: boolean) => {
    const dev = (devices ?? []).find((d) => d.id === deviceId);
    
    // Check saved state, explicit property, or firmware tag
    const savedAuto = typeof window !== 'undefined' ? localStorage.getItem(`hn_auto_refill_${deviceId}`) : null;
    const isCurrentlyOn = savedAuto !== null
      ? savedAuto === '1'
      : Boolean(dev?.autoRefillEnabled ?? (dev?.firmwareVersion?.includes('AUTO:ON') && !dev?.firmwareVersion?.includes('AUTO:OFF')));

    const shouldEnable = enable !== undefined ? enable : !isCurrentlyOn;
    const petName = dev?.assignedPetName || 'Max';
    const petId = dev?.assignedPetId || 'PET-001';
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.157';

    // Persist immediately in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`hn_auto_refill_${deviceId}`, shouldEnable ? '1' : '0');
      localStorage.removeItem(`hn_pump_deactivated_${deviceId}`);
    }

    let newFw = dev?.firmwareVersion || 'v2.5.0-ESP32';
    // Ensure pump stays active and NOT locked/deactivated when toggling auto-refill
    newFw = newFw.replace('PUMP:DISABLED', 'PUMP:ACTIVE').replace('PUMP:LOCKED', 'PUMP:ACTIVE');
    if (!newFw.includes('PUMP:ACTIVE') && !newFw.includes('PUMP:RUNNING')) {
      newFw += '|PUMP:ACTIVE';
    }

    if (newFw.includes('AUTO:')) {
      newFw = newFw.replace(/AUTO:(OFF|ON)/, shouldEnable ? 'AUTO:ON' : 'AUTO:OFF');
    } else {
      newFw = `${newFw}|AUTO:${shouldEnable ? 'ON' : 'OFF'}`;
    }
    if (shouldEnable) {
      newFw = newFw.replace('AUTO:OFF', 'AUTO:ON');
    } else {
      newFw = newFw.replace('AUTO:ON', 'AUTO:OFF');
    }

    // Lock anti-bounce override
    pendingUserOverrides.set(deviceId, {
      ...pendingUserOverrides.get(deviceId),
      autoRefillEnabled: shouldEnable,
      pumpDeactivated: false,
      time: Date.now(),
    });

    // 1. Direct LAN call with immediate pump stop if disabling
    const refillPath = `/api/auto-refill?enabled=${shouldEnable ? '1' : '0'}`;
    dispatchFastDeviceCommand(deviceId, refillPath, {
      method: 'GET',
      usbAction: () => usbSerialService.toggleAutoRefill(shouldEnable),
    });

    if (!shouldEnable) {
      dispatchFastDeviceCommand(deviceId, '/api/pump/stop', {
        usbAction: () => usbSerialService.setPump(false),
      });
    }

    // 2. Optimistic UI state update (pump stays UNLOCKED and ready for manual use)
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              autoRefillEnabled: shouldEnable,
              isPumpDeactivated: false,
              firmwareVersion: newFw,
            }
          : d
      )
    );

    // 3. Supabase Cloud Remote Command
    const newSch: FeedingSchedule = {
      id: `SCH-${shouldEnable ? 'AUTOON' : 'AUTOOFF'}-${Date.now()}`,
      deviceId: deviceId,
      foodType: shouldEnable ? 'Auto Refill Enable' : 'Auto Refill Pause',
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
        ? `Node ${deviceId} will automatically maintain fresh water with smart automated refill cycles.`
        : `Automatic refill paused for node ${deviceId}.`
    );

    // 4. Persist to Supabase device row so subsequent polls don't revert
    updateDeviceInSupabase(deviceId, { firmwareVersion: newFw }).catch(() => {});
    insertScheduleToSupabase(newSch).catch(() => {});
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

    // 1. Direct fast LAN dispatch + USB WebSerial
    const path = makeDeactivated ? '/api/pump/deactivate' : '/api/pump/activate';
    dispatchFastDeviceCommand(deviceId, path, {
      usbAction: () => usbSerialService.togglePumpMaster(makeDeactivated),
    });

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
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.157';

    const path = deactivate ? '/api/pump/deactivate' : '/api/pump/activate';
    dispatchFastDeviceCommand(deviceId, path, {
      usbAction: () => usbSerialService.sendRaw(deactivate ? 'PUMP LOCK' : 'PUMP UNLOCK'),
    });

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

          // Accurate Day-of-week match check
          const daysStr = (sch.days || sch.scheduledTime || '').toLowerCase();
          let dayMatches = true;

          if (daysStr.includes('everyday') || daysStr.includes('daily') || daysStr.length === 0) {
            dayMatches = true;
          } else if (daysStr.includes('weekday')) {
            dayMatches = (curDay >= 1 && curDay <= 5);
          } else if (daysStr.includes('weekend')) {
            dayMatches = (curDay === 0 || curDay === 6);
          } else {
            const dayTokens = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const hasDayToken = dayTokens.some((tok) => daysStr.includes(tok));
            if (hasDayToken) {
              dayMatches = dayTokens.some((tok, idx) => daysStr.includes(tok) && curDay === idx);
            }
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
    }, 5000);

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
  const addAlert = async (alertData: Omit<AIHealthAlert, 'id' | 'timestamp' | 'reviewStatus'>): Promise<AIHealthAlert> => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newAlert: AIHealthAlert = {
      ...alertData,
      id: `ALT-${Date.now().toString().slice(-4)}`,
      timestamp,
      reviewStatus: 'Unreviewed',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    if (newAlert.severity === 'Critical') {
      playNotificationChime();
      showToast('error', 'Critical Health Alert', `${newAlert.petName}: ${newAlert.alertType}`);
    } else {
      showToast('warning', 'AI Health Observation', `${newAlert.petName}: ${newAlert.alertType}`);
    }
    await insertAIAlertToSupabase(newAlert);
    return newAlert;
  };

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
        openGateDirect,
        closeGateDirect,
        setPetEatingDirect,
        setPetDrinkingDirect,
        tareScaleDirect,
        tareWaterScaleDirect,
        calibrateWaterScaleDirect,
        calibrateScaleDirect,
        fetchScaleWeightDirect,
        dispenseWaterDirect,
        startPumpDirect,
        stopPumpDirect,
        dispenseCleaningWaterDirect,
        dispenseSprayWaterDirect,
        startDrainPumpDirect,
        stopDrainPumpDirect,
        invertDrainRelayDirect,
        runBowlSanitationCycle,
        toggleAutoRefillDirect,
        togglePumpMasterDirect,
        deactivatePumpDirect,
        refillWater,
        addAlert,
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
