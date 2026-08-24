export type HealthStatus = 'Healthy' | 'Attention Needed' | 'Critical';
export type DeviceStatus = 'Online' | 'Offline' | 'Warning' | 'Connecting';
export type AlertSeverity = 'Info' | 'Warning' | 'Critical';
export type ReviewStatus = 'Unreviewed' | 'In Review' | 'Resolved';
export type UserRole = 'Super Admin' | 'Administrator' | 'Veterinarian' | 'Clinic Staff';

// ─── New Session Workflow Status Types ────────────────────────────────────
export type HardwareStatus = 'available' | 'occupied' | 'offline' | 'maintenance';
export type PetSessionStatus = 'queued' | 'active' | 'completed' | 'cancelled';
export type UserAccessStatus = 'active' | 'inactive' | 'archived';

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Other';
  breed: string;
  age: number; // in years
  weight: number; // in kg
  sex?: 'Male' | 'Female';
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerId?: string; // reference to PetOwner
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
  latestVitals?: {
    temperature: number; // °C
    heartRate: number; // bpm
    activityLevel: 'Low' | 'Normal' | 'High';
    lastMeasured: string;
  };
  emergencyContact?: string;
  notes: string;
}

export interface FeedingSchedule {
  id: string;
  petId: string;
  petName: string;
  foodType: string;
  portionGrams: number;
  scheduledTime: string; // e.g. "08:00 AM" or "08:00 AM • Everyday"
  dispenseStatus: 'Dispensed' | 'Pending' | 'Failed';
  deviceId: string;
  lastDispensedAt?: string;
  type?: 'food' | 'water';
  days?: string;
  enabled?: boolean;
  durationMs?: number;
}

export interface FeedingLog {
  id: string;
  petId: string;
  petName: string;
  portionGrams: number;
  dispensedAt: string;
  status: 'Success' | 'Manual Override' | 'Skipped';
  deviceId: string;
  sessionId?: string;
}

export interface HydrationLog {
  id: string;
  petId: string;
  petName: string;
  amountMl: number;
  timestamp: string;
  reservoirLevelPct: number;
  sessionId?: string;
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
  sessionId?: string;
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
  sessionId?: string;
}

export interface Device {
  id: string;
  deviceName: string;
  assignedPetId: string;
  assignedPetName: string;
  status: DeviceStatus;
  hardwareStatus: HardwareStatus;
  wifiSignalDbm: number;
  wifiSsid?: string;
  foodLevelPct: number;
  waterLevelPct: number;
  waterRawAdc?: number;
  foodBowlWeightGrams?: number;
  waterQualityPpm?: number;
  batteryPct: number;
  isPluggedIn: boolean;
  lastTransmission: string;
  firmwareVersion: string;
  macAddress: string;
  ipAddress?: string;
  cameraIp?: string;
  isPumping?: boolean;
  autoRefillEnabled?: boolean;
  isPumpDeactivated?: boolean;
  lastSeenAt?: string | null;
  uptimeSeconds?: number;
}

export interface DeviceTelemetryPayload {
  deviceId: string;
  timestamp: string;
  waterLevelPercent: number;
  waterRawAdc?: number;
  foodLevelPercent: number;
  tdsPpm?: number;
  wifiRssiDbm?: number;
  wifiSsid?: string;
  pumpActive?: boolean;
  firmwareVersion?: string;
  cameraIp?: string;
  uptimeSeconds?: number;
}

export interface ClinicUser {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: UserRole;
  department?: string | null;
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

// ─── Pet Owner (for session-based temporary access) ───────────────────────

export interface PetOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  accessStatus: UserAccessStatus;
  petIds: string[];
  currentSessionId: string | null;
  dateCreated: string;
  lastLogin: string | null;
  avatarUrl?: string;
  address?: string;
  notes?: string;
  password?: string;
}

// ─── Pet Monitoring Session ───────────────────────────────────────────────

export interface PetSession {
  id: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAvatarUrl: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  deviceId: string;
  status: PetSessionStatus;
  admissionDate: string;
  expectedReleaseDate: string;
  startTime: string;
  releaseTime: string | null;
  releaseCondition: string | null;
  finalNotes: string | null;
  cancelledReason: string | null;
  completedBy: string | null;
  emergencyContact: string;
  feedingRecordCount: number;
  hydrationRecordCount: number;
  vitalSignRecordCount: number;
  alertCount: number;
  totalFoodGrams?: number;
  totalWaterMl?: number;
  durationText?: string;
  notes: string;
  queuePosition?: number;
  queuedAt?: string;
  actualReleaseDate?: string;
  admissionNotes?: string;
  releaseNotes?: string;
  admissionAdmin?: string;
  releaseAdmin?: string;
  // Snapshot of pet data at admission time
  petSnapshot: {
    weight: number;
    age: number;
    feedingPlan: Pet['feedingPlan'];
    hydrationTarget: number;
    healthStatus: HealthStatus;
  };
}

// ─── Activity Log ─────────────────────────────────────────────────────────

export type ActivityAction =
  | 'created_owner'
  | 'registered_pet'
  | 'assigned_hardware'
  | 'started_session'
  | 'completed_session'
  | 'cancelled_session'
  | 'deactivated_owner'
  | 'archived_account'
  | 'reactivated_account'
  | 'changed_hardware_status'
  | 'feeding_completed'
  | 'water_level_low'
  | 'food_level_low'
  | 'abnormal_vital'
  | 'device_disconnected';

export interface ActivityLog {
  id: string;
  adminName: string;
  action: ActivityAction;
  ownerName: string | null;
  petName: string | null;
  sessionId: string | null;
  timestamp: string;
  result: 'success' | 'failed' | 'warning';
  details?: string;
}

// ─── System Notification ──────────────────────────────────────────────────

export type NotificationType =
  | 'pet_assigned'
  | 'session_started'
  | 'feeding_completed'
  | 'water_level_low'
  | 'food_level_low'
  | 'abnormal_vital'
  | 'device_disconnected'
  | 'session_completed'
  | 'owner_deactivated'
  | 'hardware_available'
  | 'hardware_maintenance'
  | 'inquiry_received';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  sessionId?: string;
  petName?: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

// ─── Contact Inquiry / Messages ───────────────────────────────────────────

export type InquiryStatus = 'unread' | 'read' | 'replied' | 'archived';

export interface ChatMessageItem {
  id: string;
  sender: 'owner' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: InquiryStatus;
  repliedAt?: string;
  replyMessage?: string;
  messagesThread?: ChatMessageItem[];
}

