import {
  Pet,
  FeedingSchedule,
  FeedingLog,
  HydrationLog,
  VitalSignRecord,
  AIHealthAlert,
  Device,
  ClinicUser,
  ClinicSettings
} from '../types';

export const initialPets: Pet[] = [
  {
    id: 'PET-001',
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: 4,
    weight: 29.5,
    ownerName: 'Eleanor Vance',
    ownerPhone: '(555) 234-5678',
    clinicRef: 'REF-2026-081',
    assignedDeviceId: 'HN-DEV-0101',
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 250, timesPerDay: 2, foodType: 'High-Protein Adult Kibble' },
    hydrationTarget: 1400,
    latestVitals: { temperature: 38.5, heartRate: 85, activityLevel: 'Normal', lastMeasured: '10 mins ago' },
    notes: 'Max is responding well to regular hydration monitoring. Maintain current protein diet.'
  },
  {
    id: 'PET-002',
    name: 'Bella',
    species: 'Cat',
    breed: 'Siamese',
    age: 3,
    weight: 4.2,
    ownerName: 'Marcus Wright',
    ownerPhone: '(555) 345-6789',
    clinicRef: 'REF-2026-094',
    assignedDeviceId: 'HN-DEV-0102',
    healthStatus: 'Attention Needed',
    avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 60, timesPerDay: 3, foodType: 'Urinary Care Wet + Dry Mix' },
    hydrationTarget: 250,
    latestVitals: { temperature: 39.2, heartRate: 142, activityLevel: 'Low', lastMeasured: '25 mins ago' },
    notes: 'Mild decline in daily water intake over 48h. Recommended monitoring hydration gauge closely.'
  },
  {
    id: 'PET-003',
    name: 'Milo',
    species: 'Dog',
    breed: 'Beagle',
    age: 5,
    weight: 12.8,
    ownerName: 'Sarah Jenkins',
    ownerPhone: '(555) 456-7890',
    clinicRef: 'REF-2026-112',
    assignedDeviceId: 'HN-DEV-0103',
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 140, timesPerDay: 2, foodType: 'Active Dog Recipe' },
    hydrationTarget: 650,
    latestVitals: { temperature: 38.4, heartRate: 92, activityLevel: 'High', lastMeasured: '5 mins ago' },
    notes: 'Healthy weight progression following post-op checkup.'
  },
  {
    id: 'PET-004',
    name: 'Luna',
    species: 'Cat',
    breed: 'Maine Coon',
    age: 2,
    weight: 6.8,
    ownerName: 'David Miller',
    ownerPhone: '(555) 567-8901',
    clinicRef: 'REF-2026-145',
    assignedDeviceId: 'HN-DEV-0104',
    healthStatus: 'Critical',
    avatarUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 85, timesPerDay: 2, foodType: 'Grain-Free Salmon Formula' },
    hydrationTarget: 380,
    latestVitals: { temperature: 39.8, heartRate: 180, activityLevel: 'Low', lastMeasured: '12 mins ago' },
    notes: 'Alert triggered for elevated temperature and tachycardia. Scheduled for urgent physical review.'
  },
  {
    id: 'PET-005',
    name: 'Oliver',
    species: 'Dog',
    breed: 'French Bulldog',
    age: 6,
    weight: 13.1,
    ownerName: 'Clara Oswald',
    ownerPhone: '(555) 678-9012',
    clinicRef: 'REF-2026-189',
    assignedDeviceId: 'HN-DEV-0105',
    healthStatus: 'Healthy',
    avatarUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 130, timesPerDay: 2, foodType: 'Weight Management Formula' },
    hydrationTarget: 620,
    latestVitals: { temperature: 38.6, heartRate: 88, activityLevel: 'Normal', lastMeasured: '18 mins ago' },
    notes: 'Breathing pattern & vitals stable.'
  },
  {
    id: 'PET-006',
    name: 'Daisy',
    species: 'Dog',
    breed: 'Poodle',
    age: 1,
    weight: 8.4,
    ownerName: 'Robert Langdon',
    ownerPhone: '(555) 789-0123',
    clinicRef: 'REF-2026-204',
    assignedDeviceId: 'HN-DEV-0106',
    healthStatus: 'Attention Needed',
    avatarUrl: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab2?auto=format&fit=crop&q=80&w=300',
    feedingPlan: { portionGrams: 110, timesPerDay: 3, foodType: 'Puppy Growth Formula' },
    hydrationTarget: 480,
    latestVitals: { temperature: 38.8, heartRate: 110, activityLevel: 'High', lastMeasured: '40 mins ago' },
    notes: 'Water container level low on unit HN-DEV-0106.'
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
    deviceId: 'HN-DEV-0101',
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
    deviceId: 'HN-DEV-0101'
  },
  {
    id: 'SCH-103',
    petId: 'PET-002',
    petName: 'Bella',
    foodType: 'Urinary Care Wet + Dry Mix',
    portionGrams: 20,
    scheduledTime: '07:30 AM',
    dispenseStatus: 'Dispensed',
    deviceId: 'HN-DEV-0102',
    lastDispensedAt: '2026-07-27 07:30 AM'
  },
  {
    id: 'SCH-104',
    petId: 'PET-002',
    petName: 'Bella',
    foodType: 'Urinary Care Wet + Dry Mix',
    portionGrams: 20,
    scheduledTime: '01:00 PM',
    dispenseStatus: 'Dispensed',
    deviceId: 'HN-DEV-0102',
    lastDispensedAt: '2026-07-27 01:00 PM'
  },
  {
    id: 'SCH-105',
    petId: 'PET-003',
    petName: 'Milo',
    foodType: 'Active Dog Recipe',
    portionGrams: 70,
    scheduledTime: '08:30 AM',
    dispenseStatus: 'Dispensed',
    deviceId: 'HN-DEV-0103',
    lastDispensedAt: '2026-07-27 08:30 AM'
  },
  {
    id: 'SCH-106',
    petId: 'PET-004',
    petName: 'Luna',
    foodType: 'Grain-Free Salmon Formula',
    portionGrams: 42,
    scheduledTime: '09:00 AM',
    dispenseStatus: 'Dispensed',
    deviceId: 'HN-DEV-0104',
    lastDispensedAt: '2026-07-27 09:00 AM'
  }
];

export const initialFeedingLogs: FeedingLog[] = [
  { id: 'FL-301', petId: 'PET-001', petName: 'Max', portionGrams: 125, dispensedAt: '2026-07-27 08:00 AM', status: 'Success', deviceId: 'HN-DEV-0101' },
  { id: 'FL-302', petId: 'PET-002', petName: 'Bella', portionGrams: 20, dispensedAt: '2026-07-27 07:30 AM', status: 'Success', deviceId: 'HN-DEV-0102' },
  { id: 'FL-303', petId: 'PET-002', petName: 'Bella', portionGrams: 20, dispensedAt: '2026-07-27 01:00 PM', status: 'Success', deviceId: 'HN-DEV-0102' },
  { id: 'FL-304', petId: 'PET-003', petName: 'Milo', portionGrams: 70, dispensedAt: '2026-07-27 08:30 AM', status: 'Success', deviceId: 'HN-DEV-0103' },
  { id: 'FL-305', petId: 'PET-004', petName: 'Luna', portionGrams: 42, dispensedAt: '2026-07-27 09:00 AM', status: 'Manual Override', deviceId: 'HN-DEV-0104' },
  { id: 'FL-306', petId: 'PET-005', petName: 'Oliver', portionGrams: 65, dispensedAt: '2026-07-27 08:15 AM', status: 'Success', deviceId: 'HN-DEV-0105' },
];

export const initialHydrationLogs: HydrationLog[] = [
  { id: 'HL-401', petId: 'PET-001', petName: 'Max', amountMl: 320, timestamp: '2026-07-27 09:30 AM', reservoirLevelPct: 82 },
  { id: 'HL-402', petId: 'PET-001', petName: 'Max', amountMl: 280, timestamp: '2026-07-27 01:45 PM', reservoirLevelPct: 74 },
  { id: 'HL-403', petId: 'PET-002', petName: 'Bella', amountMl: 45, timestamp: '2026-07-27 08:10 AM', reservoirLevelPct: 65 },
  { id: 'HL-404', petId: 'PET-003', petName: 'Milo', amountMl: 190, timestamp: '2026-07-27 10:15 AM', reservoirLevelPct: 90 },
  { id: 'HL-405', petId: 'PET-004', petName: 'Luna', amountMl: 30, timestamp: '2026-07-27 11:00 AM', reservoirLevelPct: 40 },
  { id: 'HL-406', petId: 'PET-006', petName: 'Daisy', amountMl: 120, timestamp: '2026-07-27 12:20 PM', reservoirLevelPct: 18 },
];

export const initialVitals: VitalSignRecord[] = [
  { id: 'VIT-501', petId: 'PET-001', petName: 'Max', temperature: 38.5, heartRate: 85, weight: 29.5, activityMins: 45, status: 'Normal', timestamp: '2026-07-27 08:00 AM' },
  { id: 'VIT-502', petId: 'PET-002', petName: 'Bella', temperature: 39.2, heartRate: 142, weight: 4.2, activityMins: 15, status: 'Warning', timestamp: '2026-07-27 08:30 AM' },
  { id: 'VIT-503', petId: 'PET-003', petName: 'Milo', temperature: 38.4, heartRate: 92, weight: 12.8, activityMins: 60, status: 'Normal', timestamp: '2026-07-27 09:00 AM' },
  { id: 'VIT-504', petId: 'PET-004', petName: 'Luna', temperature: 39.8, heartRate: 180, weight: 6.8, activityMins: 8, status: 'Critical', timestamp: '2026-07-27 09:15 AM' },
  { id: 'VIT-505', petId: 'PET-005', petName: 'Oliver', temperature: 38.6, heartRate: 88, weight: 13.1, activityMins: 35, status: 'Normal', timestamp: '2026-07-27 09:45 AM' },
  { id: 'VIT-506', petId: 'PET-006', petName: 'Daisy', temperature: 38.8, heartRate: 110, weight: 8.4, activityMins: 50, status: 'Warning', timestamp: '2026-07-27 10:00 AM' },
];

export const initialAIAlerts: AIHealthAlert[] = [
  {
    id: 'ALT-701',
    petId: 'PET-004',
    petName: 'Luna',
    alertType: 'High Body Temperature & Tachycardia',
    observedReading: '39.8°C temp / 180 bpm heart rate',
    severity: 'Critical',
    aiObservation: 'Observed biometric readings indicate acute pyrexia and elevated heart rate during resting state.',
    recommendedAction: 'Requires immediate physical examination by Heritage Animal Clinic veterinarian to rule out acute infection.',
    timestamp: '2026-07-27 09:15 AM',
    reviewStatus: 'Unreviewed'
  },
  {
    id: 'ALT-702',
    petId: 'PET-002',
    petName: 'Bella',
    alertType: 'Reduced Hydration Consumption',
    observedReading: 'Water intake -45% compared to 7-day baseline',
    severity: 'Warning',
    aiObservation: 'Possible abnormal reading suggesting reduced fluid intake or discomfort when accessing dispenser.',
    recommendedAction: 'Verify dispenser water purity, inspect oral cavity, and perform hydration skin turgor check.',
    timestamp: '2026-07-27 08:30 AM',
    reviewStatus: 'In Review'
  },
  {
    id: 'ALT-703',
    petId: 'PET-006',
    petName: 'Daisy',
    alertType: 'Low Reservoir Level Warning',
    observedReading: 'Water container level at 18%',
    severity: 'Warning',
    aiObservation: 'Dispenser reservoir nearing exhaustion. Water flow rate may degrade.',
    recommendedAction: 'Refill unit HN-DEV-0106 container with clean fresh water.',
    timestamp: '2026-07-27 10:00 AM',
    reviewStatus: 'Unreviewed'
  }
];

export const initialDevices: Device[] = [
  {
    id: 'HN-DEV-0101',
    assignedPetId: 'PET-001',
    assignedPetName: 'Max',
    status: 'Online',
    wifiSignalDbm: -54,
    foodLevelPct: 78,
    waterLevelPct: 82,
    batteryPct: 98,
    isPluggedIn: true,
    lastTransmission: 'Just now',
    firmwareVersion: 'v2.4.1-ESP32',
    macAddress: '24:0A:C4:00:01:A1'
  },
  {
    id: 'HN-DEV-0102',
    assignedPetId: 'PET-002',
    assignedPetName: 'Bella',
    status: 'Online',
    wifiSignalDbm: -62,
    foodLevelPct: 45,
    waterLevelPct: 65,
    batteryPct: 88,
    isPluggedIn: true,
    lastTransmission: '2 mins ago',
    firmwareVersion: 'v2.4.1-ESP32',
    macAddress: '24:0A:C4:00:02:B2'
  },
  {
    id: 'HN-DEV-0103',
    assignedPetId: 'PET-003',
    assignedPetName: 'Milo',
    status: 'Online',
    wifiSignalDbm: -48,
    foodLevelPct: 92,
    waterLevelPct: 90,
    batteryPct: 100,
    isPluggedIn: true,
    lastTransmission: '1 min ago',
    firmwareVersion: 'v2.4.1-ESP32',
    macAddress: '24:0A:C4:00:03:C3'
  },
  {
    id: 'HN-DEV-0104',
    assignedPetId: 'PET-004',
    assignedPetName: 'Luna',
    status: 'Warning',
    wifiSignalDbm: -78,
    foodLevelPct: 30,
    waterLevelPct: 40,
    batteryPct: 42,
    isPluggedIn: false,
    lastTransmission: '5 mins ago',
    firmwareVersion: 'v2.4.0-ESP32',
    macAddress: '24:0A:C4:00:04:D4'
  },
  {
    id: 'HN-DEV-0105',
    assignedPetId: 'PET-005',
    assignedPetName: 'Oliver',
    status: 'Online',
    wifiSignalDbm: -58,
    foodLevelPct: 60,
    waterLevelPct: 75,
    batteryPct: 95,
    isPluggedIn: true,
    lastTransmission: '3 mins ago',
    firmwareVersion: 'v2.4.1-ESP32',
    macAddress: '24:0A:C4:00:05:E5'
  },
  {
    id: 'HN-DEV-0106',
    assignedPetId: 'PET-006',
    assignedPetName: 'Daisy',
    status: 'Warning',
    wifiSignalDbm: -68,
    foodLevelPct: 55,
    waterLevelPct: 18,
    batteryPct: 70,
    isPluggedIn: true,
    lastTransmission: '4 mins ago',
    firmwareVersion: 'v2.4.1-ESP32',
    macAddress: '24:0A:C4:00:06:F6'
  }
];

export const initialUsers: ClinicUser[] = [
  {
    id: 'USR-01',
    name: 'Dr. Sarah Jenkins',
    email: 's.jenkins@heritageanimalclinic.com',
    role: 'Veterinarian',
    department: 'Chief Veterinary Medical Officer',
    status: 'Active',
    lastActive: 'Now (Active)',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'USR-02',
    name: 'Dr. Alan Grant',
    email: 'a.grant@heritageanimalclinic.com',
    role: 'Veterinarian',
    department: 'Small Animal Care',
    status: 'Active',
    lastActive: '25 mins ago',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'USR-03',
    name: 'Maria Santos',
    email: 'm.santos@heritageanimalclinic.com',
    role: 'Clinic Staff',
    department: 'Lead Vet Technician',
    status: 'Active',
    lastActive: '1 hour ago',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'USR-04',
    name: 'James Reynolds',
    email: 'admin@heritageanimalclinic.com',
    role: 'Administrator',
    department: 'IT & System Ops',
    status: 'Active',
    lastActive: '10 mins ago',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
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
  { id: 'ACT-1', text: 'Unit HN-DEV-0101 dispensed 125g for Max', timestamp: '10 mins ago', type: 'feeding' },
  { id: 'ACT-2', text: 'AI Alert generated for Luna (Critical Temp: 39.8°C)', timestamp: '12 mins ago', type: 'alert' },
  { id: 'ACT-3', text: 'Bella consumed 45ml water from HN-DEV-0102', timestamp: '25 mins ago', type: 'hydration' },
  { id: 'ACT-4', text: 'Dr. Sarah Jenkins reviewed Milo vital signs log', timestamp: '1 hour ago', type: 'user' },
  { id: 'ACT-5', text: 'Device HN-DEV-0106 transmitted battery telemetric packet', timestamp: '2 hours ago', type: 'device' }
];
