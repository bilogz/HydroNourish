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
  Calendar
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Meals Served Today"
          value={isDeviceConnected ? (feedingLogs || []).length : 0}
          subtitle={isDeviceConnected ? "All Heritage Ward Patients" : "No device connected"}
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
          iconBgColor={isDeviceConnected ? "bg-amber-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-amber-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? "Automated" : "Offline"}
          badgeType={isDeviceConnected ? "warning" : "info"}
        />
        <StatCard
          title="Feeder Hopper Container Level"
          value={isDeviceConnected && selectedDevice ? `${selectedDevice.foodLevelPct}%` : 'N/A'}
          subtitle={isDeviceConnected ? "Container Capacity" : "No device connected"}
          icon={Cpu}
          iconBgColor={isDeviceConnected ? "bg-emerald-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-emerald-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? (selectedDevice && selectedDevice.foodLevelPct > 30 ? "Sufficient" : "Low") : "Offline"}
          badgeType={isDeviceConnected ? (selectedDevice && selectedDevice.foodLevelPct > 30 ? "success" : "alert") : "info"}
        />
      </div>

      {/* ================= FEEDING SCHEDULES TABLE ================= */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Automated Feeding Schedules</h2>
            <p className="text-xs text-slate-500">Scheduled automated dispensing rules per patient (10 per page)</p>
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
                            title="Trigger 90° Stepper Gate Cycle on ESP32 now"
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
            <label className="block font-bold text-slate-700 uppercase mb-1">Target Patient</label>
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
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
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
