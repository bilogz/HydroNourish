import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { ChartCard } from '../components/ChartCard';
import { AlertCard } from '../components/AlertCard';
import { Modal } from '../components/Modal';
import { useAppContext } from '../hooks/useAppContext';
import { useSession } from '../contexts/SessionContext';
import { PetSession } from '../types';
import {
  Dog,
  Cat,
  Utensils,
  Droplets,
  Activity,
  Cpu,
  UserCheck,
  Phone,
  Thermometer,
  Heart,
  Weight,
  Calendar,
  ShieldAlert,
  Clock,
  Wifi,
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  FileText,
  History,
  Eye,
  Plus,
  Sparkles,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  formatWeight,
  formatTemperature,
  formatHeartRate,
  formatHydration
} from '../utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const PetProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pets, devices, alerts, feedingLogs, hydrationLogs, updatePet, showToast } = useAppContext();
  const { sessions, activeSession } = useSession();

  // Find pet by ID or fallback to first pet safely
  const pet = (pets ?? []).find(p => p.id === id) ?? (pets ?? [])[0];
  const assignedDevice = pet ? (devices ?? []).find(d => d.id === pet.assignedDeviceId) : undefined;
  const petAlerts = pet ? (alerts ?? []).filter(a => a.petId === pet.id) : [];
  const petFeedingLogs = pet ? (feedingLogs ?? []).filter(f => f.petId === pet.id) : [];
  const petHydrationLogs = pet ? (hydrationLogs ?? []).filter(h => h.petId === pet.id) : [];

  // Local Note Edit State
  const [noteText, setNoteText] = useState(pet?.notes || '');

  // Session Inspection Modal
  const [selectedSessionModal, setSelectedSessionModal] = useState<PetSession | null>(null);

  const handleSaveNotes = () => {
    if (!pet) return;
    updatePet(pet.id, { notes: noteText });
    showToast('success', 'Notes Saved', `Clinical notes for ${pet.name} updated.`);
  };

  // Sessions associated with this pet
  const petSessions = useMemo(() => {
    if (!pet) return [];
    return (sessions || []).filter(
      (s) => s.petId === pet.id || s.petName?.toLowerCase() === pet.name?.toLowerCase()
    );
  }, [sessions, pet]);

  const currentActiveSession = useMemo(() => {
    return petSessions.find((s) => s.status === 'active') || (activeSession?.petId === pet?.id ? activeSession : null);
  }, [petSessions, activeSession, pet]);

  // Telemetry Consumption Trend Chart Data for this specific pet
  const feedingHydrationTrendData = useMemo(() => {
    if (!pet) return [];
    return [
      { date: 'Jul 21', foodGrams: pet.feedingPlan?.portionGrams || 100, waterMl: Math.round((pet.hydrationTarget || 500) * 0.85) },
      { date: 'Jul 22', foodGrams: (pet.feedingPlan?.portionGrams || 100) + 10, waterMl: Math.round((pet.hydrationTarget || 500) * 0.9) },
      { date: 'Jul 23', foodGrams: pet.feedingPlan?.portionGrams || 100, waterMl: Math.round((pet.hydrationTarget || 500) * 0.95) },
      { date: 'Jul 24', foodGrams: pet.feedingPlan?.portionGrams || 100, waterMl: pet.hydrationTarget || 500 },
      { date: 'Jul 25', foodGrams: (pet.feedingPlan?.portionGrams || 100) - 5, waterMl: Math.round((pet.hydrationTarget || 500) * 1.02) },
      { date: 'Jul 26', foodGrams: pet.feedingPlan?.portionGrams || 100, waterMl: Math.round((pet.hydrationTarget || 500) * 0.98) },
      { date: 'Jul 27', foodGrams: pet.feedingPlan?.portionGrams || 100, waterMl: pet.hydrationTarget || 500 }
    ];
  }, [pet]);

  const waterHistoryChartData = [
    { day: 'Mon', ml: 420 },
    { day: 'Tue', ml: 480 },
    { day: 'Wed', ml: 510 },
    { day: 'Thu', ml: 490 },
    { day: 'Fri', ml: 530 },
    { day: 'Sat', ml: 550 },
    { day: 'Sun', ml: 600 }
  ];

  const formatDuration = (start: string, end: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffHrs = Math.max(0, (endTime - startTime) / (1000 * 60 * 60));
    if (diffHrs < 1) return Math.round(diffHrs * 60) + ' mins';
    if (diffHrs < 24) return diffHrs.toFixed(1) + ' hrs';
    return (diffHrs / 24).toFixed(1) + ' days';
  };

  if (!pet) {
    return (
      <DashboardLayout pageTitle="Pet Profile" breadcrumbs={[{ label: 'Pets', href: '/app/pets' }, { label: 'Not Found' }]}>
        <div className="clinic-card p-12 text-center space-y-4">
          <Dog className="w-12 h-12 mx-auto text-slate-300" />
          <h2 className="text-lg font-black text-slate-900">Pet Record Not Found</h2>
          <p className="text-xs text-slate-500">The requested patient profile does not exist or has been removed.</p>
          <button onClick={() => navigate('/app/pets')} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold">
            Return to Pets Directory
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle={`${pet.name}'s Clinical Health Profile`}
      breadcrumbs={[{ label: 'Pets', href: '/app/pets' }, { label: pet.name }]}
    >
      <div className="space-y-6">
        {/* Back Button Link */}
        <div>
          <button
            onClick={() => navigate('/app/pets')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pets Directory
          </button>
        </div>

        {/* ================= HEADER CARD ================= */}
        <div className="clinic-card p-6 bg-gradient-to-r from-white via-slate-50 to-rose-50/40 border border-slate-200/80 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={pet.avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                alt={pet.name}
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-rose-500/20 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{pet.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-xs font-bold">
                    {pet.id}
                  </span>
                  <StatusBadge status={pet.healthStatus} />
                  {currentActiveSession && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Active Smart Cage Stay
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {pet.species} • {pet.breed} • {pet.age} Years Old • {pet.sex || 'Male'}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Owner: <strong className="text-slate-800">{pet.ownerName}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {pet.ownerPhone}
                  </span>
                  <span className="text-slate-400">Clinic Ref: <strong className="text-slate-700">{pet.clinicRef}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Link
                to="/app/feeding"
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Utensils className="w-4 h-4" />
                Feeding Plan
              </Link>
              <Link
                to="/app/hydration"
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Droplets className="w-4 h-4" />
                Hydration Gauge
              </Link>
              <Link
                to="/app/sessions"
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <History className="w-4 h-4" />
                All Sessions
              </Link>
            </div>
          </div>
        </div>

        {/* ================= METRICS STATS GRID ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="clinic-card p-5 space-y-1 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-rose-600" />
              Assigned Smart Cage
            </span>
            <div className="text-xl font-extrabold text-rose-600">
              {currentActiveSession ? currentActiveSession.deviceId : (pet.assignedDeviceId || 'Unassigned')}
            </div>
            <p className="text-[11px] text-slate-500">
              {currentActiveSession ? '🟢 Actively connected station' : 'Automated Feeder & Hydrator Node'}
            </p>
          </div>

          <div className="clinic-card p-5 space-y-1 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              Food Hopper Level
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              {assignedDevice ? `${assignedDevice.foodLevelPct}%` : '80%'}
            </div>
            <p className="text-[11px] text-slate-500">Automated timed kibble dispenser</p>
          </div>

          <div className="clinic-card p-5 space-y-1 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              Water Reservoir Level
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              {assignedDevice ? `${assignedDevice.waterLevelPct}%` : '85%'}
            </div>
            <p className="text-[11px] text-slate-500">Filtered fountain reservoir</p>
          </div>

          <div className="clinic-card p-5 space-y-1 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Weight className="w-3.5 h-3.5 text-indigo-600" />
              Current Weight
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              {formatWeight(pet.weight)}
            </div>
            <p className="text-[11px] text-slate-500">Target Weight: {formatWeight(pet.weight)}</p>
          </div>
        </div>

        {/* ================= CLINICAL STAY & SESSION HISTORY (NEW FEATURE) ================= */}
        <div className="clinic-card p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-rose-600" />
                Clinical Monitoring Stays &amp; Discharge History
              </h3>
              <p className="text-xs text-slate-500">
                Track full telemetry intake logs, release conditions, and veterinary notes across all past and active sessions for {pet.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                {petSessions.length} Total {petSessions.length === 1 ? 'Stay' : 'Stays'} on Record
              </span>
            </div>
          </div>

          {/* Active Session Highlight Banner */}
          {currentActiveSession && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                    🟢 Active Session Now
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-300">ID: {currentActiveSession.id}</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Currently admitted to {currentActiveSession.deviceId} since {new Date(currentActiveSession.admissionDate).toLocaleString()}
                </h4>
                <p className="text-xs text-slate-300">
                  Duration so far: <strong className="text-emerald-400">{formatDuration(currentActiveSession.startTime, null)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSessionModal(currentActiveSession)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  View Live Stay Telemetry
                </button>
              </div>
            </div>
          )}

          {/* Past Sessions List */}
          {petSessions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-slate-700 font-bold text-xs">No historical monitoring stays recorded yet for {pet.name}.</p>
              <p className="text-slate-400 text-[11px]">
                When {pet.name} is assigned to the HydroNourish cage, all telemetry, feeding logs, and discharge notes will be permanently archived here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {petSessions.map((session) => {
                const isOngoing = session.status === 'active';
                return (
                  <div
                    key={session.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 text-xs">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                          {session.id}
                        </span>
                        <span className="font-bold text-slate-800">
                          Cage Unit: <strong className="text-rose-600">{session.deviceId}</strong>
                        </span>
                        <StatusBadge status={session.status} size="sm" />
                        {session.releaseCondition && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            Condition: {session.releaseCondition}
                          </span>
                        )}
                      </div>

                      <div className="text-slate-500 text-[11px] flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Stay Duration: <strong>{formatDuration(session.startTime, session.releaseTime)}</strong></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission Date</span>
                        <span className="font-bold text-slate-800">{new Date(session.admissionDate).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 block">{new Date(session.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Discharge / Release</span>
                        <span className="font-bold text-slate-800">
                          {session.releaseTime ? new Date(session.releaseTime).toLocaleDateString() : (isOngoing ? '🟢 Currently Active' : 'N/A')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {session.releaseTime ? new Date(session.releaseTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isOngoing ? 'Ongoing Stay' : '')}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Diet &amp; Water Telemetry</span>
                        <div className="flex items-center gap-2 font-bold text-slate-800 mt-0.5">
                          <span className="text-orange-600 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5" /> {session.feedingRecordCount} meals
                          </span>
                          <span className="text-sky-600 flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5" /> {session.hydrationRecordCount} logs
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Health Alerts</span>
                        <span className="font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                          {session.alertCount} Observations Logged
                        </span>
                      </div>
                    </div>

                    {/* Discharge Notes */}
                    {(session.finalNotes || session.notes || session.cancelledReason) && (
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 block mb-0.5">
                            {session.status === 'completed' ? 'Clinical Discharge Notes & Instructions:' : (session.status === 'cancelled' ? 'Cancellation Reason:' : 'Admission Clinical Remarks:')}
                          </span>
                          <p className="text-slate-600 italic">"{session.finalNotes || session.cancelledReason || session.notes}"</p>
                          {session.completedBy && (
                            <p className="text-[10px] text-slate-400 mt-1">Signed by: <strong className="text-slate-600">{session.completedBy}</strong></p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setSelectedSessionModal(session)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Full Stay Summary
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= ASSIGNED DEVICE & PLANS SUMMARY ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Node Card */}
          <div className="clinic-card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-600" />
                Assigned Smart Cage Node
              </h3>
              {assignedDevice && <StatusBadge status={assignedDevice.status} size="sm" />}
            </div>
            {assignedDevice ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cage Unit:</span>
                  <span className="font-mono font-bold text-rose-600">{assignedDevice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Firmware:</span>
                  <span className="font-semibold text-slate-800">{assignedDevice.firmwareVersion}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Connected Wi-Fi:</span>
                  <span className="font-semibold text-indigo-700 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                    <Wifi className="w-3 h-3 text-indigo-600" />
                    {assignedDevice.wifiSsid || 'brrt rrt'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wi-Fi Signal:</span>
                  <span className="font-semibold text-slate-800">{assignedDevice.wifiSignalDbm} dBm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reservoir Water Level:</span>
                  <span className="font-semibold text-sky-600">{assignedDevice.waterLevelPct}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No device currently linked.</p>
            )}
          </div>

          {/* Feeding Plan Summary */}
          <div className="clinic-card p-5 space-y-3 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600" />
              Dietary Feeding Plan
            </h3>
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-800">Formula:</span>
                <span className="font-bold text-emerald-950">{pet.feedingPlan?.foodType || 'Standard Dry Kibble'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800">Portion Size:</span>
                <span className="font-bold text-emerald-950">{pet.feedingPlan?.portionGrams || 120}g per serving</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800">Frequency:</span>
                <span className="font-bold text-emerald-950">{pet.feedingPlan?.timesPerDay || 2}x daily</span>
              </div>
            </div>
          </div>

          {/* Hydration Target Summary */}
          <div className="clinic-card p-5 space-y-3 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-600" />
              Hydration Target
            </h3>
            <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-sky-800">Daily Target:</span>
                <span className="font-bold text-sky-950">{formatHydration(pet.hydrationTarget || 500)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-800">Hydration Rate:</span>
                <span className="font-bold text-sky-950">~50 ml per kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-800">Dispenser Flow:</span>
                <span className="font-bold text-sky-950">Ultra-Pure UV Filtered</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CHARTS SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ChartCard title="Automated Dispense & Consumption Telemetry" subtitle="Food Served (g) & Water Consumed (ml)">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feedingHydrationTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="foodGrams" name="Food Dispensed (g)" stroke="#0d9488" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="waterMl" name="Water Intake (ml)" stroke="#0284c7" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="lg:col-span-5">
            <ChartCard title="Weekly Hydration Intake" subtitle="Daily ml consumed">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterHistoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="ml" name="Consumed (ml)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* ================= ALERTS & VETERINARY NOTES ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Alerts for this pet */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Recent AI Observations for {pet.name}
            </h3>
            {(petAlerts ?? []).length === 0 ? (
              <div className="clinic-card p-6 text-center text-xs text-slate-400 bg-white">
                No active AI health alerts logged for {pet.name}.
              </div>
            ) : (
              <div className="space-y-3">
                {(petAlerts ?? []).map(alert => (
                  <AlertCard key={alert.id} alert={alert} compact={false} />
                ))}
              </div>
            )}
          </div>

          {/* Clinical Notes Editor */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              Veterinary Clinical Notes
            </h3>
            <div className="clinic-card p-5 space-y-4 bg-white">
              <textarea
                rows={6}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="w-full p-3 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                placeholder="Enter detailed clinical observation notes..."
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: DETAILED STAY / SESSION RECORD ================= */}
      <Modal
        isOpen={!!selectedSessionModal}
        onClose={() => setSelectedSessionModal(null)}
        title={selectedSessionModal ? `Stay Record ${selectedSessionModal.id}` : 'Stay Details'}
        subtitle={`Discharge Summary & Telemetry Log for ${pet.name}`}
        maxWidth="lg"
      >
        {selectedSessionModal && (
          <div className="space-y-5 text-xs">
            {/* Patient Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <img
                src={selectedSessionModal.petAvatarUrl || pet.avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                alt={selectedSessionModal.petName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500/20 border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-black text-slate-900">{selectedSessionModal.petName}</h4>
                  <StatusBadge status={selectedSessionModal.status} size="sm" />
                  {selectedSessionModal.releaseCondition && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                      {selectedSessionModal.releaseCondition}
                    </span>
                  )}
                </div>
                <p className="text-slate-500">{selectedSessionModal.petSpecies} • {selectedSessionModal.petBreed}</p>
                <p className="text-slate-600 mt-0.5">
                  Owner: <strong className="text-slate-800">{selectedSessionModal.ownerName}</strong> ({selectedSessionModal.ownerEmail})
                </p>
              </div>
            </div>

            {/* Timeline Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Device</span>
                <span className="font-bold text-rose-700">{selectedSessionModal.deviceId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission Date</span>
                <span className="font-bold text-slate-800">{new Date(selectedSessionModal.admissionDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Discharge Date</span>
                <span className="font-bold text-slate-800">
                  {selectedSessionModal.releaseTime ? new Date(selectedSessionModal.releaseTime).toLocaleDateString() : 'Active Stay'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Stay Duration</span>
                <span className="font-black text-slate-900">{formatDuration(selectedSessionModal.startTime, selectedSessionModal.releaseTime)}</span>
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200">
                <Utensils className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                <p className="text-xl font-black text-slate-900">
                  {selectedSessionModal.totalFoodGrams || (selectedSessionModal.feedingRecordCount * 120)}g
                </p>
                <p className="text-[10px] text-slate-600 font-bold uppercase">{selectedSessionModal.feedingRecordCount} Meals Served</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200">
                <Droplets className="w-5 h-5 mx-auto mb-1 text-sky-600" />
                <p className="text-xl font-black text-slate-900">
                  {selectedSessionModal.totalWaterMl || (selectedSessionModal.hydrationRecordCount * 250)}ml
                </p>
                <p className="text-[10px] text-slate-600 font-bold uppercase">{selectedSessionModal.hydrationRecordCount} Water Intakes</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <ShieldAlert className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <p className="text-xl font-black text-slate-900">{selectedSessionModal.alertCount}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase">AI Observations</p>
              </div>
            </div>

            {/* Notes Section */}
            {selectedSessionModal.finalNotes && (
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block text-[11px] uppercase">
                  Veterinary Discharge Instructions &amp; Follow-up:
                </span>
                <p className="text-emerald-950">{selectedSessionModal.finalNotes}</p>
                {selectedSessionModal.completedBy && (
                  <p className="text-[10px] text-emerald-800 mt-1 font-semibold">
                    Discharged by: {selectedSessionModal.completedBy}
                  </p>
                )}
              </div>
            )}

            {selectedSessionModal.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block text-[11px] uppercase">
                  Admission Notes:
                </span>
                <p className="text-slate-600">{selectedSessionModal.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Stay Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};
