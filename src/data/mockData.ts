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

export const initialPets: Pet[] = [
  {
    id: 'PET-001-8011',
    name: 'galaxy destroyer',
    species: 'Dog',
    breed: 'Siberian Husky',
    age: 3,
    weight: 24.5,
    sex: 'Male',
    ownerName: 'Joecel Garcia',
    ownerPhone: '+63 917 555 0192',
    ownerEmail: 'joecelgarcia1@gmail.com',
    ownerId: 'OWN-002',
    clinicRef: 'REF-2026-8011',
    assignedDeviceId: 'HN-NODE-F778',
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1547407139-3c921a66005c?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 150, timesPerDay: 2, foodType: 'High-Protein Active Dog Kibble' },
    hydrationTarget: 1200,
    latestVitals: { temperature: 38.5, heartRate: 85, activityLevel: 'Active', lastMeasured: 'Today' },
    emergencyContact: '+63 917 555 0192',
    notes: 'Primary clinic dog linked to HydroNourish Smart Station.'
  },
  {
    id: 'PET-001-3109',
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: 4,
    weight: 29.5,
    sex: 'Male',
    ownerName: 'Joecel Garcia',
    ownerPhone: '+63 917 555 0192',
    ownerEmail: 'joecelgarcia1@gmail.com',
    ownerId: 'OWN-002',
    clinicRef: 'REF-2026-3109',
    assignedDeviceId: 'HN-NODE-F778',
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 250, timesPerDay: 2, foodType: 'High-Protein Adult Kibble' },
    hydrationTarget: 1400,
    latestVitals: { temperature: 38.4, heartRate: 82, activityLevel: 'Normal', lastMeasured: 'Today' },
    emergencyContact: '+63 917 555 0192',
    notes: 'Regular hydration and nutrition monitoring.'
  },
  {
    id: 'PET-001-9389',
    name: 'Luna',
    species: 'Cat',
    breed: 'Persian',
    age: 2,
    weight: 3.8,
    sex: 'Female',
    ownerName: 'Marc Germine Ganan',
    ownerPhone: '09776907092',
    ownerEmail: 'marcgermineganan03@gmail.com',
    ownerId: 'OWN-003',
    clinicRef: 'REF-2026-9389',
    assignedDeviceId: undefined,
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 50, timesPerDay: 3, foodType: 'Kitten & Adult Salmon Blend' },
    hydrationTarget: 200,
    latestVitals: { temperature: 38.8, heartRate: 130, activityLevel: 'Resting', lastMeasured: 'Today' },
    emergencyContact: '09776907092',
    notes: 'Sensitive stomach, requires clean filtered water.'
  },
  {
    id: 'PET-002-3382',
    name: 'Bella',
    species: 'Cat',
    breed: 'Siamese',
    age: 3,
    weight: 4.2,
    sex: 'Female',
    ownerName: 'Marc Germine Ganan',
    ownerPhone: '09776907092',
    ownerEmail: 'marcgermineganan03@gmail.com',
    ownerId: 'OWN-003',
    clinicRef: 'REF-2026-3382',
    assignedDeviceId: undefined,
    healthStatus: 'Attention Needed',
    avatarUrl: 'https://images.unsplash.com/photo-1513360309081-38f076278f1d?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 60, timesPerDay: 3, foodType: 'Urinary Care Wet + Dry Mix' },
    hydrationTarget: 250,
    latestVitals: { temperature: 39.1, heartRate: 142, activityLevel: 'Low', lastMeasured: 'Today' },
    emergencyContact: '09776907092',
    notes: 'Urinary care protocol in effect.'
  },
  {
    id: 'PET-001-3357',
    name: 'Milo',
    species: 'Dog',
    breed: 'Beagle',
    age: 5,
    weight: 12.8,
    sex: 'Male',
    ownerName: 'Marc Germine Ganan',
    ownerPhone: '09776907092',
    ownerEmail: 'marcgermineganan03@gmail.com',
    ownerId: 'OWN-003',
    clinicRef: 'REF-2026-3357',
    assignedDeviceId: undefined,
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 140, timesPerDay: 2, foodType: 'Active Dog Recipe' },
    hydrationTarget: 650,
    latestVitals: { temperature: 38.6, heartRate: 88, activityLevel: 'Active', lastMeasured: 'Today' },
    emergencyContact: '09776907092',
    notes: 'Post-op weight monitoring.'
  },
  {
    id: 'PET-001-8533',
    name: 'Rocky',
    species: 'Dog',
    breed: 'German Shepherd',
    age: 4,
    weight: 32.0,
    sex: 'Male',
    ownerName: 'Nathaniel Brillantes',
    ownerPhone: '09205167729',
    ownerEmail: 'brillantesnathaniel265@gmail.com',
    ownerId: 'OWN-004',
    clinicRef: 'REF-2026-8533',
    assignedDeviceId: undefined,
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 300, timesPerDay: 2, foodType: 'Large Breed Adult Formula' },
    hydrationTarget: 1600,
    latestVitals: { temperature: 38.5, heartRate: 80, activityLevel: 'Active', lastMeasured: 'Today' },
    emergencyContact: '09205167729',
    notes: 'Vaccinated and cleared for boarding.'
  },
  {
    id: 'PET-002-6903',
    name: 'Daisy',
    species: 'Dog',
    breed: 'Labrador Retriever',
    age: 3,
    weight: 26.5,
    sex: 'Female',
    ownerName: 'Nathaniel Brillantes',
    ownerPhone: '09205167729',
    ownerEmail: 'brillantesnathani260@gmail.com',
    ownerId: 'OWN-005',
    clinicRef: 'REF-2026-6903',
    assignedDeviceId: undefined,
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab2?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 220, timesPerDay: 2, foodType: 'Balanced Daily Diet' },
    hydrationTarget: 1300,
    latestVitals: { temperature: 38.3, heartRate: 84, activityLevel: 'Normal', lastMeasured: 'Today' },
    emergencyContact: '09205167729',
    notes: 'Healthy active adult.'
  }
];
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
