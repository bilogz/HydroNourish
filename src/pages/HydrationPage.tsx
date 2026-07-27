import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAppContext } from '../hooks/useAppContext';
import {
  Droplets,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { dailyHydrationData } from '../data/mockData';
import { formatHydration } from '../utils/formatters';

export const HydrationPage: React.FC = () => {
  const { devices, hydrationLogs, refillWater } = useAppContext();

  const [confirmRefillOpen, setConfirmRefillOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || 'HN-DEV-0101');

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  const lowWaterDevices = devices.filter(d => d.waterLevelPct < 30);

  const handleOpenRefillModal = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setConfirmRefillOpen(true);
  };

  const handleConfirmRefill = () => {
    refillWater(selectedDeviceId);
  };

  return (
    <DashboardLayout pageTitle="Smart Hydration Monitoring" breadcrumbs={[{ label: 'Hydration' }]}>
      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Daily Water Consumed"
          value="2,100 ml"
          subtitle="Cumulative Clinic Intake"
          icon={Droplets}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-600"
          badgeText="+12% vs Yesterday"
          badgeType="info"
        />
        <StatCard
          title="Daily Hydration Target"
          value="2,400 ml"
          subtitle="All Active Patients"
          icon={CheckCircle2}
          iconBgColor="bg-teal-50"
          iconTextColor="text-teal-600"
          badgeText="On Track"
          badgeType="success"
        />
        <StatCard
          title="Avg Reservoir Level"
          value={`${Math.round(devices.reduce((acc, d) => acc + d.waterLevelPct, 0) / devices.length)}%`}
          subtitle="6 Dispenser Fountains"
          icon={Cpu}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
          badgeText="Normal"
          badgeType="success"
        />
        <StatCard
          title="Low Water Warnings"
          value={lowWaterDevices.length}
          subtitle="Refill Action Required"
          icon={AlertTriangle}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
          badgeText={lowWaterDevices.length > 0 ? 'Needs Refill' : 'All Clear'}
          badgeType={lowWaterDevices.length > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* ================= WATER LEVEL GAUGE & REFILL ACTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selected Dispenser Reservoir Gauge */}
        <div className="lg:col-span-5 clinic-card p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Reservoir Water Level Gauge</h3>
              <p className="text-xs text-slate-500">Live ultrasonic depth sensor measurement</p>
            </div>
            <select
              value={selectedDeviceId}
              onChange={e => setSelectedDeviceId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.id} ({d.assignedPetName})
                </option>
              ))}
            </select>
          </div>

          {/* Visual Cylinder Level Gauge */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="relative w-20 h-44 rounded-2xl border-4 border-slate-300 bg-white overflow-hidden shadow-inner flex flex-col justify-end">
              <div
                style={{ height: `${selectedDevice.waterLevelPct}%` }}
                className="w-full bg-gradient-to-t from-sky-600 via-teal-500 to-sky-400 transition-all duration-700 relative"
              >
                <div className="absolute top-0 inset-x-0 h-2 bg-white/40 animate-pulse" />
              </div>
              <span className="absolute inset-0 flex items-center justify-center font-extrabold text-slate-900 text-lg drop-shadow-xs">
                {selectedDevice.waterLevelPct}%
              </span>
            </div>

            <div className="flex-1 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned Patient</span>
                <p className="text-base font-extrabold text-slate-900">{selectedDevice.assignedPetName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Refill Status</span>
                <div className="mt-1">
                  <StatusBadge
                    status={selectedDevice.waterLevelPct < 25 ? 'Warning' : 'Online'}
                    size="sm"
                  />
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Transmission Node</span>
                <p className="font-mono font-bold text-slate-700">{selectedDevice.id}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenRefillModal(selectedDevice.id)}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refill Reservoir Container to 100%
          </button>
        </div>

        {/* Water Consumption Trend Chart */}
        <div className="lg:col-span-7">
          <ChartCard title="Daily Water Intake Rate Curve" subtitle="Cumulative ml vs target intake">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHydrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hydrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="ml" name="Consumed (ml)" stroke="#0284c7" strokeWidth={2.5} fill="url(#hydrGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* ================= LOW-WATER ALERTS & REFILL HISTORY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Water Warning Panel */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Low-Water Container Warnings
          </h2>

          {lowWaterDevices.length === 0 ? (
            <div className="clinic-card p-6 text-center text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              All dispenser water reservoirs are sufficiently filled above warning thresholds.
            </div>
          ) : (
            <div className="space-y-3">
              {lowWaterDevices.map(dev => (
                <div key={dev.id} className="clinic-card p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{dev.assignedPetName} ({dev.id})</span>
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">Reservoir Level: {dev.waterLevelPct}%</p>
                  </div>
                  <button
                    onClick={() => handleOpenRefillModal(dev.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                  >
                    Refill Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refill & Intake History Logs Table */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            Hydration Intake & Refill History
          </h2>

          <div className="clinic-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Intake / Refill Volume</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Level After Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {hydrationLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">{log.petName}</td>
                      <td className="px-4 py-3 font-bold text-sky-700">{formatHydration(log.amountMl)}</td>
                      <td className="px-4 py-3 text-slate-500">{log.timestamp}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{log.reservoirLevelPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ================= REFILL CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={confirmRefillOpen}
        onClose={() => setConfirmRefillOpen(false)}
        onConfirm={handleConfirmRefill}
        title="Confirm Water Container Refill"
        message={`Are you sure you want to log a container refill to 100% for dispenser unit ${selectedDeviceId}?`}
        confirmText="Confirm Refill"
        variant="info"
      />
    </DashboardLayout>
  );
};
