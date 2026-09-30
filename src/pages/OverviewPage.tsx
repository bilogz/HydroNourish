/**
 * HydroNourish — Dashboard Overview Page
 * Heritage Animal Clinic Capstone Project
 *
 * Clinical overview dashboard featuring live telemetry, active sessions,
 * hardware control, feeding & hydration tracking, and direct patient management.
 */

import { PetSession, getDeviceWaterMl, getDeviceFoodGrams } from '../types';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { LiveCameraWidget } from '../components/LiveCameraWidget';
import { AiLearningCenterWidget } from '../components/ai/AiLearningCenterWidget';
import { HardwareAssignmentCard } from '../components/session/HardwareAssignmentCard';
import { AssignPetOwnerModal } from '../components/session/AssignPetOwnerModal';
import { CompleteSessionModal } from '../components/session/CompleteSessionModal';
import { CancelSessionModal } from '../components/session/CancelSessionModal';
import { usbSerialService } from '../services/usbSerialService';
import { useAppContext } from '../hooks/useAppContext';
import { useSession } from '../contexts/SessionContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Dog,
  Utensils,
  Droplets,
  Activity,
  CheckCircle,
  Clock,
  ChevronRight,
  Cpu,
  Zap,
  Usb,
  Calendar,
  Heart,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  Square,
  Play,
  Wifi,
  Scale,
  AlertTriangle,
  AlertCircle,
  Bot,
  PowerOff,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pets,
    devices,
    alerts,
    feedingLogs,
    hydrationLogs,
    dispenseDirect,
    dispenseWaterDirect,
    stopPumpDirect,
    toggleAutoRefillDirect,
    toggleAutoFlushDirect,
    tareScaleDirect,
    showToast,
  } = useAppContext();
  const {
    activeSession: ctxSession,
    hardware: sessionHardware,
    owners,
    getCompletedSessionCount,
  } = useSession();

  const [isUsbConnected, setIsUsbConnected] = useState<boolean>(() => usbSerialService.getIsConnected());

  useEffect(() => {
    const unsubStatus = usbSerialService.onStatus((connected) => {
      setIsUsbConnected(connected);
    });
    return unsubStatus;
  }, []);

  const hardware = devices.find(d => d.id === sessionHardware.id || d.status === 'Online') || devices[0] || sessionHardware;

  const assignedPet = ctxSession
    ? pets.find(p => p.id === ctxSession.petId || p.name.toLowerCase() === ctxSession.petName.toLowerCase())
    : pets.find(p => (hardware.assignedPetId && p.id === hardware.assignedPetId) || (hardware.assignedPetName && p.name.toLowerCase() === hardware.assignedPetName.toLowerCase()) || p.assignedDeviceId === hardware.id);

  const activeSession = ctxSession || (assignedPet ? ({
    id: `SES-${assignedPet.id}`,
    petId: assignedPet.id,
    petName: assignedPet.name,
    petSpecies: assignedPet.species,
    petBreed: assignedPet.breed || 'Domestic',
    petAvatarUrl: assignedPet.avatarUrl || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300',
    ownerId: assignedPet.ownerId || 'OWN-003',
    ownerName: assignedPet.ownerName || 'Marc Germine Ganan',
    deviceId: hardware.id || 'HN-NODE-F778',
    status: 'active' as const,
    admissionDate: (assignedPet as any)?.admissionDate || new Date().toISOString(),
    expectedReleaseDate: (assignedPet as any)?.expectedReleaseDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    startTime: (assignedPet as any)?.admissionDate || new Date().toISOString(),
    notes: 'Active station monitoring session',
    petSnapshot: {
      feedingPlan: {
        portionGrams: assignedPet.species?.toLowerCase() === 'cat' ? 35 : 100,
        targetKcal: 250,
      },
      hydrationTarget: assignedPet.species?.toLowerCase() === 'cat' ? 200 : 500,
    },
  } as unknown as PetSession) : null);
  const { adminProfile } = useAuth();

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const adminName = adminProfile?.full_name || 'Clinic Administrator';
  const completedSessionCount = getCompletedSessionCount();
  const activeSessionCount = activeSession ? 1 : 0;
  const petOwnersCount = (owners || []).length;

  // Active Malnutrition & Food Refusal Clinical Alerts
  const activeMalnutritionAlerts = (alerts || []).filter(a => {
    if (a.reviewStatus === 'Resolved') return false;
    const typeStr = (a.alertType || '').toLowerCase();
    const obsStr = (a.aiObservation || (a as any).message || '').toLowerCase();
    return (
      typeStr.includes('malnutrition') ||
      typeStr.includes('anorexia') ||
      typeStr.includes('refusal') ||
      obsStr.includes('refus') ||
      obsStr.includes('malnourish') ||
      obsStr.includes('not eating')
    );
  });

  // Feeding consumption trend (7-day)
  const feedingTrendData = [
    { day: 'Mon', actual: 180, target: 200 },
    { day: 'Tue', actual: 210, target: 200 },
    { day: 'Wed', actual: 195, target: 200 },
    { day: 'Thu', actual: 205, target: 200 },
    { day: 'Fri', actual: 190, target: 200 },
    { day: 'Sat', actual: 220, target: 200 },
    { day: 'Sun', actual: 200, target: 200 },
  ];

  // Hydration intake trend (7-day)
  const hydrationTrendData = [
    { day: 'Mon', intake: 450, target: 500 },
    { day: 'Tue', intake: 480, target: 500 },
    { day: 'Wed', intake: 520, target: 500 },
    { day: 'Thu', intake: 490, target: 500 },
    { day: 'Fri', intake: 510, target: 500 },
    { day: 'Sat', intake: 470, target: 500 },
    { day: 'Sun', intake: 500, target: 500 },
  ];

  const hasDeviceConnected = Boolean(hardware && (hardware.status === 'Online' || isUsbConnected));
  const isAutoRefillOn = Boolean(
    hardware?.autoRefillEnabled ?? (
      hardware?.firmwareVersion?.includes('AUTO:ON') &&
      !hardware?.firmwareVersion?.includes('AUTO:OFF')
    )
  );
  const isAutoFlushOn = Boolean(
    hardware?.autoFlushEnabled ?? (
      typeof window !== 'undefined'
        ? localStorage.getItem(`hn_auto_flush_${hardware?.id}`) !== '0'
        : true
    )
  );

  return (
    <DashboardLayout pageTitle="Clinical Operations Overview" breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="space-y-6">
        {/* ================= TOP METRIC CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Registered Pets"
            value={pets.length}
            subtitle="Active patient profiles"
            icon={Dog}
            iconBgColor="bg-blue-50"
            iconTextColor="text-blue-600"
            badgeText={pets.length > 0 ? 'Active Records' : 'Empty'}
            badgeType="info"
          />
          <StatCard
            title="Active Sessions"
            value={activeSessionCount}
            subtitle={activeSessionCount === 1 ? 'Station monitoring in progress' : 'Station available'}
            icon={Activity}
            iconBgColor="bg-indigo-50"
            iconTextColor="text-indigo-600"
            badgeText={activeSessionCount === 1 ? 'Occupied' : 'Vacant'}
            badgeType={activeSessionCount === 1 ? 'warning' : 'success'}
          />
          <StatCard
            title="Completed Sessions"
            value={completedSessionCount}
            subtitle="Total discharged patients"
            icon={CheckCircle}
            iconBgColor="bg-rose-50"
            iconTextColor="text-rose-600"
            badgeText="Archived"
            badgeType="info"
          />
          <StatCard
            title="Registered Pet Owners"
            value={petOwnersCount}
            subtitle="Community client profiles"
            icon={Heart}
            iconBgColor="bg-purple-50"
            iconTextColor="text-purple-600"
            badgeText="Clients"
            badgeType="success"
          />
        </div>

        {/* ================= CLINICAL MALNUTRITION & ANOREXIA WATCHDOG BANNER ================= */}
        {activeMalnutritionAlerts.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-red-300 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl shrink-0 backdrop-blur-xs">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-rose-900 text-[10px] font-black uppercase tracking-wider">
                    🚨 Urgent Doctor / Veterinary Notice
                  </span>
                  <span className="text-xs font-bold text-rose-100">
                    Patient Malnutrition &amp; Food Refusal Detected by AI
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Active Food Refusal Alert: {activeMalnutritionAlerts[0].petName}
                </h3>
                <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed max-w-3xl">
                  {activeMalnutritionAlerts[0].aiObservation || 'AI Vision Scan detected that this patient is refusing offered food and exhibiting clinical signs of anorexia or malnutrition. Attending veterinarians and the pet owner have both been notified.'}
                </p>
                <p className="text-[11px] font-bold text-amber-200 mt-1">
                  💡 Recommended Clinical Action: {activeMalnutritionAlerts[0].recommendedAction || 'Immediate examination by veterinarian. Evaluate metabolic, dental, or gastrointestinal etiology and monitor fluid balance.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 w-full md:w-auto">
              <Link
                to="/app/alerts"
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-900 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-rose-600" />
                Review AI Alerts
              </Link>
              {activeMalnutritionAlerts[0].petId && (
                <Link
                  to={`/app/pets/${activeMalnutritionAlerts[0].petId}`}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-900/80 text-white font-bold text-xs border border-rose-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Patient Profile
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ================= HARDWARE ASSIGNMENT CARD ================= */}
        <HardwareAssignmentCard
          onAssignClick={() => setAssignModalOpen(true)}
          onViewSession={() => navigate('/app/sessions')}
          onViewPet={(petId) => navigate('/app/pets/' + petId)}
          onCompleteSession={() => setCompleteModalOpen(true)}
          onCancelSession={() => setCancelModalOpen(true)}
        />

        {/* ================= DEVICE LEVELS QUICK VIEW ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Food Bowl Scale"
            value={hasDeviceConnected ? `${(hardware.foodBowlWeightGrams ?? 0).toFixed(1)} g` : 'N/A'}
            subtitle={
              !hasDeviceConnected
                ? 'No device active'
                : hardware.scaleReady === false
                ? 'HX711 Not Detected'
                : 'Live Load Cell (HX711)'
            }
            icon={Scale}
            iconBgColor="bg-emerald-50"
            iconTextColor="text-emerald-600"
            badgeText={
              !hasDeviceConnected
                ? 'Offline'
                : hardware.scaleReady === false
                ? 'Not Detected'
                : hardware.foodBowlWeightGrams && hardware.foodBowlWeightGrams > 3
                ? `${hardware.foodBowlWeightGrams.toFixed(0)}g Loaded`
                : '0.0g Ready'
            }
            badgeType={
              !hasDeviceConnected
                ? 'info'
                : hardware.scaleReady === false
                ? 'alert'
                : hardware.foodBowlWeightGrams && hardware.foodBowlWeightGrams > 3
                ? 'warning'
                : 'success'
            }
          />
          <StatCard
            title="Feeder Hopper (1kg)"
            value={hasDeviceConnected ? `${getDeviceFoodGrams(hardware)}g / 1kg` : 'N/A'}
            subtitle={hasDeviceConnected ? `Dispenser container (${hardware.foodLevelPct}% of 1kg)` : 'No device active'}
            icon={Utensils}
            iconBgColor="bg-orange-50"
            iconTextColor="text-orange-600"
            badgeText={hasDeviceConnected ? (hardware.foodLevelPct > 30 ? 'OK' : 'Low') : 'Offline'}
            badgeType={hasDeviceConnected ? (hardware.foodLevelPct > 30 ? 'success' : 'alert') : 'info'}
          />
          <StatCard
            title="Water Reservoir"
            value={hasDeviceConnected ? `${getDeviceWaterMl(hardware)} ml` : 'N/A'}
            subtitle={hasDeviceConnected ? 'Reservoir volume (2500 ml max)' : 'No device active'}
            icon={Droplets}
            iconBgColor="bg-sky-50"
            iconTextColor="text-sky-600"
            badgeText={hasDeviceConnected ? (getDeviceWaterMl(hardware) > 600 ? 'OK' : 'Low') : 'Offline'}
            badgeType={hasDeviceConnected ? (getDeviceWaterMl(hardware) > 600 ? 'success' : 'alert') : 'info'}
          />
          <StatCard
            title="Device Connection"
            value={
              hasDeviceConnected
                ? (isUsbConnected && hardware?.status === 'Online'
                    ? 'Dual (USB + Wi-Fi)'
                    : isUsbConnected
                    ? 'Flash Direct (USB)'
                    : 'Online (Wi-Fi)')
                : 'Offline'
            }
            subtitle={
              hasDeviceConnected
                ? (isUsbConnected && hardware?.status === 'Online'
                    ? `USB Active • Wi-Fi: ${hardware.wifiSsid || 'Connected'}`
                    : isUsbConnected
                    ? 'Direct USB Cable Link (Offline)'
                    : `Wi-Fi: ${hardware?.wifiSsid || 'Connected'} (${hardware?.wifiSignalDbm || -60} dBm)`)
                : 'No telemetry'
            }
            icon={isUsbConnected && hardware?.status === 'Online' ? Zap : isUsbConnected ? Usb : Wifi}
            iconBgColor={isUsbConnected && hardware?.status === 'Online' ? 'bg-gradient-to-r from-teal-50 to-indigo-50' : isUsbConnected ? 'bg-teal-50' : 'bg-indigo-50'}
            iconTextColor={isUsbConnected && hardware?.status === 'Online' ? 'text-teal-600' : isUsbConnected ? 'text-teal-600' : 'text-indigo-600'}
            badgeText={
              hasDeviceConnected
                ? (isUsbConnected && hardware?.status === 'Online'
                    ? 'Dual Active'
                    : isUsbConnected
                    ? 'Flash Direct'
                    : 'Wi-Fi Active')
                : 'Disconnected'
            }
            badgeType={hasDeviceConnected ? 'success' : 'alert'}
          />
          <StatCard
            title="Station Status"
            value={hasDeviceConnected ? (activeSession ? 'Occupied' : 'Vacant') : 'Standby'}
            subtitle={activeSession ? 'Patient: ' + activeSession.petName : 'Ready for assignment'}
            icon={Cpu}
            iconBgColor="bg-violet-50"
            iconTextColor="text-violet-600"
            badgeText={activeSession ? 'Monitoring' : 'Available'}
            badgeType={activeSession ? 'warning' : 'success'}
          />
        </div>

        {/* ================= DOCTOR TDS DRY ALERT BANNER ================= */}
        {hasDeviceConnected && (hardware.waterQualityPpm ?? 0) === 0 && (
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 flex items-center gap-2.5 animate-in fade-in shadow-xs">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-800 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block" />
            </div>
            <div>
              <p className="font-black text-amber-950 text-xs sm:text-sm">🚨 Attending Doctor / Staff Alert: Water Tank is Dry (0 PPM)</p>
              <p className="text-[11px] text-amber-800 mt-0.5">TDS sensor detects 0 PPM. Clean water tank reservoir is empty or dry. Attending doctor / veterinary staff please refill clean water tank.</p>
            </div>
          </div>
        )}

        {/* ================= QUICK HARDWARE ACTIONS BAR ================= */}
        {hasDeviceConnected && (
          <div className="clinic-card p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4 border border-slate-700/60 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Node Controls ({hardware.id})
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </h4>
                <p className="text-xs text-slate-300">Instant hardware actuation & auto-refill management</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => dispenseDirect(hardware.id, 75)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                title="Dispense 75g kibble (+90° / -90° cycle)"
              >
                <Utensils className="w-3.5 h-3.5" />
                Feed Food (90°)
              </button>

              <button
                onClick={() => dispenseWaterDirect(hardware.id, 10000)}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                title="Refill drinking water (10s pump active)"
              >
                <Droplets className="w-3.5 h-3.5" />
                Refill Drinking Water
              </button>

              <button
                onClick={() => stopPumpDirect(hardware.id)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                title="Emergency stop water pump relay"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                Stop Pump
              </button>

              <button
                onClick={() => toggleAutoRefillDirect(hardware.id, !isAutoRefillOn)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  isAutoRefillOn
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
                }`}
                title="Toggle automated water refilling (refills bowl up to 150ml)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Auto-Refill: {isAutoRefillOn ? 'ENABLED (150ml)' : 'DISABLED'}
              </button>

              <button
                onClick={() => toggleAutoFlushDirect(hardware.id, !isAutoFlushOn)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  isAutoFlushOn
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 hover:bg-purple-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30'
                }`}
                title="Toggle 5-minute automated food bowl flush watchdog (Turn Auto-Flush ON or AUTO OFF)"
              >
                {isAutoFlushOn ? (
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                ) : (
                  <PowerOff className="w-3.5 h-3.5 text-amber-300" />
                )}
                Auto-Flush: {isAutoFlushOn ? 'ENABLED (5m)' : 'AUTO OFF'}
              </button>

              <button
                onClick={() => tareScaleDirect(hardware.id)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                title="Zero / Tare the Food Bowl Weight Scale"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Bowl: {typeof hardware.foodBowlWeightGrams === 'number' ? hardware.foodBowlWeightGrams.toFixed(1) : '0.0'}g (Tare)
              </button>
            </div>
          </div>
        )}

        {/* ================= AI PET BEHAVIOR LEARNING CENTER ================= */}
        <AiLearningCenterWidget pet={assignedPet || pets[0]} />

        {/* ================= LIVE PET WARD CAMERA FEED ================= */}
        <LiveCameraWidget
          title="Live Clinic Ward & Bowl Camera Feed"
          subtitle="Real-Time 30 FPS Stream • ESP32-CAM Node"
          device={hardware}
        />

        {/* ================= CHARTS SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <ChartCard
              title="Weekly Food Dispensation"
              subtitle="Actual vs. prescribed portion (grams)"
              badge="Last 7 Days"
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={feedingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} unit="g" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="actual" fill="#0d9488" radius={[6, 6, 0, 0]} name="Dispensed (g)" />
                  <Bar dataKey="target" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Prescribed (g)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="lg:col-span-6">
            <ChartCard
              title="Weekly Hydration Volume"
              subtitle="Daily water consumption (milliliters)"
              badge="Target: 500 ml/day"
            >
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={hydrationTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overviewHydration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} unit="ml" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Area type="monotone" dataKey="intake" stroke="#0284c7" strokeWidth={2.5} fill="url(#overviewHydration)" name="Intake (ml)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* ================= HARDWARE DEVICE & RECENT ACTIVITY ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-rose-600" />
                HydroNourish Hardware Node
              </h3>
              <Link to="/app/devices" className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1">
                Manage Device <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="clinic-card overflow-hidden bg-white border border-slate-200/80">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-mono text-xs font-bold border border-rose-200">
                    {hardware.id}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">{hardware.deviceName}</span>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded text-[10px]">
                        <Wifi className="w-3 h-3 text-indigo-600" />
                        {hardware.wifiSsid || 'GlobeAtHome_F83DB'}
                      </span>
                      <span>({hardware.wifiSignalDbm} dBm)</span>
                      <span>•</span>
                      <span>Battery: {hardware.batteryPct}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={hardware.status} size="sm" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-center">
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Food Hopper (1kg)</span><span className="font-bold text-slate-800 font-mono">{getDeviceFoodGrams(hardware)}g ({hardware.foodLevelPct}%)</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Water Volume</span><span className="font-bold text-slate-800">{getDeviceWaterMl(hardware)} ml</span></div>
                <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Assignment</span><span className="font-bold text-rose-700">{hardware.assignedPetName || 'Vacant'}</span></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Recent Dispense & Intake Records
              </h3>
              <Link to="/app/feeding" className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1">
                View Logs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="clinic-card p-4 space-y-3 bg-white border border-slate-200/80">
              {(feedingLogs || []).slice(0, 3).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="font-bold text-slate-900">{log.petName} Dispensed {log.portionGrams}g</p>
                      <p className="text-[10px] text-slate-400">{log.dispensedAt}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {log.status}
                  </span>
                </div>
              ))}
              {(feedingLogs || []).length === 0 && (
                <p className="text-center py-6 text-slate-400 italic text-xs">No feeding records logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Pet / Start Session Modal */}
      <AssignPetOwnerModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
      />

      {/* Complete Session Modal */}
      <CompleteSessionModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
      />

      {/* Cancel Session Modal */}
      <CancelSessionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
      />
    </DashboardLayout>
  );
};
