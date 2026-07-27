import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppContext } from '../hooks/useAppContext';
import {
  Building,
  Utensils,
  Droplets,
  ShieldAlert,
  Bell,
  User,
  Palette,
  Cpu,
  Save,
  Copy,
  Check
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, showToast } = useAppContext();

  const [activeTab, setActiveTab] = useState<
    'clinic' | 'feeding' | 'hydration' | 'alerts' | 'notifications' | 'account' | 'appearance' | 'api'
  >('clinic');

  // Form State initialized from settings
  const [form, setForm] = useState(settings);
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText(form.apiEndpoint);
    setCopied(true);
    showToast('info', 'Copied to Clipboard', 'API Endpoint copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout pageTitle="Clinic & System Settings" breadcrumbs={[{ label: 'Settings' }]}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= TAB NAVIGATION SIDEBAR ================= */}
        <div className="lg:col-span-3 space-y-1">
          {[
            { id: 'clinic', label: 'Clinic Information', icon: Building },
            { id: 'feeding', label: 'Feeding Defaults', icon: Utensils },
            { id: 'hydration', label: 'Hydration Defaults', icon: Droplets },
            { id: 'alerts', label: 'Alert Thresholds', icon: ShieldAlert },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'account', label: 'Account Profile', icon: User },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'api', label: 'Device API Configuration', icon: Cpu },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB CONTENT PANEL ================= */}
        <div className="lg:col-span-9 clinic-card p-6">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* 1. CLINIC INFORMATION TAB */}
            {activeTab === 'clinic' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Heritage Animal Clinic Information</h3>
                  <p className="text-xs text-slate-500">Official clinic metadata displayed on reports and invoices</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Clinic Name *</label>
                    <input
                      type="text"
                      value={form.clinicName}
                      onChange={e => setForm({ ...form, clinicName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Veterinary License ID</label>
                    <input
                      type="text"
                      value={form.licenseId}
                      onChange={e => setForm({ ...form, licenseId: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Clinic Address</label>
                  <input
                    type="text"
                    value={form.clinicAddress}
                    onChange={e => setForm({ ...form, clinicAddress: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.clinicPhone}
                    onChange={e => setForm({ ...form, clinicPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 2. FEEDING DEFAULTS */}
            {activeTab === 'feeding' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Automated Feeding Defaults</h3>
                  <p className="text-xs text-slate-500">Default portion sizing and safety limits</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Default Meal Portion Size (Grams)</label>
                  <input
                    type="number"
                    value={form.defaultPortionGrams}
                    onChange={e => setForm({ ...form, defaultPortionGrams: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 3. HYDRATION DEFAULTS */}
            {activeTab === 'hydration' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Hydration Target Multipliers</h3>
                  <p className="text-xs text-slate-500">Calculates baseline ml target per kg body weight</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target Water Intake Multiplier (ml per kg)</label>
                  <input
                    type="number"
                    value={form.defaultHydrationMlPerKg}
                    onChange={e => setForm({ ...form, defaultHydrationMlPerKg: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. ALERT THRESHOLDS */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Biometric Health Alert Thresholds</h3>
                  <p className="text-xs text-slate-500">Triggers AI health observation flags when vitals exceed boundaries</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Min Normal Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.tempWarningMin}
                      onChange={e => setForm({ ...form, tempWarningMin: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Max Normal Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.tempWarningMax}
                      onChange={e => setForm({ ...form, tempWarningMax: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Min Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={form.hrWarningMin}
                      onChange={e => setForm({ ...form, hrWarningMin: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Max Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={form.hrWarningMax}
                      onChange={e => setForm({ ...form, hrWarningMax: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">Notification Channels</h3>
                  <p className="text-xs text-slate-500">Configure alert delivery for veterinary staff</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-bold text-slate-800">Email Urgent Alerts</span>
                    <input
                      type="checkbox"
                      checked={form.emailNotifications}
                      onChange={e => setForm({ ...form, emailNotifications: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <span className="font-bold text-slate-800">Browser Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={form.browserNotifications}
                      onChange={e => setForm({ ...form, browserNotifications: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 6. ACCOUNT PROFILE */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">User Profile Settings</h3>
                  <p className="text-xs text-slate-500">Dr. Sarah Jenkins • Chief Veterinary Officer</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    defaultValue="Dr. Sarah Jenkins"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue="s.jenkins@heritageanimalclinic.com"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 7. APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">UI Theme & Layout Preferences</h3>
                  <p className="text-xs text-slate-500">Customize dashboard colors for clinical presentation</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-2">Select Theme Palette</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, theme: 'clinic-blue' })}
                      className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
                        form.theme === 'clinic-blue' ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/50' : 'border-slate-200'
                      }`}
                    >
                      <div className="w-full h-8 rounded-lg bg-gradient-to-r from-sky-600 to-teal-600 mx-auto" />
                      <span className="font-bold text-slate-800">Clinic Blue / Teal (Default)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 8. DEVICE API CONFIGURATION PLACEHOLDER */}
            {activeTab === 'api' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900">ESP32 Device REST / MQTT API Placeholder</h3>
                  <p className="text-xs text-slate-500">Configured endpoint for microcontroller telemetry payloads</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">REST Ingestion Endpoint URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.apiEndpoint}
                      onChange={e => setForm({ ...form, apiEndpoint: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCopyApiUrl}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">API Secret Access Key</label>
                  <input
                    type="password"
                    value={form.apiSecretKey}
                    onChange={e => setForm({ ...form, apiSecretKey: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* SAVE BUTTON */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
