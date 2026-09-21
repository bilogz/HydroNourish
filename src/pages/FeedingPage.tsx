import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAppContext } from '../hooks/useAppContext';
import { FeedingSchedule } from '../types';
import {
  Utensils,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Cpu,
  ShieldCheck,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Power,
  Calendar,
  Scale,
  RefreshCw,
  Settings2,
  Target,
  HelpCircle
} from 'lucide-react';

const PAGE_SIZE = 10;

export const FeedingPage: React.FC = () => {
  const {
    pets,
    devices,
    schedules,
    feedingLogs,
    addFeedingSchedule,
    deleteSchedule,
    toggleSchedule,
    dispenseNow,
    dispenseDirect,
    tareScaleDirect,
    calibrateScaleDirect,
    fetchScaleWeightDirect,
    openGateDirect,
    closeGateDirect,
    setPetEatingDirect,
    showToast
  } = useAppContext();

  // Derive active featured device
  const selectedDevice = (devices && devices.length > 0)
    ? (devices.find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || devices[0])
    : null;

  const isDeviceConnected = Boolean(
    selectedDevice &&
    selectedDevice.status === 'Online' &&
    selectedDevice.id !== 'No Device Connected' &&
    selectedDevice.id !== 'Unassigned'
  );

  // Filter Feeder schedules only
  const feederSchedules = schedules.filter(
    s => s.type === 'food' || !s.foodType?.toLowerCase().includes('water')
  );

  // Pagination state for Schedules and Logs
  const [schedulePage, setSchedulePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customManualModalOpen, setCustomManualModalOpen] = useState(false);
  const [confirmDispenseModalOpen, setConfirmDispenseModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<FeedingSchedule | null>(null);

  // Custom Manual Dispense State
  const [customPortion, setCustomPortion] = useState(75);
  const [customPetId, setCustomPetId] = useState(pets[0]?.id || 'PET-001');

  // Add Schedule Form State
  const [formData, setFormData] = useState({
    petId: pets[0]?.id || '',
    foodType: 'High-Protein Kibble',
    portionGrams: 75,
    scheduledTime: '08:00 AM',
    days: 'Everyday',
    deviceId: isDeviceConnected && selectedDevice ? selectedDevice.id : 'HN-NODE-F778'
  });

  // Calculate Paginated Schedules (10 per page)
  const totalSchedulePages = Math.max(1, Math.ceil(feederSchedules.length / PAGE_SIZE));
  const currentSchedulePage = Math.min(schedulePage, totalSchedulePages);
  const paginatedSchedules = feederSchedules.slice(
    (currentSchedulePage - 1) * PAGE_SIZE,
    currentSchedulePage * PAGE_SIZE
  );

  // Calculate Paginated Feeding Logs (10 per page)
  const totalHistoryPages = Math.max(1, Math.ceil(feedingLogs.length / PAGE_SIZE));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const paginatedLogs = feedingLogs.slice(
    (currentHistoryPage - 1) * PAGE_SIZE,
    currentHistoryPage * PAGE_SIZE
  );

  const handleOpenDispenseConfirm = (schedule: FeedingSchedule) => {
    setSelectedSchedule(schedule);
    setConfirmDispenseModalOpen(true);
  };

  const handleConfirmDispense = async () => {
    if (selectedSchedule) {
      const devId = selectedSchedule.deviceId || selectedDevice?.id || 'HN-NODE-F778';
      await dispenseDirect(devId, selectedSchedule.portionGrams || 75, selectedSchedule.foodType || 'High-Protein Kibble');
      setConfirmDispenseModalOpen(false);
    }
  };

  const handleExecuteCustomManual = async () => {
    const pet = pets.find(p => p.id === customPetId) || pets[0];
    const devId = selectedDevice?.id || 'HN-NODE-F778';
    await dispenseDirect(devId, customPortion, `Custom Manual (${customPortion}g)`);
    setCustomManualModalOpen(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find(p => p.id === formData.petId) || pets[0];
    const fullTimeStr = formData.days && formData.days !== 'Everyday'
      ? `${formData.scheduledTime} • ${formData.days}`
      : formData.scheduledTime;

    await addFeedingSchedule({
      petId: pet.id,
      petName: pet.name,
      foodType: formData.foodType,
      portionGrams: Number(formData.portionGrams),
      scheduledTime: fullTimeStr,
      days: formData.days,
      deviceId: formData.deviceId,
      enabled: true,
      type: 'food'
    });
    setAddModalOpen(false);
  };

  const [isTaring, setIsTaring] = useState(false);

  const handleTareScale = async () => {
    if (!selectedDevice) return;
    setIsTaring(true);
    try {
      await tareScaleDirect(selectedDevice.id);
    } finally {
      setTimeout(() => setIsTaring(false), 700);
    }
  };

  const [scaleCalibrateModalOpen, setScaleCalibrateModalOpen] = useState(false);
  const [calMode, setCalMode] = useState<'known' | 'factor'>('known');
  const [calKnownGrams, setCalKnownGrams] = useState<number>(100);
  const [calFactor, setCalFactor] = useState<number>(420.0);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleCalibrateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    setIsCalibrating(true);
    try {
      if (calMode === 'known') {
        await calibrateScaleDirect(selectedDevice.id, calKnownGrams);
      } else {
        await calibrateScaleDirect(selectedDevice.id, undefined, calFactor);
      }
      setScaleCalibrateModalOpen(false);
    } finally {
      setIsCalibrating(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Automated Smart Feeding System" breadcrumbs={[{ label: 'Feeding' }]}>
      {/* Automated System Status Banner */}
      <div className="clinic-card p-4 bg-rose-500/10 border-rose-200 flex items-center justify-between text-xs text-rose-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Automated Smart Feeding:</strong> All schedules are automated by default with high-torque precision. Use the <strong>Custom Manual Dispense</strong> button below whenever on-demand override is needed.
          </span>
        </div>
        <span className="font-bold text-rose-700 hidden sm:inline flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          {isDeviceConnected ? `Node ${selectedDevice?.id} Online` : 'No Feeder Node Synced'}
        </span>
      </div>

      {/* ================= SUMMARY STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Food Bowl Scale"
          value={isDeviceConnected && selectedDevice ? `${(selectedDevice.foodBowlWeightGrams ?? 0).toFixed(1)} g` : 'N/A'}
          subtitle={
            !isDeviceConnected
              ? 'No device connected'
              : selectedDevice?.scaleReady === false
              ? 'HX711 Not Detected'
              : selectedDevice?.foodBowlWeightGrams && selectedDevice.foodBowlWeightGrams > 3
              ? 'Portion loaded in bowl'
              : 'Bowl empty & ready (0.0g)'
          }
          icon={Scale}
          iconBgColor={isDeviceConnected ? "bg-emerald-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-emerald-600" : "text-slate-400"}
          badgeText={
            !isDeviceConnected
              ? 'Offline'
              : selectedDevice?.scaleReady === false
              ? 'Not Detected'
              : selectedDevice?.foodBowlWeightGrams && selectedDevice.foodBowlWeightGrams > 3
              ? `${(selectedDevice.foodBowlWeightGrams ?? 0).toFixed(0)}g In Bowl`
              : 'Ready (0.0g)'
          }
          badgeType={
            !isDeviceConnected
              ? 'info'
              : selectedDevice?.scaleReady === false
              ? 'alert'
              : selectedDevice?.foodBowlWeightGrams && selectedDevice.foodBowlWeightGrams > 3
              ? 'warning'
              : 'success'
          }
        />
        <StatCard
          title="Feeder Hopper Level"
          value={isDeviceConnected && selectedDevice ? `${selectedDevice.foodLevelPct}%` : 'N/A'}
          subtitle={isDeviceConnected ? "Dispenser Container Capacity" : "No device connected"}
          icon={Cpu}
          iconBgColor={isDeviceConnected ? "bg-amber-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-amber-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? (selectedDevice && selectedDevice.foodLevelPct > 30 ? "Sufficient" : "Low") : "Offline"}
          badgeType={isDeviceConnected ? (selectedDevice && selectedDevice.foodLevelPct > 30 ? "success" : "alert") : "info"}
        />
        <StatCard
          title="Total Meals Served Today"
          value={isDeviceConnected ? (feedingLogs || []).length : 0}
          subtitle={isDeviceConnected ? "All Heritage Clinic Pets" : "No device connected"}
          icon={Utensils}
          iconBgColor={isDeviceConnected ? "bg-rose-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-rose-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? "Active" : "Offline"}
          badgeType={isDeviceConnected ? "success" : "info"}
        />
        <StatCard
          title="Pending Schedules"
          value={isDeviceConnected ? (schedules || []).filter(s => s.dispenseStatus === 'Pending').length : 0}
          subtitle={isDeviceConnected ? "Remaining Today" : "No device connected"}
          icon={Clock}
          iconBgColor={isDeviceConnected ? "bg-sky-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-sky-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? "Automated" : "Offline"}
          badgeType={isDeviceConnected ? "warning" : "info"}
        />
      </div>

      {/* ================= LIVE FOOD BOWL PRECISION SCALE MONITOR ================= */}
      <div className="clinic-card p-5 bg-gradient-to-br from-white via-slate-50/70 to-emerald-50/20 border-emerald-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">Live Food Bowl Precision Scale</h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDeviceConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {isDeviceConnected ? 'HX711 24-bit Active' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time strain gauge load cell telemetry • Milligram precision automated portion monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTareScale}
              disabled={!isDeviceConnected || isTaring}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 shadow-xs transition-all ${
                isDeviceConnected && !isTaring
                  ? 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-400 cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
              title="Zero out the bowl weight (tare to 0.0g)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isTaring ? 'animate-spin' : ''}`} />
              <span>{isTaring ? 'Taring Scale...' : 'Zero / Tare (0.0g)'}</span>
            </button>
            <button
              onClick={() => setScaleCalibrateModalOpen(true)}
              disabled={!isDeviceConnected}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs border flex items-center gap-1.5 shadow-xs transition-all ${
                isDeviceConnected
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
              title="Calibrate HX711 scale precision with reference weight"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Calibrate</span>
            </button>
            <button
              onClick={() => setCustomManualModalOpen(true)}
              disabled={!isDeviceConnected}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ${
                isDeviceConnected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Dispense Portion</span>
            </button>
          </div>
        </div>

        {/* 3 Interactive Sensor Insight Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 relative z-10">
          {/* Column 1: Live Digital Scale Display */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-400">Current Bowl Weight</span>
              <span className="font-mono text-[11px] text-slate-400">Target: 75g std</span>
            </div>

            <div className="flex items-baseline gap-2 my-1">
              <span className="font-mono text-3xl font-black text-slate-900 tracking-tight">
                {isDeviceConnected && selectedDevice
                  ? (selectedDevice.foodBowlWeightGrams ?? 0).toFixed(1)
                  : '0.0'}
              </span>
              <span className="text-sm font-bold text-emerald-600">grams (g)</span>
            </div>

            {/* Bowl capacity visual bar */}
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Bowl Capacity Gauge</span>
                <span>
                  {Math.min(100, Math.round(((selectedDevice?.foodBowlWeightGrams ?? 0) / 150) * 100))}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (((selectedDevice?.foodBowlWeightGrams ?? 0) / 150) * 100)))}%`
                  }}
                />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Bowl Status:</span>
              {(() => {
                const w = selectedDevice?.foodBowlWeightGrams ?? 0;
                if (!isDeviceConnected) return <span className="font-bold text-slate-400">Station Offline</span>;
                if (w < 2.0) return <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Empty / Clean Bowl</span>;
                if (w < 120) return <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">Normal Portion Loaded</span>;
                return <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Heavily Loaded</span>;
              })()}
            </div>
          </div>

          {/* Column 2: Eating State & Intake History */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-400">Eating Activity & Gate</span>
              <span className="text-[10px] font-bold text-slate-400">Vision Watchdog</span>
            </div>

            <div className="space-y-2.5 my-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Pet Eating Status</span>
                {selectedDevice?.petEatingActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-xs animate-pulse">
                    🐾 Eating Actively
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                    💤 Idle / Not Feeding
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-700">Dispense Gate</span>
                {selectedDevice?.foodGateOpen ? (
                  <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    90° OPEN
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    0° CLOSED 🔒
                  </span>
                )}
              </div>

              {/* Interactive Watchdog Testing & Override Controls */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  disabled={!isDeviceConnected}
                  onClick={async () => {
                    if (!selectedDevice) return;
                    const nextEating = !selectedDevice.petEatingActive;
                    await setPetEatingDirect(selectedDevice.id, nextEating);
                    if (nextEating && !selectedDevice.foodGateOpen) {
                      await openGateDirect(selectedDevice.id);
                    }
                    showToast(
                      'info',
                      nextEating ? '🐾 Pet Eating Triggered' : 'Pet Finished Eating',
                      nextEating ? 'Dispenser opened and will hold open while eating.' : 'Grace timer active; dispenser will close automatically.'
                    );
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedDevice?.petEatingActive
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Toggle pet eating state to test closed-loop dispenser behavior"
                >
                  {selectedDevice?.petEatingActive ? '🛑 Signal Done Eating' : '🐾 Simulate Pet Eating'}
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!isDeviceConnected}
                    onClick={async () => {
                      if (!selectedDevice) return;
                      showToast('info', 'Cleaning Food Feeder', 'Sweeping gate to clear debris and zeroing scale...');
                      await openGateDirect(selectedDevice.id);
                      await new Promise(r => setTimeout(r, 3500));
                      await closeGateDirect(selectedDevice.id);
                      await tareScaleDirect(selectedDevice.id);
                      showToast('success', 'Food Feeder Cleaned', 'Feeder cleaned & scale tared to 0.0g.');
                    }}
                    className="py-1.5 px-2 rounded-lg text-[10px] font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1 shadow-2xs active:scale-95"
                    title="Clean food dispenser: sweeps gate open/close & zeroes scale"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Clean Feeder
                  </button>
                  <button
                    type="button"
                    disabled={!isDeviceConnected}
                    onClick={async () => {
                      if (!selectedDevice) return;
                      if (selectedDevice.foodGateOpen) {
                        await closeGateDirect(selectedDevice.id);
                        showToast('info', 'Gate Closed', 'Dispenser gate manually closed.');
                      } else {
                        await openGateDirect(selectedDevice.id);
                        showToast('info', 'Gate Opened', 'Dispenser gate opened and holding for pet.');
                      }
                    }}
                    className="py-1.5 px-2.5 rounded-lg text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer disabled:opacity-40"
                    title="Manually toggle food dispenser gate"
                  >
                    {selectedDevice?.foodGateOpen ? 'Close Gate' : 'Open Gate'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Last Consumed Portion:</span>
              <span className="font-extrabold text-slate-800">
                {selectedDevice?.lastIntakeFoodGrams ? `${selectedDevice.lastIntakeFoodGrams} g consumed` : '75 g (nominal)'}
              </span>
            </div>
          </div>

          {/* Column 3: Hardware Diagnostics & Zero Calibration */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span className="uppercase tracking-wider text-[10px] font-bold text-slate-400">Scale Calibration & Bus</span>
              <span className="font-mono text-[10px] text-slate-400">GPIO 16/17</span>
            </div>

            <div className="space-y-1.5 my-1 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Active Node:</span>
                <span className="font-mono font-bold text-indigo-600">{selectedDevice?.id || 'HN-NODE-F778'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Sensor Interface:</span>
                <span className="font-semibold text-slate-700">HX711 Strain Gauge</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Calibration Factor:</span>
                <span className="font-mono text-slate-700">420.0 counts/g</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tare Offset:</span>
                <span className="font-mono text-emerald-600 font-bold">Auto-Zeroed (NVS)</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTareScale}
                disabled={!isDeviceConnected || isTaring}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Execute Zero-Point Tare Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FEEDING SCHEDULES TABLE ================= */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Automated Feeding Schedules</h2>
            <p className="text-xs text-slate-500">Scheduled automated dispensing rules per pet (10 per page)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomManualModalOpen(true)}
              disabled={!isDeviceConnected}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 ${
                isDeviceConnected
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title={isDeviceConnected ? 'Custom Manual Dispense Override' : 'Device is offline'}
            >
              <Sliders className="w-4 h-4" />
              Custom Manual Dispense
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </button>
          </div>
        </div>

        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Formula / Food Type</th>
                  <th className="px-4 py-3">Portion Size</th>
                  <th className="px-4 py-3">Scheduled Time & Days</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Device Node</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {feederSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic">
                      No automated feeder schedules configured yet. Click "Add Schedule" above.
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{sch.petName}</td>
                      <td className="px-4 py-3 text-slate-600">{sch.foodType}</td>
                      <td className="px-4 py-3 font-bold text-rose-700">{sch.portionGrams} grams</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-1.5 pt-3.5">
                        <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{sch.scheduledTime}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          sch.enabled === false
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sch.enabled === false ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                          {sch.enabled === false ? 'Paused' : 'Automated'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600">{sch.deviceId}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Feed Now Instant Trigger */}
                          <button
                            onClick={() => handleOpenDispenseConfirm(sch)}
                            disabled={!isDeviceConnected}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                              isDeviceConnected
                                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95 shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Trigger 90° Servo Gate Cycle on ESP32 now"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            Feed Now
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
                            title="Delete Schedule Rule"
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
          {schedules.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{(currentSchedulePage - 1) * PAGE_SIZE + 1}–{Math.min(currentSchedulePage * PAGE_SIZE, schedules.length)}</span> of <span className="font-bold text-slate-800">{schedules.length}</span> schedules
              </div>

              {/* Bullet Dots & Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSchedulePage(Math.max(1, currentSchedulePage - 1))}
                  disabled={currentSchedulePage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous 10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Interactive Carousel Bullets */}
                <div className="flex items-center gap-1.5 px-2">
                  {Array.from({ length: totalSchedulePages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setSchedulePage(page)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentSchedulePage === page
                          ? 'w-6 bg-rose-600 shadow-xs'
                          : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      title={`Page ${page}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setSchedulePage(Math.min(totalSchedulePages, currentSchedulePage + 1))}
                  disabled={currentSchedulePage === totalSchedulePages}
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

      {/* ================= HISTORICAL FEEDING LOGS ================= */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Dispense History Log</h2>
            <p className="text-xs text-slate-500">Historical automated and custom dispense events (10 per page)</p>
          </div>
        </div>

        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Portion Served</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Device Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {feedingLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 italic">
                      No feeding history logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">{log.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{log.petName}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{log.portionGrams}g</td>
                      <td className="px-4 py-3 text-slate-500">{log.dispensedAt}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          log.status === 'Success' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{log.deviceId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Carousel Bullet Pagination Footer for Logs */}
          {feedingLogs.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{(currentHistoryPage - 1) * PAGE_SIZE + 1}–{Math.min(currentHistoryPage * PAGE_SIZE, feedingLogs.length)}</span> of <span className="font-bold text-slate-800">{feedingLogs.length}</span> logs
              </div>

              {/* Bullet Dots & Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryPage(Math.max(1, currentHistoryPage - 1))}
                  disabled={currentHistoryPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous 10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Interactive Carousel Bullets */}
                <div className="flex items-center gap-1.5 px-2">
                  {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setHistoryPage(page)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentHistoryPage === page
                          ? 'w-6 bg-rose-600 shadow-xs'
                          : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      title={`Page ${page}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setHistoryPage(Math.min(totalHistoryPages, currentHistoryPage + 1))}
                  disabled={currentHistoryPage === totalHistoryPages}
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

      {/* ================= CUSTOM MANUAL DISPENSE MODAL ================= */}
      <Modal
        isOpen={customManualModalOpen}
        onClose={() => setCustomManualModalOpen(false)}
        title="Custom Manual Dispense Override"
        subtitle="On-Demand Custom Portion Trigger"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            The system operates on <strong>Automated Schedules</strong> by default. Use this tool to customize and trigger an immediate on-demand portion.
          </p>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Target Pet</label>
            <select
              value={customPetId}
              onChange={e => setCustomPetId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:outline-none font-semibold text-xs"
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} - {p.id})
                </option>
              ))}
            </select>
          </div>

          {/* Live Food Bowl Weight Scale Readout */}
          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Current Food in Bowl:</span>
                <span className="font-mono text-base font-extrabold text-emerald-800">
                  {selectedDevice?.foodBowlWeightGrams ? selectedDevice.foodBowlWeightGrams.toFixed(1) : '0.0'} g
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTareScale}
              disabled={isTaring}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs active:scale-95"
              title="Zero out bowl weight before dispensing"
            >
              <RefreshCw className={`w-3 h-3 ${isTaring ? 'animate-spin' : ''}`} />
              <span>{isTaring ? 'Taring...' : 'Tare Bowl (0.0g)'}</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700 uppercase">Portion Size</label>
              <span className="font-bold text-amber-600 text-sm">{customPortion} grams</span>
            </div>
            <input
              type="range"
              min="15"
              max="200"
              step="5"
              value={customPortion}
              onChange={e => setCustomPortion(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>15g (Snack)</span>
              <span>75g (Standard)</span>
              <span>200g (Full Meal)</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Portion: <strong className="text-amber-700 font-mono">+{customPortion}g</strong></span>
              <span>Expected Post-Meal Total: <strong className="text-emerald-700 font-mono">{(((selectedDevice?.foodBowlWeightGrams ?? 0) + customPortion)).toFixed(1)}g</strong></span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-800 text-[11px] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Dispenser node <strong>{selectedDevice?.id || 'HN-NODE-F778'}</strong> will execute a precision 90° gate cycle.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCustomManualModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteCustomManual}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm cursor-pointer active:scale-95"
            >
              Dispense {customPortion}g Now
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= ADD SCHEDULE MODAL ================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Automated Feeding Schedule"
        subtitle="Heritage Animal Clinic Dispense Rule"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Pet *</label>
            <select
              value={formData.petId}
              onChange={e => {
                const selected = pets.find(p => p.id === e.target.value);
                setFormData({
                  ...formData,
                  petId: e.target.value,
                  deviceId: selected?.assignedDeviceId || formData.deviceId
                });
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} - {p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Food / Formula Type *</label>
            <input
              type="text"
              required
              value={formData.foodType}
              onChange={e => setFormData({ ...formData, foodType: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              placeholder="e.g. Adult Protein Kibble"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Portion Size (Grams)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={formData.portionGrams}
                  onChange={e => setFormData({ ...formData, portionGrams: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                />
                <span className="font-bold text-slate-500">g</span>
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Scheduled Time</label>
              <input
                type="text"
                required
                value={formData.scheduledTime}
                onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                placeholder="e.g. 08:00 AM or 14:30"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Recurrence / Frequency</label>
              <select
                value={formData.days}
                onChange={e => setFormData({ ...formData, days: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                <option value="Everyday">Everyday (Daily)</option>
                <option value="Weekdays">Weekdays (Mon – Fri)</option>
                <option value="Weekends">Weekends (Sat – Sun)</option>
                <option value="Mon, Wed, Fri">Mon, Wed, Fri</option>
                <option value="Tue, Thu, Sat">Tue, Thu, Sat</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Feeder Unit</label>
              <select
                value={formData.deviceId}
                onChange={e => setFormData({ ...formData, deviceId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-semibold"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm cursor-pointer active:scale-95"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= SCALE CALIBRATION MODAL ================= */}
      <Modal
        isOpen={scaleCalibrateModalOpen}
        onClose={() => setScaleCalibrateModalOpen(false)}
        title="Food Bowl Scale Precision Calibration"
      >
        <form onSubmit={handleCalibrateSubmit} className="space-y-4">
          {/* Live Weight Monitor Header */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Load Cell Reading</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  selectedDevice?.scaleReady !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {selectedDevice?.scaleReady !== false ? '🟢 Sensor Detected' : '⚠️ Not Detected'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-mono font-black text-emerald-400">
                  {typeof selectedDevice?.foodBowlWeightGrams === 'number' ? selectedDevice.foodBowlWeightGrams.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs font-bold text-slate-400">grams</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTareScale}
              disabled={isTaring}
              className="px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTaring ? 'animate-spin' : ''}`} />
              <span>{isTaring ? 'Taring...' : 'Quick Zero / Tare'}</span>
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCalMode('known')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                calMode === 'known' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🎯 Known Reference Weight
            </button>
            <button
              type="button"
              onClick={() => setCalMode('factor')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                calMode === 'factor' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ⚙️ Custom Counts/Gram
            </button>
          </div>

          {calMode === 'known' ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold mb-1">📋 3-Step Guided Calibration:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-emerald-800">
                  <li>Ensure the food bowl is completely empty and click <strong>"Quick Zero / Tare"</strong> above.</li>
                  <li>Place an object of known weight (e.g. 50g, 100g, or measured item) into the bowl.</li>
                  <li>Enter the exact weight below and click <strong>"Calibrate Scale"</strong>. The ESP32 calculates and persists the precise calibration factor to flash NVS.</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reference Object Weight (Grams)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    step="0.1"
                    required
                    value={calKnownGrams}
                    onChange={(e) => setCalKnownGrams(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono font-bold text-slate-900"
                  />
                  <span className="font-bold text-sm text-slate-500">grams</span>
                </div>
              </div>

              {/* Quick weight presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                {[50, 100, 150, 200].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setCalKnownGrams(w)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    {w}g
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                Directly configure counts per gram calibration factor. Standard 1kg load cells typically use ~420.0 counts/g.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Calibration Factor (Counts / Gram)
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="0.1"
                  required
                  value={calFactor}
                  onChange={(e) => setCalFactor(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                {[400, 420, 435, 840].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCalFactor(f)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono transition-all cursor-pointer"
                  >
                    {f}.0
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setScaleCalibrateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCalibrating}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isCalibrating ? 'Calibrating...' : 'Apply & Save Calibration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= DISPENSE NOW CONFIRM DIALOG ================= */}
      <ConfirmDialog
        isOpen={confirmDispenseModalOpen}
        onClose={() => setConfirmDispenseModalOpen(false)}
        onConfirm={handleConfirmDispense}
        title="Confirm Automated Dispense Trigger"
        message={`Are you sure you want to trigger ${selectedSchedule?.portionGrams}g of ${selectedSchedule?.foodType} for ${selectedSchedule?.petName} on unit ${selectedSchedule?.deviceId}?`}
        confirmText="Dispense Food"
        variant="info"
      />
    </DashboardLayout>
  );
};
