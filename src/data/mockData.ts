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
  SystemNotification
} from '../types';

export const initialPets: Pet[] = [
  {
    id: 'PET-001',
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: 4,
    weight: 29.5,
    sex: 'Male',
    ownerName: 'Eleanor Vance',
    ownerPhone: '(555) 234-5678',
    ownerId: 'OWN-001',
    clinicRef: 'REF-2026-081',
    assignedDeviceId: 'Cage 1',
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 250, timesPerDay: 2, foodType: 'High-Protein Adult Kibble' },
    hydrationTarget: 1400,
    latestVitals: { temperature: 38.5, heartRate: 85, activityLevel: 'Normal', lastMeasured: '10 mins ago' },
    emergencyContact: '(555) 234-9999',
    notes: 'Max is responding well to regular hydration monitoring. Maintain current protein diet.'
  }
];

export const initialSchedules: FeedingSchedule[] = [
  {
    id: 'SCH-101',
    petId: 'PET-001',
    petName: 'Max',
    foodType: 'High-Protein Adult Kibble',
    portionGrams: 125,
    scheduledTime: '08:00 AM',
    dispenseStatus: 'Dispensed',
    deviceId: 'Cage 1',
    lastDispensedAt: '2026-07-27 08:00 AM'
  },
  {
    id: 'SCH-102',
    petId: 'PET-001',
    petName: 'Max',
    foodType: 'High-Protein Adult Kibble',
    portionGrams: 125,
    scheduledTime: '06:00 PM',
    dispenseStatus: 'Pending',
    deviceId: 'Cage 1'
  }
];

export const initialFeedingLogs: FeedingLog[] = [
  { id: 'FL-301', petId: 'PET-001', petName: 'Max', portionGrams: 125, dispensedAt: '2026-07-27 08:00 AM', status: 'Success', deviceId: 'Cage 1', sessionId: 'SES-DEMO-001' },
  { id: 'FL-302', petId: 'PET-001', petName: 'Max', portionGrams: 125, dispensedAt: '2026-07-26 06:00 PM', status: 'Success', deviceId: 'Cage 1', sessionId: 'SES-DEMO-001' }
];

export const initialHydrationLogs: HydrationLog[] = [
  { id: 'HL-401', petId: 'PET-001', petName: 'Max', amountMl: 320, timestamp: '2026-07-27 09:30 AM', reservoirLevelPct: 82, sessionId: 'SES-DEMO-001' },
  { id: 'HL-402', petId: 'PET-001', petName: 'Max', amountMl: 280, timestamp: '2026-07-27 01:45 PM', reservoirLevelPct: 74, sessionId: 'SES-DEMO-001' }
];

export const initialVitals: VitalSignRecord[] = [
  { id: 'VIT-501', petId: 'PET-001', petName: 'Max', temperature: 38.5, heartRate: 85, weight: 29.5, activityMins: 45, status: 'Normal', timestamp: '2026-07-27 08:00 AM', sessionId: 'SES-DEMO-001' }
];

export const initialAIAlerts: AIHealthAlert[] = [
  {
    id: 'ALT-701',
    petId: 'PET-001',
    petName: 'Max',
    alertType: 'Hydration Target Achieved',
    observedReading: '1,400 ml consumed daily target met',
    severity: 'Info',
    aiObservation: 'Optimal hydration levels maintained consistently for 48 hours.',
    recommendedAction: 'Maintain current automated feeding and water dispenser schedule.',
    timestamp: '2026-07-27 09:15 AM',
    reviewStatus: 'Resolved'
  }
];

// ─── SINGLE SMART DEVICE NODE ────────────────────────────────────────────────

export const initialDevices: Device[] = [
  {
    id: 'Cage 1',
    deviceName: 'HydroNourish Smart Cage Unit',
    assignedPetId: 'PET-001',
    assignedPetName: 'Max',
    status: 'Online',
    hardwareStatus: 'occupied',
    wifiSignalDbm: -54,
    foodLevelPct: 78,
    waterLevelPct: 82,
    batteryPct: 98,
    isPluggedIn: true,
    lastTransmission: 'Just now',
    firmwareVersion: 'v2.4.1-ESP32',
    macAddress: '24:0A:C4:00:01:A1'
  }
];

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
  },
  {
    id: 'USR-SUPER-03',
    name: 'Marc Germine Ganan',
    fullName: 'Marc Germine Ganan',
    email: 'marcgermineganan03@gmail.com',
    role: 'Super Admin',
    department: 'Chief Executive & Master System Controller',
    status: 'Active',
    lastActive: 'Now (Active)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    isProtected: true,
    password: 'Admin#123'
  }
];

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

// ─── PET OWNERS ───────────────────────────────────────────────────────────

export const initialOwners: PetOwner[] = [
  {
    id: 'OWN-001',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@email.com',
    phone: '(555) 234-5678',
    accessStatus: 'inactive',
    petIds: ['PET-001'],
    currentSessionId: null,
    dateCreated: '2026-06-15T09:00:00Z',
    lastLogin: '2026-07-25T14:30:00Z',
    notes: 'Preferred communication via email.'
  }
];

// ─── DEMO COMPLETED SESSIONS ──────────────────────────────────────────────

export const initialSessions: PetSession[] = [
  {
    id: 'SES-DEMO-001',
    petId: 'PET-001',
    petName: 'Max',
    petSpecies: 'Dog',
    petBreed: 'Golden Retriever',
    petAvatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300',
    ownerId: 'OWN-001',
    ownerName: 'Eleanor Vance',
    ownerEmail: 'eleanor.vance@email.com',
    deviceId: 'Cage 1',
    status: 'completed',
    admissionDate: '2026-07-20T08:00:00Z',
    expectedReleaseDate: '2026-07-23T17:00:00Z',
    startTime: '2026-07-20T08:15:00Z',
    releaseTime: '2026-07-23T16:30:00Z',
    releaseCondition: 'Healthy — cleared for discharge',
    finalNotes: 'Max completed hydration monitoring with excellent compliance. All vitals within normal range throughout the stay.',
    cancelledReason: null,
    completedBy: 'Joecel Garcia',
    emergencyContact: '(555) 234-9999',
    feedingRecordCount: 6,
    hydrationRecordCount: 8,
    vitalSignRecordCount: 4,
    alertCount: 0,
    notes: 'Post-surgical hydration monitoring for 3 days.',
    petSnapshot: {
      weight: 29.5,
      age: 4,
      feedingPlan: { portionGrams: 250, timesPerDay: 2, foodType: 'High-Protein Adult Kibble' },
      hydrationTarget: 1400,
      healthStatus: 'Healthy'
    }
  },
  {
    id: 'SES-DEMO-002',
    petId: 'PET-002',
    petName: 'Bella',
    petSpecies: 'Cat',
    petBreed: 'Siamese',
    petAvatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300',
    ownerId: 'OWN-002',
    ownerName: 'Marcus Wright',
    ownerEmail: 'marcus.wright@email.com',
    deviceId: 'Cage 1',
    status: 'completed',
    admissionDate: '2026-07-24T09:00:00Z',
    expectedReleaseDate: '2026-07-26T17:00:00Z',
    startTime: '2026-07-24T09:20:00Z',
    releaseTime: '2026-07-26T15:00:00Z',
    releaseCondition: 'Attention Needed — follow-up required in 7 days',
    finalNotes: 'Bella showed reduced water intake. Owner advised to monitor hydration at home and return for follow-up.',
    cancelledReason: null,
    completedBy: 'Joecel Garcia',
    emergencyContact: '(555) 345-0000',
    feedingRecordCount: 4,
    hydrationRecordCount: 3,
    vitalSignRecordCount: 3,
    alertCount: 1,
    notes: 'Urinary health monitoring — reduced water intake concern.',
    petSnapshot: {
      weight: 4.2,
      age: 3,
      feedingPlan: { portionGrams: 60, timesPerDay: 3, foodType: 'Urinary Care Wet + Dry Mix' },
      hydrationTarget: 250,
      healthStatus: 'Attention Needed'
    }
  },
  {
    id: 'SES-DEMO-003',
    petId: 'PET-003',
    petName: 'Milo',
    petSpecies: 'Dog',
    petBreed: 'Beagle',
    petAvatarUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=300',
    ownerId: 'OWN-003',
    ownerName: 'Sarah Jenkins',
    ownerEmail: 'sarah.jenkins@email.com',
    deviceId: 'Cage 1',
    status: 'cancelled',
    admissionDate: '2026-07-27T10:00:00Z',
    expectedReleaseDate: '2026-07-29T17:00:00Z',
    startTime: '2026-07-27T10:10:00Z',
    releaseTime: '2026-07-27T11:00:00Z',
    releaseCondition: null,
    finalNotes: null,
    cancelledReason: 'Session created with incorrect pet assignment. Owner requested cancellation.',
    completedBy: null,
    emergencyContact: '(555) 456-0000',
    feedingRecordCount: 1,
    hydrationRecordCount: 1,
    vitalSignRecordCount: 1,
    alertCount: 0,
    notes: 'Post-op weight monitoring.',
    petSnapshot: {
      weight: 12.8,
      age: 5,
      feedingPlan: { portionGrams: 140, timesPerDay: 2, foodType: 'Active Dog Recipe' },
      hydrationTarget: 650,
      healthStatus: 'Healthy'
    }
  }
];

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────

export const initialActivityLogs: ActivityLog[] = [
  { id: 'LOG-001', adminName: 'Joecel Garcia', action: 'started_session', ownerName: 'Eleanor Vance', petName: 'Max', sessionId: 'SES-DEMO-001', timestamp: '2026-07-20T08:15:00Z', result: 'success', details: 'Assigned to Cage 1' },
  { id: 'LOG-002', adminName: 'Joecel Garcia', action: 'completed_session', ownerName: 'Eleanor Vance', petName: 'Max', sessionId: 'SES-DEMO-001', timestamp: '2026-07-23T16:30:00Z', result: 'success', details: 'Cleared for discharge' },
  { id: 'LOG-003', adminName: 'Joecel Garcia', action: 'deactivated_owner', ownerName: 'Eleanor Vance', petName: null, sessionId: null, timestamp: '2026-07-23T16:31:00Z', result: 'success' },
  { id: 'LOG-004', adminName: 'Joecel Garcia', action: 'started_session', ownerName: 'Marcus Wright', petName: 'Bella', sessionId: 'SES-DEMO-002', timestamp: '2026-07-24T09:20:00Z', result: 'success', details: 'Assigned to Cage 1' },
  { id: 'LOG-005', adminName: 'Joecel Garcia', action: 'completed_session', ownerName: 'Marcus Wright', petName: 'Bella', sessionId: 'SES-DEMO-002', timestamp: '2026-07-26T15:00:00Z', result: 'success' },
  { id: 'LOG-006', adminName: 'Joecel Garcia', action: 'started_session', ownerName: 'Sarah Jenkins', petName: 'Milo', sessionId: 'SES-DEMO-003', timestamp: '2026-07-27T10:10:00Z', result: 'success' },
  { id: 'LOG-007', adminName: 'Joecel Garcia', action: 'cancelled_session', ownerName: 'Sarah Jenkins', petName: 'Milo', sessionId: 'SES-DEMO-003', timestamp: '2026-07-27T11:00:00Z', result: 'success', details: 'Incorrect pet assignment' },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────

export const initialNotifications: SystemNotification[] = [
  { id: 'NOTIF-001', type: 'hardware_available', title: 'Hardware Available', message: 'HydroNourish Station Alpha is available for assignment.', timestamp: '2026-07-27T11:01:00Z', read: false, severity: 'info' },
  { id: 'NOTIF-002', type: 'session_completed', title: 'Session Completed', message: 'Bella\'s monitoring session was completed successfully. Records archived.', timestamp: '2026-07-26T15:00:00Z', read: true, sessionId: 'SES-DEMO-002', petName: 'Bella', severity: 'success' },
  { id: 'NOTIF-003', type: 'water_level_low', title: 'Water Level Low', message: 'Water container level at 18%. Refill recommended.', timestamp: '2026-07-27T10:00:00Z', read: false, petName: 'Daisy', severity: 'warning' },
];

// Recharts Weekly & Daily Aggregates
export const weeklyFeedingData = [
  { day: 'Mon', scheduledGrams: 1200, dispensedGrams: 1180 },
  { day: 'Tue', scheduledGrams: 1250, dispensedGrams: 1250 },
  { day: 'Wed', scheduledGrams: 1300, dispensedGrams: 1290 },
  { day: 'Thu', scheduledGrams: 1200, dispensedGrams: 1200 },
  { day: 'Fri', scheduledGrams: 1350, dispensedGrams: 1320 },
  { day: 'Sat', scheduledGrams: 1400, dispensedGrams: 1390 },
  { day: 'Sun', scheduledGrams: 1300, dispensedGrams: 1300 }
];

export const dailyHydrationData = [
  { time: '06:00 AM', ml: 120, target: 150 },
  { time: '09:00 AM', ml: 420, target: 450 },
  { time: '12:00 PM', ml: 850, target: 800 },
  { time: '03:00 PM', ml: 1250, target: 1100 },
  { time: '06:00 PM', ml: 1680, target: 1500 },
  { time: '09:00 PM', ml: 2100, target: 1900 }
];

export const vitalSignsTrendData = [
  { time: 'Mon', maxTemp: 38.5, bellaTemp: 38.9, lunaTemp: 39.1, maxHR: 86, bellaHR: 135, lunaHR: 155 },
  { time: 'Tue', maxTemp: 38.6, bellaTemp: 39.0, lunaTemp: 39.3, maxHR: 84, bellaHR: 138, lunaHR: 162 },
  { time: 'Wed', maxTemp: 38.4, bellaTemp: 39.1, lunaTemp: 39.4, maxHR: 88, bellaHR: 140, lunaHR: 168 },
  { time: 'Thu', maxTemp: 38.5, bellaTemp: 39.2, lunaTemp: 39.6, maxHR: 85, bellaHR: 142, lunaHR: 172 },
  { time: 'Fri', maxTemp: 38.5, bellaTemp: 39.2, lunaTemp: 39.8, maxHR: 85, bellaHR: 142, lunaHR: 180 }
];

export const recentSystemActivity = [
  { id: 'ACT-1', text: 'Unit Cage 1 dispensed 125g for Max', timestamp: '10 mins ago', type: 'feeding' },
  { id: 'ACT-2', text: 'AI Alert generated for Max (Hydration Target Met)', timestamp: '12 mins ago', type: 'alert' },
  { id: 'ACT-3', text: 'Max consumed 320ml water from Cage 1', timestamp: '25 mins ago', type: 'hydration' },
  { id: 'ACT-4', text: 'Dr. Sarah Jenkins reviewed Max feeding plan log', timestamp: '1 hour ago', type: 'user' },
  { id: 'ACT-5', text: 'HydroNourish Cage 1 Unit transmitted telemetric packet', timestamp: '2 hours ago', type: 'device' }
];
