import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAppContext } from '../hooks/useAppContext';
import { Link } from 'react-router-dom';
import {
  Droplets,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  Plus,
  WifiOff
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
import { formatHydration } from '../utils/formatters';

export const HydrationPage: React.FC = () => {
  const { devices, pets, hydrationLogs, refillWater } = useAppContext();

  const [confirmRefillOpen, setConfirmRefillOpen] = useState(false);

  // Check if an active Online device is connected
  const isDeviceConnected = useMemo(() => {
    return Boolean(
      devices &&
      devices.length > 0 &&
      devices[0].status === 'Online' &&
      devices[0].id !== 'No Device Connected' &&
      devices[0].id !== 'Unassigned'
    );
  }, [devices]);

  const selectedDevice = isDeviceConnected ? devices[0] : null;

  const lowWaterDevices = useMemo(() => {
    if (!isDeviceConnected || !selectedDevice) return [];
    return selectedDevice.waterLevelPct < 30 ? [selectedDevice] : [];
  }, [isDeviceConnected, selectedDevice]);

  // Dynamic calculations
  const totalWaterConsumedMl = useMemo(() => {
    if (!isDeviceConnected || !hydrationLogs || hydrationLogs.length === 0) return 0;
    return hydrationLogs.reduce((acc, log) => acc + (log.amountMl || 0), 0);
  }, [isDeviceConnected, hydrationLogs]);

  const totalHydrationTargetMl = useMemo(() => {
    if (!isDeviceConnected || !pets || pets.length === 0) return 0;
    return pets.reduce((acc, pet) => acc + (pet.hydrationTarget || 850), 0);
  }, [isDeviceConnected, pets]);

  const avgWaterLevelPct = useMemo(() => {
    if (!isDeviceConnected || !selectedDevice) return null;
    return selectedDevice.waterLevelPct;
  }, [isDeviceConnected, selectedDevice]);

  // Dynamic Intake Rate Curve constructed from real hydration logs
  const dynamicHydrationChartData = useMemo(() => {
    const timeSlots = [
      { time: '06:00 AM', ml: 0 },
      { time: '09:00 AM', ml: 0 },
      { time: '12:00 PM', ml: 0 },
      { time: '03:00 PM', ml: 0 },
      { time: '06:00 PM', ml: 0 },
      { time: '09:00 PM', ml: 0 },
    ];

    if (!isDeviceConnected || !hydrationLogs || hydrationLogs.length === 0) {
      return timeSlots;
    }

    let runningSum = 0;
    const step = Math.ceil(hydrationLogs.length / timeSlots.length);
    return timeSlots.map((slot, index) => {
      const logsForSlot = hydrationLogs.slice(index * step, (index + 1) * step);
      const slotSum = logsForSlot.reduce((acc, l) => acc + (l.amountMl || 0), 0);
      runningSum += slotSum;
      return {
        time: slot.time,
        ml: totalHydrationTargetMl > 0 ? Math.min(totalHydrationTargetMl, runningSum) : runningSum,
      };
    });
  }, [isDeviceConnected, hydrationLogs, totalHydrationTargetMl]);

  const handleOpenRefillModal = () => {
    if (selectedDevice) {
      setConfirmRefillOpen(true);
    }
  };

  const handleConfirmRefill = () => {
    if (selectedDevice) {
      refillWater(selectedDevice.id);
    }
  };

  return (
    <DashboardLayout pageTitle="Smart Hydration Monitoring" breadcrumbs={[{ label: 'Hydration' }]}>
      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Daily Water Consumed"
          value={isDeviceConnected ? `${totalWaterConsumedMl.toLocaleString()} ml` : '0 ml'}
          subtitle={isDeviceConnected ? 'Cumulative Clinic Intake' : 'No device connected'}
          icon={Droplets}
          iconBgColor={isDeviceConnected ? 'bg-sky-50' : 'bg-slate-100'}
          iconTextColor={isDeviceConnected ? 'text-sky-600' : 'text-slate-400'}
          badgeText={isDeviceConnected ? 'Active Intake' : 'Offline'}
          badgeType={isDeviceConnected ? 'info' : 'neutral'}
        />
        <StatCard
          title="Daily Hydration Target"
          value={isDeviceConnected ? `${totalHydrationTargetMl.toLocaleString()} ml` : '0 ml'}
          subtitle={isDeviceConnected ? 'All Active Patients' : 'No device connected'}
          icon={CheckCircle2}
          iconBgColor={isDeviceConnected ? 'bg-teal-50' : 'bg-slate-100'}
          iconTextColor={isDeviceConnected ? 'text-teal-600' : 'text-slate-400'}
          badgeText={isDeviceConnected ? 'On Track' : 'Offline'}
          badgeType={isDeviceConnected ? 'success' : 'neutral'}
        />
        <StatCard
          title="Avg Reservoir Level"
          value={isDeviceConnected && avgWaterLevelPct !== null ? `${avgWaterLevelPct}%` : 'N/A'}
          subtitle={isDeviceConnected ? '1 Smart Dispenser Station' : 'No device connected'}
          icon={Cpu}
          iconBgColor={isDeviceConnected ? 'bg-indigo-50' : 'bg-slate-100'}
          iconTextColor={isDeviceConnected ? 'text-indigo-600' : 'text-slate-400'}
          badgeText={isDeviceConnected ? 'Normal' : 'Offline'}
          badgeType={isDeviceConnected ? 'success' : 'alert'}
        />
        <StatCard
          title="Low Water Warnings"
          value={isDeviceConnected ? lowWaterDevices.length : 0}
          subtitle={isDeviceConnected ? 'Refill Action Required' : 'No active station'}
          icon={AlertTriangle}
          iconBgColor={isDeviceConnected ? 'bg-amber-50' : 'bg-slate-100'}
          iconTextColor={isDeviceConnected ? 'text-amber-600' : 'text-slate-400'}
          badgeText={isDeviceConnected ? (lowWaterDevices.length > 0 ? 'Needs Refill' : 'All Clear') : 'Offline'}
          badgeType={isDeviceConnected ? (lowWaterDevices.length > 0 ? 'warning' : 'success') : 'neutral'}
        />
      </div>

      {/* ================= WATER LEVEL GAUGE & REFILL ACTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selected Dispenser Reservoir Gauge */}
        {!isDeviceConnected || !selectedDevice ? (
          <div className="lg:col-span-5 clinic-card p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/60 border-2 border-dashed border-slate-300 min-h-[320px]">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <WifiOff className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Device Connected</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                The single smart hydration station is offline or not currently connected.
              </p>
            </div>
            <Link
              to="/app/devices"
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Connect Device Node
            </Link>
          </div>
        ) : (
          <div className="lg:col-span-5 clinic-card p-6 flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Reservoir Water Level Gauge</h3>
                <p className="text-xs text-slate-500">Live ultrasonic depth sensor measurement</p>
              </div>
              <span className="px-3 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded-xl">
                {selectedDevice.id}
              </span>
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
                  <p className="text-base font-extrabold text-slate-900">{selectedDevice.assignedPetName || 'Unassigned'}</p>
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
              onClick={handleOpenRefillModal}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refill Reservoir Container to 100%
            </button>
          </div>
        )}

        {/* Water Consumption Trend Chart */}
        <div className="lg:col-span-7">
          <ChartCard title="Daily Water Intake Rate Curve" subtitle="Cumulative ml vs target intake">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicHydrationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {!isDeviceConnected ? (
            <div className="clinic-card p-6 text-center text-xs text-slate-500 bg-slate-50 border-slate-200">
              <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              No smart dispenser station connected to monitor water levels.
            </div>
          ) : lowWaterDevices.length === 0 ? (
            <div className="clinic-card p-6 text-center text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              Water reservoir is sufficiently filled above warning thresholds.
            </div>
          ) : (
            <div className="space-y-3">
              {lowWaterDevices.map((dev) => (
                <div key={dev.id} className="clinic-card p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{dev.assignedPetName || 'Unassigned'} ({dev.id})</span>
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">Reservoir Level: {dev.waterLevelPct}%</p>
                  </div>
                  <button
                    onClick={handleOpenRefillModal}
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
                  {(!isDeviceConnected || !hydrationLogs || hydrationLogs.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                        No hydration telemetry logs recorded yet. Connect a device station to begin recording.
                      </td>
                    </tr>
                  ) : (
                    hydrationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">{log.petName}</td>
                        <td className="px-4 py-3 font-bold text-sky-700">{formatHydration(log.amountMl)}</td>
                        <td className="px-4 py-3 text-slate-500">{log.timestamp}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{log.reservoirLevelPct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ================= REFILL CONFIRM DIALOG ================= */}
      {selectedDevice && (
        <ConfirmDialog
          isOpen={confirmRefillOpen}
          onClose={() => setConfirmRefillOpen(false)}
          onConfirm={handleConfirmRefill}
          title="Refill Water Reservoir Container"
          message={`Are you sure you want to refill the water reservoir container for ${selectedDevice.id} (${selectedDevice.assignedPetName}) to 100% capacity?`}
          confirmLabel="Confirm Refill"
          cancelLabel="Cancel"
          variant="info"
        />
      )}
    </DashboardLayout>
  );
};
