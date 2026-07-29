export type HealthStatus = 'Healthy' | 'Attention Needed' | 'Critical';
export type DeviceStatus = 'Online' | 'Offline' | 'Warning';
export type AlertSeverity = 'Info' | 'Warning' | 'Critical';
export type ReviewStatus = 'Unreviewed' | 'In Review' | 'Resolved';
export type UserRole = 'Super Admin' | 'Administrator' | 'Veterinarian' | 'Clinic Staff';

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Other';
  breed: string;
  age: number; // in years
  weight: number; // in kg
  ownerName: string;
  ownerPhone: string;
  clinicRef: string;
  assignedDeviceId: string;
  healthStatus: HealthStatus;
  avatarUrl: string;
  feedingPlan: {
    portionGrams: number;
    timesPerDay: number;
    foodType: string;
  };
  hydrationTarget: number; // ml per day
  latestVitals: {
    temperature: number; // °C
    heartRate: number; // bpm
    activityLevel: 'Low' | 'Normal' | 'High';
    lastMeasured: string;
  };
  notes: string;
}

export interface FeedingSchedule {
  id: string;
  petId: string;
  petName: string;
  foodType: string;
  portionGrams: number;
  scheduledTime: string; // e.g. "08:00 AM"
  dispenseStatus: 'Dispensed' | 'Pending' | 'Failed';
  deviceId: string;
  lastDispensedAt?: string;
}

export interface FeedingLog {
  id: string;
  petId: string;
  petName: string;
  portionGrams: number;
  dispensedAt: string;
  status: 'Success' | 'Manual Override' | 'Skipped';
  deviceId: string;
}

export interface HydrationLog {
  id: string;
  petId: string;
  petName: string;
  amountMl: number;
  timestamp: string;
  reservoirLevelPct: number;
}

export interface VitalSignRecord {
  id: string;
  petId: string;
  petName: string;
  temperature: number; // °C
  heartRate: number; // bpm
  weight: number; // kg
  activityMins: number;
  status: 'Normal' | 'Warning' | 'Critical';
  timestamp: string;
}

export interface AIHealthAlert {
  id: string;
  petId: string;
  petName: string;
  alertType: string;
  observedReading: string;
  severity: AlertSeverity;
  aiObservation: string;
  recommendedAction: string;
  timestamp: string;
  reviewStatus: ReviewStatus;
}

export interface Device {
  id: string;
  assignedPetId: string;
  assignedPetName: string;
  status: DeviceStatus;
  wifiSignalDbm: number;
  foodLevelPct: number;
  waterLevelPct: number;
  batteryPct: number;
  isPluggedIn: boolean;
  lastTransmission: string;
  firmwareVersion: string;
  macAddress: string;
}

export interface ClinicUser {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
  avatarUrl: string;
  isProtected?: boolean;
  password?: string;
}

export interface ClinicSettings {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  licenseId: string;
  defaultPortionGrams: number;
  defaultHydrationMlPerKg: number;
  tempWarningMin: number;
  tempWarningMax: number;
  hrWarningMin: number;
  hrWarningMax: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  browserNotifications: boolean;
  theme: 'clinic-blue' | 'modern-emerald' | 'dark';
  compactLayout: boolean;
  apiEndpoint: string;
  apiSecretKey: string;
  webhookUrl: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}
