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
  AlertTriangle
} from 'lucide-react';

export const FeedingPage: React.FC = () => {
  const { pets, devices, schedules, feedingLogs, addSchedule, dispenseNow } = useAppContext();

  const isDeviceConnected = Boolean(
    devices &&
    devices.length > 0 &&
    devices[0].status === 'Online' &&
    devices[0].id !== 'No Device Connected' &&
    devices[0].id !== 'Unassigned'
  );

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [confirmDispenseModalOpen, setConfirmDispenseModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<FeedingSchedule | null>(null);

  // Add Schedule Form
  const [formData, setFormData] = useState({
    petId: pets[0]?.id || '',
    foodType: 'High-Protein Kibble',
    portionGrams: 100,
    scheduledTime: '08:00 AM',
    deviceId: isDeviceConnected ? devices[0].id : 'Cage 1'
  });

  const handleOpenDispenseConfirm = (schedule: FeedingSchedule) => {
    setSelectedSchedule(schedule);
    setConfirmDispenseModalOpen(true);
  };

  const handleConfirmDispense = () => {
    if (selectedSchedule) {
      dispenseNow(selectedSchedule.id);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find(p => p.id === formData.petId) || pets[0];
    addSchedule({
      petId: pet.id,
      petName: pet.name,
      foodType: formData.foodType,
      portionGrams: Number(formData.portionGrams),
      scheduledTime: formData.scheduledTime,
      deviceId: formData.deviceId
    });
    setAddModalOpen(false);
  };

  return (
    <DashboardLayout pageTitle="Automated Pet Feeding System" breadcrumbs={[{ label: 'Feeding' }]}>
      {/* Safety Notice Header */}
      <div className="clinic-card p-4 bg-teal-500/10 border-teal-200 flex items-center justify-between text-xs text-teal-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Manual Dispense Control:</strong> Triggering manual dispense commands sends a calibrated servo trigger signal to the assigned ESP32 unit.
          </span>
        </div>
        <span className="font-bold text-teal-700 hidden sm:inline">
          {isDeviceConnected ? '1 Feeder Node Synced' : 'No Feeder Node Synced'}
        </span>
      </div>

      {/* ================= SUMMARY STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Meals Served Today"
          value={isDeviceConnected ? (feedingLogs || []).length : 0}
          subtitle={isDeviceConnected ? "All Heritage Ward Patients" : "No device connected"}
          icon={Utensils}
          iconBgColor={isDeviceConnected ? "bg-teal-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-teal-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? "Success" : "Offline"}
          badgeType={isDeviceConnected ? "success" : "neutral"}
        />
        <StatCard
          title="Pending Schedules"
          value={isDeviceConnected ? (schedules || []).filter(s => s.dispenseStatus === 'Pending').length : 0}
          subtitle={isDeviceConnected ? "Remaining Today" : "No device connected"}
          icon={Clock}
          iconBgColor={isDeviceConnected ? "bg-amber-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-amber-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? "Queued" : "Offline"}
          badgeType={isDeviceConnected ? "warning" : "neutral"}
        />
        <StatCard
          title="Feeder Hopper Container Level"
          value={isDeviceConnected && devices[0] ? `${devices[0].foodLevelPct}% Avg` : 'N/A'}
          subtitle={isDeviceConnected ? "Container Capacity" : "No device connected"}
          icon={Cpu}
          iconBgColor={isDeviceConnected ? "bg-emerald-50" : "bg-slate-100"}
          iconTextColor={isDeviceConnected ? "text-emerald-600" : "text-slate-400"}
          badgeText={isDeviceConnected ? (devices[0]?.foodLevelPct > 30 ? "Sufficient" : "Low") : "Offline"}
          badgeType={isDeviceConnected ? (devices[0]?.foodLevelPct > 30 ? "success" : "alert") : "neutral"}
        />
      </div>

      {/* ================= FEEDING SCHEDULES TABLE ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Active Feeding Schedules</h2>
            <p className="text-xs text-slate-500">Automated timed dispensing rules per patient</p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        </div>

        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Formula / Food Type</th>
                  <th className="px-4 py-3">Portion Size</th>
                  <th className="px-4 py-3">Scheduled Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Device Node</th>
                  <th className="px-4 py-3 text-right">Dispense Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {schedules.map(sch => (
                  <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{sch.petName}</td>
                    <td className="px-4 py-3 text-slate-600">{sch.foodType}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">{sch.portionGrams} grams</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{sch.scheduledTime}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sch.dispenseStatus} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-600">{sch.deviceId}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold text-[11px] inline-flex items-center gap-1.5 border border-teal-200/60">
                        <Cpu className="w-3 h-3 text-teal-600" />
                        Automated Smart Dispense
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= HISTORICAL FEEDING LOGS ================= */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-extrabold text-slate-900">Dispense History Log</h2>
        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Portion Served</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Trigger Type</th>
                  <th className="px-4 py-3">Device Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {feedingLogs.map(log => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-semibold"
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
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              placeholder="e.g. Adult Protein Kibble"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Portion Size (Grams)</label>
              <input
                type="number"
                min="10"
                max="500"
                value={formData.portionGrams}
                onChange={e => setFormData({ ...formData, portionGrams: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Scheduled Time</label>
              <select
                value={formData.scheduledTime}
                onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-semibold"
              >
                <option value="07:00 AM">07:00 AM</option>
                <option value="08:00 AM">08:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="06:00 PM">06:00 PM</option>
                <option value="08:00 PM">08:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Feeder Unit</label>
            <select
              value={formData.deviceId}
              onChange={e => setFormData({ ...formData, deviceId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-semibold"
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
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
        title="Confirm Manual Food Dispense"
        message={`Are you sure you want to dispense ${selectedSchedule?.portionGrams}g of ${selectedSchedule?.foodType} for ${selectedSchedule?.petName} on unit ${selectedSchedule?.deviceId}?`}
        confirmText="Dispense Food"
        variant="info"
      />
    </DashboardLayout>
  );
};
