import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';
import { AlertCard } from '../components/AlertCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Modal } from '../components/Modal';
import { useAppContext } from '../hooks/useAppContext';
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
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

  // Skeleton loading simulation state
  const [isLoading, setIsLoading] = useState(true);

  // Quick Action Modals
  const [quickVitalModalOpen, setQuickVitalModalOpen] = useState(false);
  const [quickDispenseModalOpen, setQuickDispenseModalOpen] = useState(false);

  // Quick Vital Form State
  const [vitalForm, setVitalForm] = useState({
    petId: '',
    temperature: 38.5,
    heartRate: 90,
    weight: 10,
    status: 'Normal' as 'Normal' | 'Warning' | 'Critical'
  });

  // Quick Dispense Form State
  const [dispenseForm, setDispenseForm] = useState({
    petId: '',
    grams: 100,
    foodType: 'High-Protein Kibble'
  });

  // Set default petId once pets load
  useEffect(() => {
    if (pets && pets.length > 0) {
      setVitalForm(f => f.petId ? f : { ...f, petId: pets[0].id });
      setDispenseForm(f => f.petId ? f : { ...f, petId: pets[0].id });
    }
  }, [pets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickVitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find(p => p.id === vitalForm.petId) || pets[0];
    showToast('success', 'Vital Record Logged', `Logged ${vitalForm.temperature}°C & ${vitalForm.heartRate} bpm for ${pet.name}.`);
    setQuickVitalModalOpen(false);
  };

  const handleQuickDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find(p => p.id === dispenseForm.petId) || pets[0];
    showToast('success', 'Manual Dispense Sent', `Dispensed ${dispenseForm.grams}g of ${dispenseForm.foodType} for ${pet.name}.`);
    setQuickDispenseModalOpen(false);
  };

  const totalPets = (pets || []).length;
  const onlineDevicesCount = (devices || []).filter(d => d.status === 'Online').length;
  const activeAlertsCount = (alerts || []).filter(a => a.reviewStatus !== 'Resolved').length;

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
          <p className="text-xs text-slate-300">Live monitoring nodes • ESP32 Smart Dispensers</p>
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

      {/* ================= SUMMARY STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          title="Registered Pets"
          value={totalPets}
          subtitle="Heritage Clinic Wards"
          icon={Dog}
          iconBgColor="bg-teal-50"
          iconTextColor="text-teal-600"
          badgeText="Active"
          badgeType="success"
        />
        <StatCard
          title="Pets Fed Today"
          value="22 / 24"
          subtitle="92% Compliance"
          icon={Utensils}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          badgeText="On Schedule"
          badgeType="success"
        />
        <StatCard
          title="Avg Water Intake"
          value="380 ml/day"
          subtitle="Per Patient Target"
          icon={Droplets}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-600"
          badgeText="Normal Range"
          badgeType="info"
        />
        <StatCard
          title="Connected Devices"
          value={`${onlineDevicesCount} / ${devices.length}`}
          subtitle="ESP32 Smart Nodes"
          icon={Cpu}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
          badgeText="Online"
          badgeType="success"
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
            {alerts.slice(0, 2).map(alert => (
              <AlertCard key={alert.id} alert={alert} compact={false} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              Connected Smart Nodes
            </h3>
            <Link to="/app/devices" className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
              Manage Devices <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="clinic-card overflow-hidden divide-y divide-slate-100">
            {devices.slice(0, 4).map(dev => (
              <div key={dev.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 font-mono text-xs font-bold">
                    {dev.id}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">{dev.assignedPetName}</span>
                    <p className="text-[11px] text-slate-500">Wi-Fi: {dev.wifiSignalDbm} dBm • Battery: {dev.batteryPct}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="block font-semibold text-slate-700">Water: {dev.waterLevelPct}%</span>
                    <span className="text-[11px] text-slate-400">Food: {dev.foodLevelPct}%</span>
                  </div>
                  <StatusBadge status={dev.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="clinic-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Recent Clinic Telemetry Activity Log
          </h3>
          <span className="text-xs text-slate-500">Real-time event queue</span>
        </div>

        <div className="space-y-3">
          {recentSystemActivity.map(act => (
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
          ))}
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
              {pets.map(p => (
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
              {pets.map(p => (
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
    </DashboardLayout>
  );
};
