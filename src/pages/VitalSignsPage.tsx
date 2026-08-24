import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAppContext } from '../hooks/useAppContext';
import {
  Activity,
  Thermometer,
  Heart,
  Weight,
  ShieldAlert,
  Plus
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { vitalSignsTrendData } from '../data/mockData';
import {
  formatTemperature,
  formatHeartRate,
  formatWeight
} from '../utils/formatters';

export const VitalSignsPage: React.FC = () => {
  const { vitals, pets, showToast } = useAppContext();

  const [selectedPetId, setSelectedPetId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [addVitalModalOpen, setAddVitalModalOpen] = useState(false);

  // Form State for new vital reading
  const [formData, setFormData] = useState({
    petId: (pets ?? [])[0]?.id ?? '',
    temperature: 38.5,
    heartRate: 90,
    weight: 10,
    activityMins: 45,
    status: 'Normal' as 'Normal' | 'Warning' | 'Critical'
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = (pets ?? []).find(p => p.id === formData.petId) ?? (pets ?? [])[0];
    if (!pet) return;
    showToast('success', 'Biometric Reading Recorded', `Added vitals for ${pet.name} (${formData.temperature}°C, ${formData.heartRate} bpm).`);
    setAddVitalModalOpen(false);
  };

  const filteredVitals = (vitals ?? []).filter(v => {
    const matchesPet = selectedPetId === 'All' || v.petId === selectedPetId;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesPet && matchesStatus;
  });

  return (
    <DashboardLayout pageTitle="Biometric Vital Signs Monitoring" breadcrumbs={[{ label: 'Vital Signs' }]}>
      {/* ================= MANDATORY VETERINARY DISCLAIMER BANNER ================= */}
      <div className="clinic-card p-4 bg-amber-500/10 border-amber-200 flex items-center justify-between text-xs text-amber-950">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Veterinary Interpretation Notice:</strong> Readings displayed are telemetry sample data collected from sensor collar nodes. All biometrics require professional clinical interpretation before diagnostic decisions.
          </span>
        </div>
      </div>

      {/* ================= SUMMARY METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Average Body Temp"
          value={`${(vitals && vitals.length > 0) ? (vitals.reduce((acc, v) => acc + v.temperature, 0) / vitals.length).toFixed(1) : '38.5'}°C`}
          subtitle="Clinic Ward Average"
          icon={Thermometer}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          badgeText="Normal Range"
          badgeType="success"
        />
        <StatCard
          title="Average Heart Rate"
          value={`${(vitals && vitals.length > 0) ? Math.round(vitals.reduce((acc, v) => acc + v.heartRate, 0) / vitals.length) : 85} bpm`}
          subtitle="Resting State"
          icon={Heart}
          iconBgColor="bg-rose-50"
          iconTextColor="text-rose-600"
          badgeText="Normal"
          badgeType="success"
        />
        <StatCard
          title="Active Monitoring"
          value={`${(pets || []).length} Pets`}
          subtitle="Continuous Sensing"
          icon={Activity}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-600"
          badgeText="Live Synced"
          badgeType="info"
        />
        <StatCard
          title="Elevated Vitals Alerts"
          value={(vitals || []).filter(v => v.status !== 'Normal').length}
          subtitle="Attention Flags"
          icon={ShieldAlert}
          iconBgColor="bg-amber-50"
          iconTextColor="text-amber-600"
          badgeText="Review Needed"
          badgeType="warning"
        />
      </div>

      {/* ================= FILTERS BAR ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedPetId}
            onChange={e => setSelectedPetId(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
          >
            <option value="All">All Patient Pets</option>
            {(pets ?? []).map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
          >
            <option value="All">All Vital States</option>
            <option value="Normal">Normal</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <button
          onClick={() => setAddVitalModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Record New Vitals Reading
        </button>
      </div>

      {/* ================= HISTORICAL TREND CHARTS ================= */}
      <ChartCard title="Telemetry Vital-Sign Trend Analysis" subtitle="7-day body temperature and heart rate curve">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={vitalSignsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="maxTemp" name="Max Temp (°C)" stroke="#10b981" strokeWidth={2.5} />
            <Line type="monotone" dataKey="bellaTemp" name="Bella Temp (°C)" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="lunaTemp" name="Luna Temp (°C)" stroke="#f43f5e" strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ================= VITAL SIGNS READINGS TABLE ================= */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Recorded Vital Biometrics Log</h2>
        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient Pet</th>
                  <th className="px-4 py-3">Body Temperature</th>
                  <th className="px-4 py-3">Heart Rate</th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3">Activity Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Measurement Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredVitals.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{record.petName}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{formatTemperature(record.temperature)}</td>
                    <td className="px-4 py-3 font-bold text-rose-600">{formatHeartRate(record.heartRate)}</td>
                    <td className="px-4 py-3 text-slate-800">{formatWeight(record.weight)}</td>
                    <td className="px-4 py-3 text-slate-600">{record.activityMins} mins/day</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{record.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RECORD NEW VITAL READING MODAL */}
      <Modal
        isOpen={addVitalModalOpen}
        onClose={() => setAddVitalModalOpen(false)}
        title="Record New Biometric Reading"
        subtitle="Heritage Animal Clinic Veterinary Log"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
            <select
              value={formData.petId}
              onChange={e => {
                const pet = (pets ?? []).find(p => p.id === e.target.value);
                setFormData({
                  ...formData,
                  petId: e.target.value,
                  weight: pet?.weight || formData.weight
                });
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
            >
              {(pets ?? []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} - {p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Body Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.temperature}
                onChange={e => setFormData({ ...formData, temperature: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Resting Heart Rate (bpm)</label>
              <input
                type="number"
                required
                value={formData.heartRate}
                onChange={e => setFormData({ ...formData, heartRate: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Activity (mins/day)</label>
              <input
                type="number"
                value={formData.activityMins}
                onChange={e => setFormData({ ...formData, activityMins: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Biometric Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
            >
              <option value="Normal">Normal</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddVitalModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold"
            >
              Record Vital Sign
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
