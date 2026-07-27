import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { ChartCard } from '../components/ChartCard';
import { AlertCard } from '../components/AlertCard';
import { useAppContext } from '../hooks/useAppContext';
import {
  Dog,
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
  Save,
  ArrowLeft,
  ShieldAlert,
  Clock
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

  // Find pet by ID or fallback to first pet
  const pet = pets.find(p => p.id === id) || pets[0];
  const assignedDevice = devices.find(d => d.id === pet.assignedDeviceId);
  const petAlerts = alerts.filter(a => a.petId === pet.id);
  const petFeedingLogs = feedingLogs.filter(f => f.petId === pet.id);
  const petHydrationLogs = hydrationLogs.filter(h => h.petId === pet.id);

  // Local Note Edit State
  const [noteText, setNoteText] = useState(pet.notes || '');

  const handleSaveNotes = () => {
    updatePet(pet.id, { notes: noteText });
  };

  // Mock Trend Chart Data for this specific pet
  const vitalTrendData = [
    { date: 'Jul 21', temp: 38.3, hr: 82, weight: pet.weight - 0.2 },
    { date: 'Jul 22', temp: 38.4, hr: 84, weight: pet.weight - 0.1 },
    { date: 'Jul 23', temp: 38.5, hr: 85, weight: pet.weight },
    { date: 'Jul 24', temp: 38.5, hr: 86, weight: pet.weight },
    { date: 'Jul 25', temp: pet.latestVitals.temperature - 0.2, hr: 88, weight: pet.weight },
    { date: 'Jul 26', temp: pet.latestVitals.temperature - 0.1, hr: pet.latestVitals.heartRate - 2, weight: pet.weight },
    { date: 'Jul 27', temp: pet.latestVitals.temperature, hr: pet.latestVitals.heartRate, weight: pet.weight }
  ];

  const waterHistoryChartData = [
    { day: 'Mon', ml: 420 },
    { day: 'Tue', ml: 480 },
    { day: 'Wed', ml: 510 },
    { day: 'Thu', ml: 490 },
    { day: 'Fri', ml: 530 },
    { day: 'Sat', ml: 550 },
    { day: 'Sun', ml: 600 }
  ];

  return (
    <DashboardLayout
      pageTitle={`${pet.name}'s Clinical Health Profile`}
      breadcrumbs={[{ label: 'Pets', href: '/app/pets' }, { label: pet.name }]}
    >
      {/* Back Button Link */}
      <div>
        <button
          onClick={() => navigate('/app/pets')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pets Directory
        </button>
      </div>

      {/* ================= HEADER CARD ================= */}
      <div className="clinic-card p-6 bg-gradient-to-r from-white via-slate-50 to-teal-50/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={pet.avatarUrl}
              alt={pet.name}
              className="w-20 h-20 rounded-3xl object-cover ring-4 ring-teal-500/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{pet.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-xs font-bold">
                  {pet.id}
                </span>
                <StatusBadge status={pet.healthStatus} />
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {pet.species} • {pet.breed} • {pet.age} Years Old
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Owner: <strong>{pet.ownerName}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {pet.ownerPhone}
                </span>
                <span className="text-slate-400">Clinic Ref: <strong>{pet.clinicRef}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link
              to="/app/feeding"
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
            >
              <Utensils className="w-4 h-4" />
              Feeding Plan
            </Link>
            <Link
              to="/app/hydration"
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
            >
              <Droplets className="w-4 h-4" />
              Hydration Gauge
            </Link>
          </div>
        </div>
      </div>

      {/* ================= METRICS STATS GRID ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="clinic-card p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            Body Temperature
          </span>
          <div className="text-xl font-extrabold text-slate-900">
            {formatTemperature(pet.latestVitals.temperature)}
          </div>
          <p className="text-[11px] text-slate-500">Normal Range: 38.0 - 39.2°C</p>
        </div>

        <div className="clinic-card p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Resting Heart Rate
          </span>
          <div className="text-xl font-extrabold text-slate-900">
            {formatHeartRate(pet.latestVitals.heartRate)}
          </div>
          <p className="text-[11px] text-slate-500">Normal Range: 70 - 120 bpm</p>
        </div>

        <div className="clinic-card p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Weight className="w-3.5 h-3.5 text-teal-600" />
            Current Weight
          </span>
          <div className="text-xl font-extrabold text-slate-900">
            {formatWeight(pet.weight)}
          </div>
          <p className="text-[11px] text-slate-500">Target Weight: {formatWeight(pet.weight)}</p>
        </div>

        <div className="clinic-card p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Daily Activity
          </span>
          <div className="text-xl font-extrabold text-slate-900">
            {pet.latestVitals.activityLevel} Activity
          </div>
          <p className="text-[11px] text-slate-500">Sensor node collar log</p>
        </div>
      </div>

      {/* ================= ASSIGNED DEVICE & PLANS SUMMARY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Node Card */}
        <div className="clinic-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-600" />
              Assigned Smart Device Node
            </h3>
            {assignedDevice && <StatusBadge status={assignedDevice.status} size="sm" />}
          </div>
          {assignedDevice ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Node ID:</span>
                <span className="font-mono font-bold text-slate-900">{assignedDevice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Firmware:</span>
                <span className="font-semibold text-slate-800">{assignedDevice.firmwareVersion}</span>
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
        <div className="clinic-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-600" />
            Dietary Feeding Plan
          </h3>
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-emerald-800">Formula:</span>
              <span className="font-bold text-emerald-950">{pet.feedingPlan.foodType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-800">Portion Size:</span>
              <span className="font-bold text-emerald-950">{pet.feedingPlan.portionGrams}g per serving</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-800">Frequency:</span>
              <span className="font-bold text-emerald-950">{pet.feedingPlan.timesPerDay}x daily</span>
            </div>
          </div>
        </div>

        {/* Hydration Target Summary */}
        <div className="clinic-card p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-600" />
            Hydration Target
          </h3>
          <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-sky-800">Daily Target:</span>
              <span className="font-bold text-sky-950">{formatHydration(pet.hydrationTarget)}</span>
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
          <ChartCard title="Vital Sign Telemetry Trend" subtitle="Temperature (°C) & Heart Rate (bpm)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vitalTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#0d9488" strokeWidth={2.5} />
                <Line type="monotone" dataKey="hr" name="Heart Rate (bpm)" stroke="#0284c7" strokeWidth={2} strokeDasharray="3 3" />
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
          {petAlerts.length === 0 ? (
            <div className="clinic-card p-6 text-center text-xs text-slate-400">
              No active AI health alerts logged for {pet.name}.
            </div>
          ) : (
            <div className="space-y-3">
              {petAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} compact={false} />
              ))}
            </div>
          )}
        </div>

        {/* Clinical Notes Editor */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Veterinary Clinical Notes
          </h3>
          <div className="clinic-card p-5 space-y-4">
            <textarea
              rows={6}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="w-full p-3 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              placeholder="Enter detailed clinical observation notes..."
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
