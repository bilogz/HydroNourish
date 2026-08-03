import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAppContext } from '../hooks/useAppContext';
import { Device } from '../types';
import {
  Cpu,
  Wifi,
  Battery,
  Utensils,
  Droplets,
  Plus,
  Radio,
  Zap,
  Info,
  RefreshCw,
  Sliders
} from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const { devices, pets, addDevice, showToast } = useAppContext();

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [calibrateModalOpen, setCalibrateModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Connect Device Form
  const [formData, setFormData] = useState({
    petId: pets[0]?.id || '',
    wifiSignalDbm: -55,
    foodLevelPct: 100,
    waterLevelPct: 100,
    batteryPct: 100,
    isPluggedIn: true,
    firmwareVersion: 'v2.4.1-ESP32',
    macAddress: '24:0A:C4:00:07:G7'
  });

  const handleOpenDetails = (device: Device) => {
    setSelectedDevice(device);
    setDetailsModalOpen(true);
  };

  const handleOpenCalibrate = (device: Device) => {
    setSelectedDevice(device);
    setCalibrateModalOpen(true);
  };

  const handleCalibrateConfirm = () => {
    if (selectedDevice) {
      showToast('success', 'Calibration Signal Sent', `Zero-point tare calibration sequence executed on node ${selectedDevice.id}.`);
    }
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find(p => p.id === formData.petId) || pets[0];
    addDevice({
      deviceName: `HydroNourish Node ${formData.macAddress.slice(-5)}`,
      assignedPetId: pet.id,
      assignedPetName: pet.name,
      hardwareStatus: 'available',
      wifiSignalDbm: formData.wifiSignalDbm,
      foodLevelPct: formData.foodLevelPct,
      waterLevelPct: formData.waterLevelPct,
      batteryPct: formData.batteryPct,
      isPluggedIn: formData.isPluggedIn,
      firmwareVersion: formData.firmwareVersion,
      macAddress: formData.macAddress
    });
    setConnectModalOpen(false);
  };

  return (
    <DashboardLayout pageTitle="ESP32 Smart Device Nodes" breadcrumbs={[{ label: 'Devices' }]}>
      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Connected Hardware Nodes"
          value={(devices || []).length}
          subtitle="ESP32 Feeder/Hydrator Nodes"
          icon={Cpu}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
          badgeText="Active Mesh"
          badgeType="info"
        />
        <StatCard
          title="Online Telemetry Status"
          value={`${(devices || []).filter(d => d.status === 'Online').length} Online`}
          subtitle="Real-time MQTT / REST sync"
          icon={Radio}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          badgeText="Operational"
          badgeType="success"
        />
        <StatCard
          title="Average Wi-Fi Signal"
          value={`${Math.round((devices || []).reduce((acc, d) => acc + (d.wifiSignalDbm || -55), 0) / Math.max((devices || []).length, 1))} dBm`}
          subtitle="Heritage Clinic Access Point"
          icon={Wifi}
          iconBgColor="bg-sky-50"
          iconTextColor="text-sky-600"
          badgeText="Strong Link"
          badgeType="success"
        />
      </div>

      {/* ================= DEVICE CARDS GRID ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Registered Smart Dispenser & Sensor Nodes</h2>
          <button
            onClick={() => setConnectModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Connect Device
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(!devices || devices.length === 0) ? (
            <div className="col-span-full clinic-card p-10 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/60 border-2 border-dashed border-slate-300">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">No Device Connected</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  No ESP32 smart feeder or hydrator nodes are currently registered. Pair a new device node to begin live telemetry tracking.
                </p>
              </div>
              <button
                onClick={() => setConnectModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Pair New Smart Device Node
              </button>
            </div>
          ) : (
            devices.map(device => (
              <div key={device.id} className="clinic-card p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-mono text-xs font-bold">
                        {device.id}
                      </div>
                      <StatusBadge status={device.status} size="sm" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{device.firmwareVersion}</span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Assigned Patient:</span>
                      <span className="font-bold text-slate-900">{device.assignedPetName || 'Unassigned'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Wi-Fi Signal:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5 text-slate-400" />
                        {device.wifiSignalDbm} dBm
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Power Source:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        {device.isPluggedIn ? 'AC Mains Plugged' : `${device.batteryPct}% Battery`}
                      </span>
                    </div>

                    {/* Level Bars */}
                    <div className="pt-2 space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span className="flex items-center gap-1"><Utensils className="w-3 h-3 text-emerald-600" /> Food Hopper Level</span>
                          <span>{device.foodLevelPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div style={{ width: `${device.foodLevelPct}%` }} className="h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-600" /> Water Reservoir Level</span>
                          <span>{device.waterLevelPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div style={{ width: `${device.waterLevelPct}%` }} className="h-full bg-sky-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => handleOpenCalibrate(device)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    title="Calibrate Load Cells"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDetails(device)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Device Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CONNECT DEVICE MODAL */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title="Pair New ESP32 Smart Device Node"
        subtitle="Heritage Animal Clinic Hardware Provisioning"
      >
        <form onSubmit={handleConnectSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Assign to Patient *</label>
            <select
              value={formData.petId}
              onChange={e => setFormData({ ...formData, petId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} - {p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Firmware Version</label>
              <input
                type="text"
                value={formData.firmwareVersion}
                onChange={e => setFormData({ ...formData, firmwareVersion: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Node MAC Address</label>
              <input
                type="text"
                value={formData.macAddress}
                onChange={e => setFormData({ ...formData, macAddress: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConnectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold"
            >
              Pair & Connect Device
            </button>
          </div>
        </form>
      </Modal>

      {/* DEVICE DETAILS TELEMETRY MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`ESP32 Node Telemetry — ${selectedDevice?.id}`}
        subtitle={`Assigned to ${selectedDevice?.assignedPetName}`}
        maxWidth="lg"
      >
        {selectedDevice && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 text-teal-400 font-mono space-y-1.5 overflow-x-auto">
              <p className="text-slate-400">// Raw Telemetry Payload (ESP32 MQTT Packet)</p>
              <p className="text-white">{"{"}</p>
              <p className="pl-4">"device_id": "{selectedDevice.id}",</p>
              <p className="pl-4">"assigned_pet": "{selectedDevice.assignedPetName}",</p>
              <p className="pl-4">"mac_address": "{selectedDevice.macAddress}",</p>
              <p className="pl-4">"status": "{selectedDevice.status}",</p>
              <p className="pl-4">"food_level_pct": {selectedDevice.foodLevelPct},</p>
              <p className="pl-4">"water_level_pct": {selectedDevice.waterLevelPct},</p>
              <p className="pl-4">"wifi_rssi_dbm": {selectedDevice.wifiSignalDbm},</p>
              <p className="pl-4">"firmware": "{selectedDevice.firmwareVersion}"</p>
              <p className="text-white">{"}"}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CALIBRATE SENSORS CONFIRM MODAL */}
      <ConfirmDialog
        isOpen={calibrateModalOpen}
        onClose={() => setCalibrateModalOpen(false)}
        onConfirm={handleCalibrateConfirm}
        title="Execute Sensor Calibration?"
        message={`Send zero-point tare calibration command to ESP32 node ${selectedDevice?.id}? This resets load-cell weight offsets.`}
        confirmText="Calibrate Sensors"
        variant="info"
      />
    </DashboardLayout>
  );
};
