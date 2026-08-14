import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';
import { AlertCard } from '../components/AlertCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Modal } from '../components/Modal';
import { HardwareAssignmentCard } from '../components/session/HardwareAssignmentCard';
import { AssignPetOwnerModal } from '../components/session/AssignPetOwnerModal';
import { CompleteSessionModal } from '../components/session/CompleteSessionModal';
import { CancelSessionModal } from '../components/session/CancelSessionModal';
import { LiveCameraWidget } from '../components/LiveCameraWidget';
import { useAppContext } from '../hooks/useAppContext';
import { useSession } from '../contexts/SessionContext';
import {
  Dog,
  Utensils,
  Droplets,
  Cpu,
  ShieldAlert,
  Activity,
  Clock,
  ChevronRight,
  Plus,
  Heart,
  Thermometer,
  Zap,
  RefreshCw,
  ClipboardList,
  CheckCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  weeklyFeedingData,
  dailyHydrationData,
  vitalSignsTrendData,
  recentSystemActivity
} from '../data/mockData';

export const OverviewPage: React.FC = () => {
  const { pets, devices, alerts, showToast } = useAppContext();
  const { activeSession, hardware, getCompletedSessionCount, activityLogs } = useSession();
  const navigate = useNavigate();

  // Skeleton loading simulation state
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Quick Action Modals
  const [quickVitalModalOpen, setQuickVitalModalOpen] = useState(false);
  const [quickDispenseModalOpen, setQuickDispenseModalOpen] = useState(false);

  // Quick Vital Form State
  const [vitalForm, setVitalForm] = useState({
    petId: (pets ?? [])[0]?.id ?? '',
    temperature: 38.5,
    heartRate: 90,
    weight: 10,
    status: 'Normal' as 'Normal' | 'Warning' | 'Critical'
  });

  // Quick Dispense Form State
  const [dispenseForm, setDispenseForm] = useState({
    petId: (pets ?? [])[0]?.id ?? '',
    grams: 100,
    foodType: 'High-Protein Kibble'
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickVitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = (pets ?? []).find(p => p.id === vitalForm.petId) ?? (pets ?? [])[0];
    if (!pet) return;
    showToast('success', 'Vital Record Logged', `Logged ${vitalForm.temperature}°C & ${vitalForm.heartRate} bpm for ${pet.name}.`);
    setQuickVitalModalOpen(false);
  };

  const handleQuickDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = (pets ?? []).find(p => p.id === dispenseForm.petId) ?? (pets ?? [])[0];
    if (!pet) return;
    showToast('success', 'Manual Dispense Sent', `Dispensed ${dispenseForm.grams}g of ${dispenseForm.foodType} for ${pet.name}.`);
    setQuickDispenseModalOpen(false);
  };

  const activeAlertsCount = (alerts || []).filter(a => a.reviewStatus !== 'Resolved').length;
  const completedSessionCount = getCompletedSessionCount();
  const activeSessionCount = activeSession ? 1 : 0;
  const hwStatusLabel = (hardware && hardware.hardwareStatus) ? (hardware.hardwareStatus.charAt(0).toUpperCase() + hardware.hardwareStatus.slice(1)) : 'Available';
  const activeOnlineDev = (devices ?? []).find(d => d.status === 'Online' && d.id !== 'No Device Connected');
  const hasDeviceConnected = Boolean(activeOnlineDev || (hardware && hardware.status === 'Online' && hardware.id !== 'No Device Connected'));

  // Recent activity from session context
  const recentLogs = activityLogs.slice(0, 6);

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Clinic Overview Dashboard">
        <LoadingSkeleton type="page" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Clinic Overview Dashboard">
      {/* Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white shadow-lg">
        <div>
          <h2 className="text-base font-extrabold tracking-tight">Heritage Animal Clinic Command Center</h2>
          <p className="text-xs text-slate-300">Single-device monitoring • HydroNourish Station Alpha</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setQuickVitalModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Heart className="w-4 h-4" />
            Quick Record Vitals
          </button>
          <button
            onClick={() => setQuickDispenseModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Utensils className="w-4 h-4" />
            Quick Manual Dispense
          </button>
        </div>
      </div>

      {/* ================= SINGLE-DEVICE STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          title="Hardware Status"
          value={hasDeviceConnected ? hwStatusLabel : 'Offline'}
          subtitle="Smart Cage Node Array"
          icon={Cpu}
          iconBgColor={hasDeviceConnected ? (hardware.hardwareStatus === 'available' ? 'bg-emerald-50' : hardware.hardwareStatus === 'occupied' ? 'bg-indigo-50' : 'bg-amber-50') : 'bg-slate-100'}
          iconTextColor={hasDeviceConnected ? (hardware.hardwareStatus === 'available' ? 'text-emerald-600' : hardware.hardwareStatus === 'occupied' ? 'text-indigo-600' : 'text-amber-600') : 'text-slate-400'}
          badgeText={hasDeviceConnected ? hardware.status : 'Offline'}
          badgeType={hasDeviceConnected ? (hardware.status === 'Online' ? 'success' : 'alert') : 'alert'}
        />
        <StatCard
          title="Current Pet"
          value={activeSession?.petName || 'None'}
          subtitle={activeSession ? `${activeSession.petSpecies} • ${activeSession.petBreed}` : 'No pet assigned'}
          icon={Dog}
          iconBgColor="bg-teal-50"
          iconTextColor="text-teal-600"
          badgeText={activeSession ? 'Monitoring' : 'Available'}
          badgeType={activeSession ? 'info' : 'success'}
        />
        <StatCard
          title="Active Sessions"
          value={activeSessionCount}
          subtitle={activeSessionCount === 1 ? 'Session in progress' : 'Hardware available'}
          icon={Activity}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
          badgeText={activeSessionCount === 1 ? 'Active' : 'None'}
          badgeType={activeSessionCount === 1 ? 'warning' : 'info'}
        />
        <StatCard
          title="Completed Sessions"
          value={completedSessionCount}
          subtitle="Total archived sessions"
          icon={CheckCircle}
          iconBgColor="bg-teal-50"
          iconTextColor="text-teal-600"
          badgeText="Archived"
          badgeType="info"
        />
        <StatCard
          title="Active Health Alerts"
          value={activeAlertsCount}
          subtitle="Needs Vet Action"
          icon={ShieldAlert}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          badgeText="Review Required"
          badgeType="alert"
        />
      </div>

      {/* ================= HARDWARE ASSIGNMENT CARD ================= */}
      <HardwareAssignmentCard
        onAssignClick={() => setAssignModalOpen(true)}
        onViewSession={() => navigate('/app/sessions')}
        onViewPet={(petId) => navigate(`/app/pets/${petId}`)}
        onCompleteSession={() => setCompleteModalOpen(true)}
        onCancelSession={() => setCancelModalOpen(true)}
      />

      {/* ================= DEVICE LEVELS QUICK VIEW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Food Container"
          value={hasDeviceConnected ? `${hardware.foodLevelPct}%` : 'N/A'}
          subtitle={hasDeviceConnected ? 'Current food level' : 'No device connected'}
          icon={Utensils}
          iconBgColor="bg-orange-50"
          iconTextColor="text-orange-600"
          badgeText={hasDeviceConnected ? (hardware.foodLevelPct > 30 ? 'OK' : 'Low') : 'Offline'}
          badgeType={hasDeviceConnected ? (hardware.foodLevelPct > 30 ? 'success' : 'alert') : 'neutral'}
        />
        <StatCard
          title="Water Container"
          value={hasDeviceConnected ? `${hardware.waterLevelPct}%` : 'N/A'}
          subtitle={hasDeviceConnected ? 'Current water level' : 'No device connected'}
          icon={Droplets}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-600"
          badgeText={hasDeviceConnected ? (hardware.waterLevelPct > 30 ? 'OK' : 'Low') : 'Offline'}
          badgeType={hasDeviceConnected ? (hardware.waterLevelPct > 30 ? 'success' : 'alert') : 'neutral'}
        />
        <StatCard
          title="Device Last Seen"
          value={hasDeviceConnected ? hardware.lastTransmission : 'Never'}
          subtitle={hasDeviceConnected ? `Wi-Fi: ${hardware.wifiSignalDbm} dBm` : 'No node active'}
          icon={Zap}
          iconBgColor="bg-violet-50"
          iconTextColor="text-violet-600"
          badgeText={hasDeviceConnected ? hardware.status : 'Offline'}
          badgeType={hasDeviceConnected ? 'success' : 'alert'}
        />
        <StatCard
          title="Active Health Alerts"
          value={activeAlertsCount}
          subtitle="Unresolved observations"
          icon={ShieldAlert}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          badgeText={activeAlertsCount > 0 ? 'Action Needed' : 'All Clear'}
          badgeType={activeAlertsCount > 0 ? 'alert' : 'success'}
        />
      </div>

      {/* ================= LIVE PET WARD CAMERA FEED ================= */}
      <LiveCameraWidget
        title="Live Clinic Ward & Bowl Camera Feed"
        subtitle="Real-Time 30 FPS Stream • ESP32-CAM Node"
      />

      {/* ================= CHARTS SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ChartCard
            title="Weekly Feeding Dispense Volume"
            subtitle="Scheduled vs Actual grams served per day"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFeedingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                />
                <Bar dataKey="scheduledGrams" name="Scheduled (g)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dispensedGrams" name="Dispensed (g)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="lg:col-span-6">
          <ChartCard
            title="Daily Water Intake Rate"
            subtitle="Cumulative ml consumed vs target curve"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHydrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hydrationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="ml" name="Consumed (ml)" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#hydrationGrad)" />
                <Line type="monotone" dataKey="target" name="Target (ml)" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Vital-Sign Trends Chart */}
      <ChartCard
        title="Patient Vital-Sign Trends (Temperature & Heart Rate)"
        subtitle="Sample telemetry trend lines for high-priority patients"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={vitalSignsTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="maxTemp" name="Max Temp (°C)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="bellaTemp" name="Bella Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="lunaTemp" name="Luna Temp (°C)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ================= PANELS GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Active AI Health Alerts
            </h3>
            <Link to="/app/alerts" className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {(alerts ?? []).slice(0, 2).map(alert => (
              <AlertCard key={alert.id} alert={alert} compact={false} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              HydroNourish Device
            </h3>
            <Link to="/app/devices" className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
              Manage Device <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="clinic-card overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 font-mono text-xs font-bold">
                  {hardware.id}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900">{hardware.deviceName}</span>
                  <p className="text-[11px] text-slate-500">Wi-Fi: {hardware.wifiSignalDbm} dBm • Battery: {hardware.batteryPct}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="block font-semibold text-slate-700">Water: {hardware.waterLevelPct}%</span>
                  <span className="text-[11px] text-slate-400">Food: {hardware.foodLevelPct}%</span>
                </div>
                <StatusBadge status={hardware.status} size="sm" />
              </div>
            </div>
            {activeSession && (
              <div className="px-4 py-3 border-t border-slate-100 bg-indigo-50/50 text-xs flex items-center gap-2">
                <Dog className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-indigo-700">Currently assigned to <strong>{activeSession.petName}</strong> ({activeSession.ownerName})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="clinic-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Recent Clinic Activity Log
          </h3>
          <span className="text-xs text-slate-500">Session & system events</span>
        </div>

        <div className="space-y-3">
          {recentLogs.length > 0 ? recentLogs.map(log => (
            <div key={log.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${log.result === 'success' ? 'bg-teal-500' : log.result === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <div>
                  <span className="font-semibold text-slate-800">
                    {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {log.petName && <span className="text-slate-500"> • {log.petName}</span>}
                  {log.ownerName && <span className="text-slate-400"> ({log.ownerName})</span>}
                  {log.details && <span className="text-slate-400 ml-1">— {log.details}</span>}
                </div>
              </div>
              <span className="text-slate-400 flex items-center gap-1 font-medium shrink-0">
                <Clock className="w-3.5 h-3.5" />
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          )) : (
            // Fallback to static activity
            recentSystemActivity.map(act => (
              <div key={act.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="font-semibold text-slate-800">{act.text}</span>
                </div>
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {act.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QUICK VITAL ENTRY MODAL */}
      <Modal
        isOpen={quickVitalModalOpen}
        onClose={() => setQuickVitalModalOpen(false)}
        title="Quick Record Vital Signs"
        subtitle="Heritage Animal Clinic Telemetry Intake"
      >
        <form onSubmit={handleQuickVitalSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
            <select
              value={vitalForm.petId}
              onChange={e => setVitalForm({ ...vitalForm, petId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
            >
              {(pets ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.id})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Body Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitalForm.temperature}
                onChange={e => setVitalForm({ ...vitalForm, temperature: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={vitalForm.heartRate}
                onChange={e => setVitalForm({ ...vitalForm, heartRate: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setQuickVitalModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold"
            >
              Save Vital Record
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK DISPENSE MODAL */}
      <Modal
        isOpen={quickDispenseModalOpen}
        onClose={() => setQuickDispenseModalOpen(false)}
        title="Quick Feeder Manual Command"
        subtitle="ESP32 Servo Dispense Trigger"
      >
        <form onSubmit={handleQuickDispenseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
            <select
              value={dispenseForm.petId}
              onChange={e => setDispenseForm({ ...dispenseForm, petId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
            >
              {(pets ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Portion Grams</label>
              <input
                type="number"
                min="10"
                max="500"
                value={dispenseForm.grams}
                onChange={e => setDispenseForm({ ...dispenseForm, grams: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Food Type</label>
              <input
                type="text"
                value={dispenseForm.foodType}
                onChange={e => setDispenseForm({ ...dispenseForm, foodType: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setQuickDispenseModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold"
            >
              Send Dispense Command
            </button>
          </div>
        </form>
      </Modal>

      {/* SESSION MODALS */}
      <AssignPetOwnerModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => setAssignModalOpen(false)}
      />
      <CompleteSessionModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onSuccess={() => setCompleteModalOpen(false)}
      />
      <CancelSessionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={() => setCancelModalOpen(false)}
      />
    </DashboardLayout>
  );
};
