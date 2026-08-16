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
  PetOwner,
  PetSession,
  ActivityLog,
  SystemNotification,
  ContactInquiry
} from '../types';

// ─── REAL DATA INITIALIZATION (EMPTY BY DEFAULT UNTIL CREATED IN SUPABASE) ────

export const initialPets: Pet[] = [];
export const initialSchedules: FeedingSchedule[] = [];
export const initialFeedingLogs: FeedingLog[] = [];
export const initialHydrationLogs: HydrationLog[] = [];
export const initialVitals: VitalSignRecord[] = [];
export const initialAIAlerts: AIHealthAlert[] = [];
export const initialDevices: Device[] = [];
export const initialOwners: PetOwner[] = [];
export const initialSessions: PetSession[] = [];
export const initialActivityLogs: ActivityLog[] = [];
export const initialNotifications: SystemNotification[] = [];
export const initialInquiries: ContactInquiry[] = [];


// ─── PROTECTED CLINIC SUPER ADMIN ACCOUNTS ───────────────────────────────────

export const initialUsers: ClinicUser[] = [
  {
    id: 'USR-SUPER-01',
    name: 'Joecel Garcia',
    fullName: 'Joecel Garcia',
    email: 'joecelgarcia1@gmail.com',
    role: 'Super Admin',
    department: 'Chief Executive & Master System Controller',
    status: 'Active',
    lastActive: 'Now (Active)',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    isProtected: true,
    password: 'Admin#123'
  },
  {
    id: 'USR-SUPER-02',
    name: 'Marc Germine Ganan',
    fullName: 'Marc Germine Ganan',
    email: 'marcgermineganan05@gmail.com',
    role: 'Super Admin',
    department: 'Chief Executive & Master System Controller',
    status: 'Active',
    lastActive: 'Now (Active)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    isProtected: true,
    password: 'Admin#123'
  }
];

// ─── DEFAULT CLINIC SYSTEM SETTINGS ──────────────────────────────────────────

export const initialSettings: ClinicSettings = {
  clinicName: 'Heritage Animal Clinic',
  clinicAddress: '742 Evergreen Terrace, Medical District, Sector 4',
  clinicPhone: '(555) 890-1234',
  licenseId: 'VET-LIC-2026-9817',
  defaultPortionGrams: 100,
  defaultHydrationMlPerKg: 50,
  tempWarningMin: 37.5,
  tempWarningMax: 39.2,
  hrWarningMin: 60,
  hrWarningMax: 140,
  emailNotifications: true,
  smsNotifications: true,
  browserNotifications: true,
  theme: 'clinic-blue',
  compactLayout: false,
  apiEndpoint: 'https://api.heritageanimalclinic.org/v1/hydronourish',
  apiSecretKey: 'hn_live_sk_89327498173491874',
  webhookUrl: 'https://api.heritageanimalclinic.org/webhooks/esp32-telemetry'
};

// ─── EMPTY CHART AGGREGATES (POPULATED DYNAMICALLY FROM REAL DB RECORDS) ─────

export const weeklyFeedingData = [
  { day: 'Mon', scheduledGrams: 0, dispensedGrams: 0 },
  { day: 'Tue', scheduledGrams: 0, dispensedGrams: 0 },
  { day: 'Wed', scheduledGrams: 0, dispensedGrams: 0 },
  { day: 'Thu', scheduledGrams: 0, dispensedGrams: 0 },
  { day: 'Fri', scheduledGrams: 0, dispensedGrams: 0 },
  { day: 'Sat', scheduledGrams: 0, dispensedGrams: 0 },
  { day: 'Sun', scheduledGrams: 0, dispensedGrams: 0 }
];

export const dailyHydrationData = [
  { time: '06:00 AM', ml: 0, target: 0 },
  { time: '09:00 AM', ml: 0, target: 0 },
  { time: '12:00 PM', ml: 0, target: 0 },
  { time: '03:00 PM', ml: 0, target: 0 },
  { time: '06:00 PM', ml: 0, target: 0 },
  { time: '09:00 PM', ml: 0, target: 0 }
];

export const vitalSignsTrendData = [
  { time: 'Mon', maxTemp: 0, maxHR: 0 },
  { time: 'Tue', maxTemp: 0, maxHR: 0 },
  { time: 'Wed', maxTemp: 0, maxHR: 0 },
  { time: 'Thu', maxTemp: 0, maxHR: 0 },
  { time: 'Fri', maxTemp: 0, maxHR: 0 }
];

export const recentSystemActivity: any[] = [];
