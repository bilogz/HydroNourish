import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
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
  WifiOff,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Zap,
  Lock,
  Unlock,
  Trash2,
  Power,
  Calendar
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

const PAGE_SIZE = 10;

export const HydrationPage: React.FC = () => {
  const {
    devices,
    pets,
    schedules,
    hydrationLogs,
    refillWater,
    addWaterSchedule,
    deleteSchedule,
    toggleSchedule,
    dispenseWaterDirect,
    startPumpDirect,
    stopPumpDirect,
    toggleAutoRefillDirect,
    showToast,
  } = useAppContext();

  const [confirmRefillOpen, setConfirmRefillOpen] = useState(false);
  const [customWaterModalOpen, setCustomWaterModalOpen] = useState(false);
  const [addWaterModalOpen, setAddWaterModalOpen] = useState(false);
  const [customWaterLevelPct, setCustomWaterLevelPct] = useState(75);
  const [logPage, setLogPage] = useState(1);
  const [waterSchedulePage, setWaterSchedulePage] = useState(1);

  // Add Water Schedule Form State
  const [waterFormData, setWaterFormData] = useState({
    petId: pets[0]?.id || '',
    amountMl: 250,
    scheduledTime: '08:05 AM',
    days: 'Everyday',
    deviceId: 'HN-NODE-F778'
  });

  // Check if an active Online device is connected
  const selectedDevice = useMemo(() => {
    if (!devices || devices.length === 0) return null;
    return devices.find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || devices[0];
  }, [devices]);

  const isDeviceConnected = Boolean(selectedDevice && selectedDevice.status === 'Online');

  const lowWaterDevices = useMemo(() => {
    if (!isDeviceConnected || !selectedDevice) return [];
    return selectedDevice.waterLevelPct < 30 ? [selectedDevice] : [];
  }, [isDeviceConnected, selectedDevice]);

  // Clean deduplicated logs
  const displayLogs = useMemo(() => {
    if (!hydrationLogs || hydrationLogs.length === 0) return [];
    const seen = new Set();
    const unique = [];
    for (const log of hydrationLogs) {
      const key = `${log.id}-${log.timestamp}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(log);
      }
    }
    return unique;
  }, [hydrationLogs]);

  // Paginated Hydration Logs (10 per page)
  const totalLogPages = Math.max(1, Math.ceil(displayLogs.length / PAGE_SIZE));
  const currentLogPage = Math.min(logPage, totalLogPages);
  const paginatedHydrationLogs = displayLogs.slice(
    (currentLogPage - 1) * PAGE_SIZE,
    currentLogPage * PAGE_SIZE
  );

  // Dynamic calculations
  const totalWaterConsumedMl = useMemo(() => {
    if (!isDeviceConnected || !displayLogs || displayLogs.length === 0) return 0;
    return displayLogs.reduce((acc, log) => acc + (log.amountMl || 0), 0);
  }, [isDeviceConnected, displayLogs]);

  const totalHydrationTargetMl = useMemo(() => {
    if (!isDeviceConnected || !pets || pets.length === 0) return 0;
    return pets.reduce((acc, pet) => acc + (pet.hydrationTarget || 850), 0);
  }, [isDeviceConnected, pets]);

  const avgWaterLevelPct = useMemo(() => {
    if (!isDeviceConnected || !selectedDevice) return null;
    return selectedDevice.waterLevelPct;
  }, [isDeviceConnected, selectedDevice]);

  // Dynamic Intake Rate Curve
  const dynamicHydrationChartData = useMemo(() => {
    const timeSlots = [
      { time: '06:00 AM', ml: 0 },
      { time: '09:00 AM', ml: 0 },
      { time: '12:00 PM', ml: 0 },
      { time: '03:00 PM', ml: 0 },
      { time: '06:00 PM', ml: 0 },
      { time: '09:00 PM', ml: 0 },
    ];

    if (!isDeviceConnected || !displayLogs || displayLogs.length === 0) {
      return timeSlots;
    }

    let runningSum = 0;
    const step = Math.max(1, Math.ceil(displayLogs.length / timeSlots.length));
    return timeSlots.map((slot, index) => {
      const logsForSlot = displayLogs.slice(index * step, (index + 1) * step);
      const slotSum = logsForSlot.reduce((acc, l) => acc + (l.amountMl || 0), 0);
      runningSum += slotSum;
      return {
        time: slot.time,
        ml: totalHydrationTargetMl > 0 ? Math.min(totalHydrationTargetMl, runningSum) : runningSum,
      };
    });
  }, [isDeviceConnected, displayLogs, totalHydrationTargetMl]);

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

  const handleExecuteCustomWater = async () => {
    if (selectedDevice) {
      // Calculate duration/volume mapped from 1-100%
      const volumeMl = Math.round((customWaterLevelPct / 100) * 350);
      await dispenseWaterDirect(selectedDevice.id, volumeMl);
      setCustomWaterModalOpen(false);
    }
  };

  // Filter Water / Hydration Schedules
  const waterSchedules = useMemo(() => {
    return (schedules || []).filter(
      (s) =>
        s.type === 'water' ||
        s.foodType?.toLowerCase().includes('water') ||
        s.foodType?.toLowerCase().includes('pump')
    );
  }, [schedules]);

  const totalWaterSchedulePages = Math.max(1, Math.ceil(waterSchedules.length / PAGE_SIZE));
  const currentWaterSchedulePage = Math.min(waterSchedulePage, totalWaterSchedulePages);
  const paginatedWaterSchedules = waterSchedules.slice(
    (currentWaterSchedulePage - 1) * PAGE_SIZE,
    currentWaterSchedulePage * PAGE_SIZE
  );

  const handleAddWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find((p) => p.id === waterFormData.petId) || pets[0];
    const fullTimeStr =
      waterFormData.days && waterFormData.days !== 'Everyday'
        ? `${waterFormData.scheduledTime} • ${waterFormData.days}`
        : waterFormData.scheduledTime;

    const devId = waterFormData.deviceId || selectedDevice?.id || 'HN-NODE-F778';

    await addWaterSchedule({
      petId: pet.id,
      petName: pet.name,
      foodType: 'Fresh Filtered Water (Pump)',
      portionGrams: Number(waterFormData.amountMl),
      scheduledTime: fullTimeStr,
      days: waterFormData.days,
      deviceId: devId,
      enabled: true,
      type: 'water',
    });
    setAddWaterModalOpen(false);
  };

  return (
    <DashboardLayout pageTitle="Automated Smart Hydration System" breadcrumbs={[{ label: 'Hydration' }]}>
      {/* Automated System Status Banner */}
      <div className="clinic-card p-4 bg-sky-500/10 border-sky-200 flex items-center justify-between text-xs text-sky-900 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>Automated Smart Hydration:</strong> Auto-refill sensors maintain ideal water reservoir levels. Use <strong>Custom Manual Water Pump</strong> below for on-demand customization.
          </span>
        </div>
        <span className="font-bold text-sky-700 hidden sm:inline flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          {isDeviceConnected ? `Node ${selectedDevice?.id} Online` : 'No Hydrator Node Synced'}
        </span>
      </div>

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
          badgeType={isDeviceConnected ? 'info' : 'info'}
        />
        <StatCard
          title="Daily Hydration Target"
          value={isDeviceConnected ? `${totalHydrationTargetMl.toLocaleString()} ml` : '0 ml'}
          subtitle={isDeviceConnected ? 'All Active Patients' : 'No device connected'}
          icon={CheckCircle2}
          iconBgColor={isDeviceConnected ? 'bg-rose-50' : 'bg-slate-100'}
          iconTextColor={isDeviceConnected ? 'text-rose-600' : 'text-slate-400'}
          badgeText={isDeviceConnected ? 'On Track' : 'Offline'}
          badgeType={isDeviceConnected ? 'success' : 'info'}
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
          badgeType={isDeviceConnected ? (lowWaterDevices.length > 0 ? 'warning' : 'success') : 'info'}
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
                The smart hydration station is offline or not currently connected.
              </p>
            </div>
            <Link
              to="/app/devices"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
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
                  <p className="text-base font-extrabold text-slate-900">
                    {selectedDevice.assignedPetName || pets.find(p => p.id === selectedDevice.assignedPetId)?.name || pets[0]?.name || 'Max'}
                  </p>
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
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Water Purity (TDS)</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-800">{selectedDevice.waterQualityPpm ?? 0} PPM</span>
                    {(() => {
                      const tds = selectedDevice.waterQualityPpm ?? 0;
                      if (tds === 0) return <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Dry</span>;
                      if (tds <= 300) return <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Pure</span>;
                      if (tds <= 600) return <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Good</span>;
                      if (tds <= 900) return <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Fair</span>;
                      return <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Filter Req</span>;
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Auto-Refill Mode</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      !selectedDevice.firmwareVersion?.includes('AUTO:OFF')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${!selectedDevice.firmwareVersion?.includes('AUTO:OFF') ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {!selectedDevice.firmwareVersion?.includes('AUTO:OFF') ? 'Auto-Refill (<=10%)' : 'Auto Paused'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pump Live Control Toolbar */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Quick Water Pump (250ml) */}
                <button
                  onClick={() => dispenseWaterDirect(selectedDevice.id, 250)}
                  className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Pump 250ml Water (~2.5s Cycle)"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  Pump 250ml
                </button>

                {/* 2. Force Pump ON (Continuous) */}
                <button
                  onClick={() => startPumpDirect(selectedDevice.id)}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Turn Pump ON Continuously"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Pump ON
                </button>

                {/* 3. Emergency Stop Pump */}
                <button
                  onClick={() => stopPumpDirect(selectedDevice.id)}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Emergency Stop Water Pump Relay"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  Stop Pump
                </button>

                {/* 4. Auto-Refill Toggle */}
                <button
                  onClick={() => toggleAutoRefillDirect(selectedDevice.id, selectedDevice.firmwareVersion?.includes('AUTO:OFF'))}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    !selectedDevice.firmwareVersion?.includes('AUTO:OFF')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                  }`}
                  title="Toggle Autonomous Water Refilling below 10%"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Auto: {!selectedDevice.firmwareVersion?.includes('AUTO:OFF') ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setCustomWaterModalOpen(true)}
                  className="py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Custom Water Level Target Override"
                >
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  Custom Level Target
                </button>
                <button
                  onClick={handleOpenRefillModal}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Mark reservoir refilled to 100%"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  Refill 100%
                </button>
              </div>
            </div>
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

      {/* ================= AUTOMATED WATER & PUMP SCHEDULES ================= */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" />
              Automated Water & Pump Schedules
            </h2>
            <p className="text-xs text-slate-500">
              Scheduled automated pump activation rules per patient (10 per page)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddWaterModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Water Schedule
            </button>
          </div>
        </div>

        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Dispense Target / Pump Duration</th>
                  <th className="px-4 py-3">Scheduled Time & Days</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Device Node</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {waterSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 italic">
                      No automated water pump schedules configured yet. Click "Add Water Schedule" above.
                    </td>
                  </tr>
                ) : (
                  paginatedWaterSchedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{sch.petName}</td>
                      <td className="px-4 py-3 font-bold text-sky-700">
                        {sch.portionGrams} ml{' '}
                        <span className="text-[11px] font-normal text-slate-500">
                          (~{Math.round((sch.portionGrams / 100) * 1000)}ms pump)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-1.5 pt-3.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{sch.scheduledTime}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            sch.enabled === false
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sch.enabled === false ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
                            }`}
                          />
                          {sch.enabled === false ? 'Paused' : 'Automated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-sky-600">{sch.deviceId}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Pump Water Now */}
                          <button
                            onClick={() =>
                              dispenseWaterDirect(
                                sch.deviceId || selectedDevice?.id || 'HN-NODE-F778',
                                sch.portionGrams || 250
                              )
                            }
                            disabled={!isDeviceConnected}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                              isDeviceConnected
                                ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer active:scale-95 shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Trigger Water Pump on ESP32 now"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            Pump Now
                          </button>

                          {/* 2. Toggle Active/Paused */}
                          <button
                            onClick={() => toggleSchedule(sch.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              sch.enabled !== false
                                ? 'border-slate-200 text-emerald-600 hover:bg-emerald-50'
                                : 'border-slate-200 text-slate-400 hover:bg-slate-100'
                            }`}
                            title={sch.enabled !== false ? 'Pause Schedule' : 'Resume Schedule'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Delete Schedule */}
                          <button
                            onClick={() => deleteSchedule(sch.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
                            title="Delete Water Schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Carousel Bullet Pagination Footer */}
          {waterSchedules.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
              <div className="text-slate-500 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-800">
                  {(currentWaterSchedulePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentWaterSchedulePage * PAGE_SIZE, waterSchedules.length)}
                </span>{' '}
                of <span className="font-bold text-slate-800">{waterSchedules.length}</span> water schedules
              </div>

              {/* Bullet Dots & Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWaterSchedulePage(Math.max(1, currentWaterSchedulePage - 1))}
                  disabled={currentWaterSchedulePage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous 10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Interactive Carousel Bullets */}
                <div className="flex items-center gap-1.5 px-2">
                  {Array.from({ length: totalWaterSchedulePages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setWaterSchedulePage(page)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentWaterSchedulePage === page
                          ? 'w-6 bg-sky-600 shadow-xs'
                          : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      title={`Page ${page}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setWaterSchedulePage(Math.min(totalWaterSchedulePages, currentWaterSchedulePage + 1))}
                  disabled={currentWaterSchedulePage === totalWaterSchedulePages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next 10"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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
                    <span className="text-xs font-bold text-slate-900">
                      {dev.assignedPetName || pets.find(p => p.id === dev.assignedPetId)?.name || pets[0]?.name || 'Max'} ({dev.id})
                    </span>
                    <p className="text-xs text-amber-700 font-semibold mt-0.5">Reservoir Level: {dev.waterLevelPct}%</p>
                  </div>
                  <button
                    onClick={handleOpenRefillModal}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
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
                  {(!isDeviceConnected || displayLogs.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                        No hydration telemetry logs recorded yet. Connect a device station to begin recording.
                      </td>
                    </tr>
                  ) : (
                    paginatedHydrationLogs.map((log) => (
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

            {/* Carousel Bullet Pagination Footer for Hydration */}
            {displayLogs.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
                <div className="text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-800">{(currentLogPage - 1) * PAGE_SIZE + 1}–{Math.min(currentLogPage * PAGE_SIZE, displayLogs.length)}</span> of <span className="font-bold text-slate-800">{displayLogs.length}</span> logs
                </div>

                {/* Bullet Dots & Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogPage(Math.max(1, currentLogPage - 1))}
                    disabled={currentLogPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Previous 10"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Interactive Carousel Bullets */}
                  <div className="flex items-center gap-1.5 px-2">
                    {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setLogPage(page)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          currentLogPage === page
                            ? 'w-6 bg-sky-600 shadow-xs'
                            : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                        title={`Page ${page}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setLogPage(Math.min(totalLogPages, currentLogPage + 1))}
                    disabled={currentLogPage === totalLogPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Next 10"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= CUSTOM MANUAL WATER PUMP MODAL (1-100% LEVEL SCALE) ================= */}
      <Modal
        isOpen={customWaterModalOpen}
        onClose={() => setCustomWaterModalOpen(false)}
        title="Custom Manual Water Pump Override"
        subtitle="On-Demand Water Level Trigger (1% - 100%)"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            The system maintains hydration <strong>automatically</strong>. Use this tool to trigger an immediate custom water level for the bowl.
          </p>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700 uppercase">Target Water Dispense Level</label>
              <span className="font-bold text-sky-600 text-sm">{customWaterLevelPct}% Level</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={customWaterLevelPct}
              onChange={e => setCustomWaterLevelPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>1% (Sip)</span>
              <span>25%</span>
              <span>50% (Half)</span>
              <span>75%</span>
              <span>100% (Full Fill)</span>
            </div>
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/60 text-sky-800 text-[11px] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Water pump on node <strong>{selectedDevice?.id || 'HN-NODE-F778'}</strong> will activate to reach <strong>{customWaterLevelPct}% Level</strong> (~{Math.round(customWaterLevelPct * 30)} ms).</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCustomWaterModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteCustomWater}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm cursor-pointer active:scale-95"
            >
              Pump to {customWaterLevelPct}% Level Now
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= ADD WATER SCHEDULE MODAL ================= */}
      <Modal
        isOpen={addWaterModalOpen}
        onClose={() => setAddWaterModalOpen(false)}
        title="Add Automated Water & Pump Schedule"
        subtitle="Heritage Animal Clinic Water Dispense Rule"
      >
        <form onSubmit={handleAddWaterSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
            <select
              value={waterFormData.petId}
              onChange={(e) => {
                const selected = pets.find((p) => p.id === e.target.value);
                setWaterFormData({
                  ...waterFormData,
                  petId: e.target.value,
                  deviceId: selected?.assignedDeviceId || waterFormData.deviceId,
                });
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:outline-none font-semibold"
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} - {p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Water Dispense Amount / Volume *
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="1000"
                  step="25"
                  required
                  value={waterFormData.amountMl}
                  onChange={(e) =>
                    setWaterFormData({ ...waterFormData, amountMl: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:outline-none font-semibold"
                />
                <span className="font-bold text-slate-500 shrink-0">ml</span>
              </div>
              {/* Quick preset buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[150, 200, 250, 350, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setWaterFormData({ ...waterFormData, amountMl: preset })}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      waterFormData.amountMl === preset
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset} ml (~{preset * 10}ms)
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Scheduled Time *</label>
              <input
                type="text"
                required
                value={waterFormData.scheduledTime}
                onChange={(e) => setWaterFormData({ ...waterFormData, scheduledTime: e.target.value })}
                placeholder="e.g. 08:05 AM or 14:35"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Recurrence / Frequency
              </label>
              <select
                value={waterFormData.days}
                onChange={(e) => setWaterFormData({ ...waterFormData, days: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:outline-none font-semibold"
              >
                <option value="Everyday">Everyday (Daily)</option>
                <option value="Weekdays">Weekdays (Mon – Fri)</option>
                <option value="Weekends">Weekends (Sat – Sun)</option>
                <option value="Mon, Wed, Fri">Mon, Wed, Fri</option>
                <option value="Tue, Thu, Sat">Tue, Thu, Sat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Hydrator Node</label>
            <select
              value={waterFormData.deviceId}
              onChange={(e) => setWaterFormData({ ...waterFormData, deviceId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:outline-none font-semibold"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} {d.assignedPetName ? `(${d.assignedPetName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/60 text-sky-800 text-[11px] flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              The ESP32 water pump relay will autonomously trigger for{' '}
              <strong>{waterFormData.amountMl} ml</strong> (~
              {Math.max(500, waterFormData.amountMl * 10)} ms) at{' '}
              <strong>{waterFormData.scheduledTime}</strong> ({waterFormData.days}).
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddWaterModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm cursor-pointer active:scale-95"
            >
              Save Water Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= REFILL CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={confirmRefillOpen}
        onClose={() => setConfirmRefillOpen(false)}
        onConfirm={handleConfirmRefill}
        title="Confirm Water Reservoir Container Refill"
        message={`Are you sure you have physically refilled the reservoir container on dispenser ${selectedDevice?.id} to 100% full capacity?`}
        confirmText="Confirm 100% Full"
        variant="info"
      />
    </DashboardLayout>
  );
};
