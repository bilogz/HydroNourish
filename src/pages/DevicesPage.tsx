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
  Sliders,
  Trash2
} from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const { devices, pets, addDevice, removeDevice, showToast, dispenseDirect, dispenseWaterDirect } = useAppContext();

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [calibrateModalOpen, setCalibrateModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Derive selectedDevice from LIVE devices array so it auto-updates with polling
  const selectedDevice = selectedDeviceId
    ? (devices || []).find(d => d.id === selectedDeviceId) || null
    : null;

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
    setSelectedDeviceId(device.id);
    setDetailsModalOpen(true);
  };

  const handleOpenCalibrate = (device: Device) => {
    setSelectedDeviceId(device.id);
    setCalibrateModalOpen(true);
  };

  const handleOpenDisconnect = (device: Device) => {
    setSelectedDeviceId(device.id);
    setDisconnectModalOpen(true);
  };

  const handleCalibrateConfirm = () => {
    if (selectedDevice) {
      showToast('success', 'Calibration Signal Sent', `Zero-point tare calibration sequence executed on node ${selectedDevice.id}.`);
    }
  };

  const handleDisconnectConfirm = () => {
    if (selectedDevice) {
      removeDevice(selectedDevice.id);
      setDisconnectModalOpen(false);
      setSelectedDeviceId(null);
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
          {/* Skeleton loading cards when devices is null (initial load) */}
          {devices === null ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={`skel-${i}`} className="clinic-card p-5 space-y-4 animate-pulse">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-32 rounded-xl bg-slate-200" />
                    <div className="h-5 w-16 rounded-lg bg-slate-200" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="space-y-3 mt-3">
                  <div className="flex justify-between"><div className="h-3 w-24 rounded bg-slate-200" /><div className="h-3 w-16 rounded bg-slate-200" /></div>
                  <div className="flex justify-between"><div className="h-3 w-20 rounded bg-slate-200" /><div className="h-3 w-12 rounded bg-slate-200" /></div>
                  <div className="flex justify-between"><div className="h-3 w-24 rounded bg-slate-200" /><div className="h-3 w-16 rounded bg-slate-200" /></div>
                  <div className="h-2 w-full rounded-full bg-slate-200 mt-2" />
                  <div className="h-2 w-full rounded-full bg-slate-200" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <div className="h-8 w-8 rounded-xl bg-slate-200" />
                  <div className="h-8 flex-1 rounded-xl bg-slate-200" />
                  <div className="h-8 w-8 rounded-xl bg-slate-200" />
                </div>
              </div>
            ))
          ) : devices.length === 0 ? (
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
            devices.map(device => {
              // 3-state color system
              const isOnline = device.status === 'Online';
              const isConnecting = device.status === ('Connecting' as typeof device.status);
              const isOffline = !isOnline && !isConnecting;

              const badgeBg = isOnline ? 'bg-indigo-50 text-indigo-600' : isConnecting ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600';
              const dotColor = isOnline ? 'bg-emerald-500' : isConnecting ? 'bg-amber-400' : 'bg-rose-500';
              const pingColor = isOnline ? 'bg-emerald-400' : isConnecting ? 'bg-amber-300' : '';

              return (
              <div key={device.id} className={`clinic-card p-5 space-y-4 flex flex-col justify-between transition-all duration-300 ${isConnecting ? 'border-amber-200 bg-amber-50/20' : ''}`}>
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${badgeBg} font-mono text-xs font-bold flex items-center gap-1.5`}>
                        <span className="relative flex h-2 w-2">
                          {!isOffline ? (
                            <>
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
                            </>
                          ) : (
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
                          )}
                        </span>
                        {device.id}
                      </div>
                      {isConnecting ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Connecting...
                        </span>
                      ) : (
                        <StatusBadge status={device.status} size="sm" />
                      )}
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] font-mono text-slate-500 font-bold">{device.macAddress}</span>
                      <span className="block text-[10px] text-slate-400">{device.firmwareVersion}</span>
                    </div>
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

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => dispenseDirect(device.id, 60)}
                    disabled={device.status !== 'Online'}
                    className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                      device.status === 'Online'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    title={device.status === 'Online' ? 'Dispense 60g Food (Stepper Motor)' : 'Node is offline'}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Feed
                  </button>
                  <button
                    onClick={() => dispenseWaterDirect(device.id, 250)}
                    disabled={device.status !== 'Online'}
                    className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                      device.status === 'Online'
                        ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    title={device.status === 'Online' ? 'Dispense 250ml Water (DC Pump)' : 'Node is offline'}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    Pump Water
                  </button>
                  <button
                    onClick={() => handleOpenCalibrate(device)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Calibrate Load Cells"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDetails(device)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <button
                    onClick={() => handleOpenDisconnect(device)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Disconnect / Unpair Device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              );
            })
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
        title={`ESP32 Hardware Debug & Telemetry — ${selectedDevice?.id}`}
        subtitle={`Live Stream from Node ${selectedDevice?.macAddress}`}
        maxWidth="lg"
      >
        {selectedDevice && (
          <div className="space-y-4 text-xs">
            {/* Connection Status Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              selectedDevice.status === 'Online'
                ? 'bg-emerald-50 border-emerald-200'
                : selectedDevice.status === ('Connecting' as typeof selectedDevice.status)
                ? 'bg-amber-50 border-amber-200'
                : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {selectedDevice.status === 'Online' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : selectedDevice.status === ('Connecting' as typeof selectedDevice.status) ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  )}
                </span>
                <div>
                  <p className={`font-bold ${
                    selectedDevice.status === 'Online'
                      ? 'text-emerald-900'
                      : selectedDevice.status === ('Connecting' as typeof selectedDevice.status)
                      ? 'text-amber-900'
                      : 'text-rose-900'
                  }`}>
                    {selectedDevice.status === 'Online'
                      ? 'ESP32 Hardware Connected & Online'
                      : selectedDevice.status === ('Connecting' as typeof selectedDevice.status)
                      ? 'Reconnecting / Handshaking...'
                      : 'ESP32 Hardware Disconnected / Offline'}
                  </p>
                  <p className={`text-[11px] font-mono ${
                    selectedDevice.status === 'Online'
                      ? 'text-emerald-700'
                      : selectedDevice.status === ('Connecting' as typeof selectedDevice.status)
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}>
                    MAC: {selectedDevice.macAddress} | {selectedDevice.status === 'Online' ? `RSSI: ${selectedDevice.wifiSignalDbm} dBm` : selectedDevice.status === ('Connecting' as typeof selectedDevice.status) ? 'Negotiating Signal' : 'No signal'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-white font-mono text-[10px] font-bold ${
                selectedDevice.status === 'Online'
                  ? 'bg-emerald-600'
                  : selectedDevice.status === ('Connecting' as typeof selectedDevice.status)
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}>
                {selectedDevice.status === 'Online'
                  ? 'LIVE TELEMETRY'
                  : selectedDevice.status === ('Connecting' as typeof selectedDevice.status)
                  ? 'CONNECTING...'
                  : 'OFFLINE'}
              </span>
            </div>

            {/* Diagnostic Parameters Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Water Level</p>
                <p className="text-base font-extrabold text-sky-600 mt-1">{selectedDevice.waterLevelPct}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Food Level</p>
                <p className="text-base font-extrabold text-emerald-600 mt-1">{selectedDevice.foodLevelPct}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Power Supply</p>
                <p className="text-base font-extrabold text-amber-600 mt-1">{selectedDevice.isPluggedIn ? 'AC Plugged' : `${selectedDevice.batteryPct}%`}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-teal-400 font-mono space-y-1.5 overflow-x-auto">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
                <span>// Live Supabase / ESP32 REST Telemetry Packet</span>
                <span className={selectedDevice.status === 'Online' ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedDevice.status === 'Online' ? 'STATUS 200 OK' : 'NO HEARTBEAT'}
                </span>
              </div>
              <p className="text-white">{"{"}</p>
              <p className="pl-4">"device_id": "{selectedDevice.id}",</p>
              <p className="pl-4">"mac_address": "{selectedDevice.macAddress}",</p>
              <p className="pl-4">"assigned_pet": "{selectedDevice.assignedPetName}",</p>
              <p className="pl-4">"status": "{selectedDevice.status}",</p>
              <p className="pl-4">"water_level_pct": {selectedDevice.waterLevelPct},</p>
              <p className="pl-4">"food_level_pct": {selectedDevice.foodLevelPct},</p>
              <p className="pl-4">"wifi_signal_dbm": {selectedDevice.wifiSignalDbm},</p>
              <p className="pl-4">"last_transmission": "{selectedDevice.lastTransmission}",</p>
              <p className="pl-4">"firmware_version": "{selectedDevice.firmwareVersion}"</p>
              <p className="text-white">{"}"}</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 font-medium">Auto-refreshing every 3 seconds from Supabase</span>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 transition-colors"
              >
                Close Inspector
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

      {/* DISCONNECT / UNPAIR CONFIRM MODAL */}
      <ConfirmDialog
        isOpen={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title="Unpair & Disconnect Node?"
        message={`Are you sure you want to unpair device node ${selectedDevice?.id} (${selectedDevice?.macAddress})? This removes the hardware link from Supabase.`}
        confirmText="Unpair Device"
        variant="danger"
      />
    </DashboardLayout>
  );
};
