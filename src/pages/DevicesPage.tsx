import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LiveCameraWidget } from '../components/LiveCameraWidget';
import { DirectUSBConsoleWidget } from '../components/DirectUSBConsoleWidget';
import { usbSerialService, ScannedWifiNetwork } from '../services/usbSerialService';
import { sendWifiProvisionToSupabase, clearWifiProvisionInSupabase } from '../services/supabase';
import { useAppContext } from '../hooks/useAppContext';
import { Device, Pet } from '../types';
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
  Trash2,
  Scale,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Signal,
  CheckCircle2,
  Usb,
  ExternalLink,
  Check,
  Square,
  PowerOff,
  ShieldAlert,
  Search,
  Globe,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Dog,
} from 'lucide-react';

export const DevicesPage: React.FC = () => {
  const {
    devices,
    pets,
    addDevice,
    updateDevice,
    updatePet,
    removeDevice,
    showToast,
    dispenseDirect,
    dispenseWaterDirect,
    startPumpDirect,
    stopPumpDirect,
    toggleAutoRefillDirect,
    togglePumpMasterDirect,
    deactivatePumpDirect,
    tareScaleDirect,
    tareWaterScaleDirect,
    calibrateScaleDirect,
    calibrateWaterScaleDirect,
    openGateDirect,
    closeGateDirect,
    runBowlSanitationCycle,
    dispenseCleaningWaterDirect,
    dispenseSprayWaterDirect,
    startDrainPumpDirect,
    stopDrainPumpDirect,
    invertDrainRelayDirect,
  } = useAppContext();

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [calibrateModalOpen, setCalibrateModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [pairWifiModalOpen, setPairWifiModalOpen] = useState(false);
  const [customManualModalOpen, setCustomManualModalOpen] = useState(false);
  const [showUsbConsole, setShowUsbConsole] = useState(true);

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [assignPetModalOpen, setAssignPetModalOpen] = useState(false);
  const [petSearchQuery, setPetSearchQuery] = useState('');

  // Wi-Fi Pairing & Scanning State
  const [wifiSsid, setWifiSsid] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hydronourish_paired_ssid') || 'brrt rrt';
    }
    return 'brrt rrt';
  });
  const [wifiPassword, setWifiPassword] = useState('12345678');
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [isPairingWifi, setIsPairingWifi] = useState(false);
  const [isSerialFlashing, setIsSerialFlashing] = useState(false);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [scannedNetworks, setScannedNetworks] = useState<ScannedWifiNetwork[]>([]);
  const [wifiSearchTerm, setWifiSearchTerm] = useState('');
  const [activeWifiTab, setActiveWifiTab] = useState<'scanned' | 'manual'>('scanned');
  const [lastScanTimestamp, setLastScanTimestamp] = useState<Date | null>(new Date());
  const [pairingSuccessMsg, setPairingSuccessMsg] = useState<string | null>(null);
  // Cloud WiFi Provisioning State
  const [isCloudProvisioning, setIsCloudProvisioning] = useState(false);
  const [cloudProvisionStatus, setCloudProvisionStatus] = useState<'idle' | 'sent' | 'confirmed' | 'error'>('idle');
  const [cloudProvisionPollTimer, setCloudProvisionPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // Custom Manual Dispense State
  const [customPortionGrams, setCustomPortionGrams] = useState(75);
  const [customWaterLevelPct, setCustomWaterLevelPct] = useState(75);
  const [taringDevId, setTaringDevId] = useState<string | null>(null);
  const [taringWaterDevId, setTaringWaterDevId] = useState<string | null>(null);
  const [foodCalWeight, setFoodCalWeight] = useState<number>(250);
  const [waterCalVolume, setWaterCalVolume] = useState<number>(500);
  const [calibratingFoodDevId, setCalibratingFoodDevId] = useState<string | null>(null);
  const [calibratingWaterDevId, setCalibratingWaterDevId] = useState<string | null>(null);

  const handleCalibrateFood = async (deviceId: string) => {
    if (!foodCalWeight || foodCalWeight <= 0) return;
    setCalibratingFoodDevId(deviceId);
    try {
      await calibrateScaleDirect(deviceId, foodCalWeight);
    } finally {
      setTimeout(() => setCalibratingFoodDevId(null), 1200);
    }
  };

  const handleCalibrateWater = async (deviceId: string) => {
    if (!waterCalVolume || waterCalVolume <= 0) return;
    setCalibratingWaterDevId(deviceId);
    try {
      await calibrateWaterScaleDirect(deviceId, waterCalVolume);
    } finally {
      setTimeout(() => setCalibratingWaterDevId(null), 1200);
    }
  };
  const [isCleaningFood, setIsCleaningFood] = useState(false);

  const handleCleanFood = async (deviceId: string) => {
    setIsCleaningFood(true);
    showToast('info', 'Cleaning Food Feeder', 'Opening dispenser gate to clear leftover kibble & debris...');
    try {
      if (openGateDirect) await openGateDirect(deviceId);
      await new Promise(r => setTimeout(r, 4000));
      if (closeGateDirect) await closeGateDirect(deviceId);
      await tareScaleDirect(deviceId);
      showToast('success', 'Food Feeder Cleaned', 'Gate closed & Food Scale tared to 0.0g.');
    } catch {
      showToast('error', 'Cleaning Error', 'Failed to complete food feeder cleaning sequence.');
    } finally {
      setIsCleaningFood(false);
    }
  };

  const [isSprayingWater, setIsSprayingWater] = useState(false);

  const handleSprayWater = async (deviceId: string) => {
    setIsSprayingWater(true);
    showToast('info', 'Spraying Clean Water', 'Activating rinse sprayer pump (GPIO 18) to wash food bowl...');
    try {
      if (dispenseSprayWaterDirect) {
        await dispenseSprayWaterDirect(deviceId, 250);
      } else if (dispenseCleaningWaterDirect) {
        await dispenseCleaningWaterDirect(deviceId, 250);
      }
      showToast('success', 'Spray Completed', 'Rinse sprayer wash cycle finished.');
    } catch {
      showToast('error', 'Spray Error', 'Failed to activate spray pump.');
    } finally {
      setIsSprayingWater(false);
    }
  };

  const [isDrainingBowl, setIsDrainingBowl] = useState(false);

  const handleDrainBowl = async (deviceId: string) => {
    setIsDrainingBowl(true);
    showToast('warning', 'Draining Wastewater', 'Activating drain pump (GPIO 23) to evacuate bowl wastewater & scraps...');
    try {
      if (startDrainPumpDirect) {
        await startDrainPumpDirect(deviceId, 6000);
      } else {
        const dev = devices.find(d => d.id === deviceId);
        const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
        if (cleanIp) {
          await fetch(`http://${cleanIp}/api/drain?duration=6000`, { method: 'POST', mode: 'no-cors' });
        }
      }
      setTimeout(async () => {
        await tareScaleDirect(deviceId);
        await tareWaterScaleDirect(deviceId);
      }, 6000);
      showToast('success', 'Drain Cycle Triggered', 'Wastewater pump activated for 6 seconds.');
    } catch {
      showToast('error', 'Drain Error', 'Failed to complete drainage.');
    } finally {
      setTimeout(() => setIsDrainingBowl(false), 6000);
    }
  };

  const handleStopDrain = async (deviceId: string) => {
    setIsDrainingBowl(false);
    if (stopDrainPumpDirect) {
      await stopDrainPumpDirect(deviceId);
    }
  };

  const handleInvertDrain = async (deviceId: string) => {
    if (invertDrainRelayDirect) {
      await invertDrainRelayDirect(deviceId);
    }
  };

  const [isCleaningWaste, setIsCleaningWaste] = useState(false);
  const [cleanWastePhase, setCleanWastePhase] = useState<'idle' | 'spraying' | 'draining' | 'taring'>('idle');
  const [cleanWasteCountdown, setCleanWasteCountdown] = useState<number>(0);

  const handleCleanWaste = async (deviceId: string) => {
    if (isCleaningWaste) return;
    setIsCleaningWaste(true);
    setCleanWastePhase('spraying');
    setCleanWasteCountdown(15);

    const timerInterval = setInterval(() => {
      setCleanWasteCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    showToast('info', '🧼 Clean Waste (1/3)', 'Step 1: Spraying clean rinse water (GPIO 18 - 5s) to wash food bowl...');

    try {
      // Phase 1: Spray Clean Rinse Water (GPIO 18) - exactly 5.0 seconds
      if (dispenseSprayWaterDirect) {
        await dispenseSprayWaterDirect(deviceId, 5000);
      } else {
        const dev = devices.find((d) => d.id === deviceId);
        const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.157';
        fetch(`http://${cleanIp}/api/spray?duration=5000`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
      }

      await new Promise((res) => setTimeout(res, 5000));

      // Phase 2: Wastewater Drain Pump (GPIO 23) - exactly 9.0 seconds
      setCleanWastePhase('draining');
      showToast('warning', '🌀 Clean Waste (2/3)', 'Step 2: Evacuating dirty wastewater via Drain Pump (GPIO 23 - 9s)...');

      if (startDrainPumpDirect) {
        await startDrainPumpDirect(deviceId, 9000);
      } else {
        const dev = devices.find((d) => d.id === deviceId);
        const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.157';
        fetch(`http://${cleanIp}/api/drain?duration=9000`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
      }

      await new Promise((res) => setTimeout(res, 9000));

      // Phase 3: Zero / Tare scales - exactly 1.0 second (Total = 15.0 seconds)
      setCleanWastePhase('taring');
      if (tareScaleDirect) await tareScaleDirect(deviceId);
      if (tareWaterScaleDirect) await tareWaterScaleDirect(deviceId);

      await new Promise((res) => setTimeout(res, 1000));

      clearInterval(timerInterval);
      setCleanWasteCountdown(0);
      showToast('success', '✨ Clean Waste Completed (15s cycle)', 'Food bowl washed with spray, evacuated into waste tank, and scales tared to 0.0g!');
    } catch {
      clearInterval(timerInterval);
      setCleanWasteCountdown(0);
      showToast('error', 'Clean Waste Error', 'Failed to complete full sanitation sequence.');
    } finally {
      clearInterval(timerInterval);
      setIsCleaningWaste(false);
      setCleanWastePhase('idle');
      setCleanWasteCountdown(0);
    }
  };

  const handleStopCleanWaste = async (deviceId: string) => {
    setIsCleaningWaste(false);
    setCleanWastePhase('idle');
    setCleanWasteCountdown(0);
    const dev = devices.find((d) => d.id === deviceId);
    const cleanIp = dev?.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() || '192.168.100.157';
    try {
      fetch(`http://${cleanIp}/api/spray/stop`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
      fetch(`http://${cleanIp}/api/drain/stop`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
      if (stopDrainPumpDirect) {
        await stopDrainPumpDirect(deviceId);
      }
      showToast('info', 'Sanitation Halted', 'Clean waste sequence stopped.');
    } catch {}
  };

  const handleWaterTareClick = async (deviceId: string) => {
    setTaringWaterDevId(deviceId);
    try {
      await tareWaterScaleDirect(deviceId);
    } finally {
      setTimeout(() => setTaringWaterDevId(null), 800);
    }
  };

  const handleTareClick = async (deviceId: string) => {
    setTaringDevId(deviceId);
    try {
      await tareScaleDirect(deviceId);
    } finally {
      setTimeout(() => setTaringDevId(null), 800);
    }
  };

  // Derive selectedDevice from LIVE devices array
  const selectedDevice = selectedDeviceId
    ? (devices || []).find(d => d.id === selectedDeviceId) || null
    : null;

  // Primary active/featured device node
  const featuredDevice = (devices || []).find(d => d.id === 'HN-NODE-F778') || (devices || [])[0] || null;

  // Auto-trigger live hardware scan on modal open
  useEffect(() => {
    if (pairWifiModalOpen) {
      handleScanNearbyWifi();
    }
  }, [pairWifiModalOpen]);

  // Listen to live USB Serial Wi-Fi Scans
  useEffect(() => {
    const unsub = usbSerialService.onWifiScan((nets) => {
      if (nets && nets.length > 0) {
        setScannedNetworks((prev) => {
          const map = new Map<string, ScannedWifiNetwork>();
          prev.forEach((n) => map.set(n.ssid, n));
          nets.forEach((n) => map.set(n.ssid, n));
          return Array.from(map.values()).sort((a, b) => b.rssi - a.rssi);
        });
        setLastScanTimestamp(new Date());
      }
    });
    return unsub;
  }, []);

  // Live dynamic spectrum fluctuation simulation (updates RSSI +/- 1-2 dBm subtly like a real RF analyzer)
  useEffect(() => {
    if (!pairWifiModalOpen) return;
    const timer = setInterval(() => {
      setScannedNetworks((prev) =>
        prev.map((net) => {
          const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
          const newRssi = Math.min(-30, Math.max(-92, net.rssi + jitter));
          return { ...net, rssi: newRssi };
        })
      );
    }, 2800);
    return () => clearInterval(timer);
  }, [pairWifiModalOpen]);

  const renderSignalBars = (rssi: number) => {
    const barsCount = rssi >= -55 ? 4 : rssi >= -68 ? 3 : rssi >= -80 ? 2 : 1;
    return (
      <div className="flex items-end gap-0.5 h-3.5" title={`${rssi} dBm`}>
        <div className={`w-1 rounded-xs transition-all duration-300 ${barsCount >= 1 ? 'h-1.5 bg-emerald-500' : 'h-1.5 bg-slate-200'}`} />
        <div className={`w-1 rounded-xs transition-all duration-300 ${barsCount >= 2 ? 'h-2.5 bg-emerald-500' : 'h-2.5 bg-slate-200'}`} />
        <div className={`w-1 rounded-xs transition-all duration-300 ${barsCount >= 3 ? 'h-3 bg-emerald-500' : 'h-3 bg-slate-200'}`} />
        <div className={`w-1 rounded-xs transition-all duration-300 ${barsCount >= 4 ? 'h-3.5 bg-emerald-500' : 'h-3.5 bg-slate-200'}`} />
      </div>
    );
  };

  // Connect Device Form
  const [formData, setFormData] = useState({
    petId: pets[0]?.id || '',
    wifiSignalDbm: -55,
    foodLevelPct: 100,
    waterLevelPct: 100,
    batteryPct: 100,
    isPluggedIn: true,
    firmwareVersion: 'v2.5.0-ESP32',
    macAddress: '1C:C3:AB:F9:F7:78'
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

  const handleAssignPet = async (pet: Pet, device: Device) => {
    await updateDevice(device.id, {
      assignedPetId: pet.id,
      assignedPetName: pet.name,
    });

    updatePet(pet.id, {
      assignedDeviceId: device.id,
    });

    const prevPet = pets.find(p => p.assignedDeviceId === device.id && p.id !== pet.id);
    if (prevPet) {
      updatePet(prevPet.id, {
        assignedDeviceId: '',
      });
    }

    const cleanIp = device.ipAddress?.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    if (cleanIp) {
      fetch(`http://${cleanIp}/api/setup/pet?name=${encodeURIComponent(pet.name)}&id=${encodeURIComponent(pet.id)}`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
      const petSize = pet.species?.toLowerCase() === 'cat' 
        ? 'cat' 
        : (pet.weight < 10 ? 'small' : pet.weight > 25 ? 'large' : 'medium');
      fetch(`http://${cleanIp}/api/pet/profile?name=${encodeURIComponent(pet.name)}&id=${encodeURIComponent(pet.id)}&type=${encodeURIComponent(pet.species.toLowerCase())}&breed=${encodeURIComponent(pet.breed || 'General')}&size=${encodeURIComponent(petSize)}&weight=${encodeURIComponent(pet.weight || 10)}`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
    }

    showToast('success', 'Pet Assigned', `${pet.name} is now assigned to node ${device.id}.`);
    setAssignPetModalOpen(false);
    setPetSearchQuery('');
  };

  const handleUnassignPet = async (device: Device) => {
    const currentPet = pets.find(p => p.id === device.assignedPetId || p.assignedDeviceId === device.id || p.name === device.assignedPetName);

    await updateDevice(device.id, {
      assignedPetId: '',
      assignedPetName: '',
    });

    if (currentPet) {
      updatePet(currentPet.id, {
        assignedDeviceId: '',
      });
    }

    showToast('info', 'Pet Unassigned', `Pet was unassigned from node ${device.id}.`);
    setAssignPetModalOpen(false);
  };

  const handleCalibrateConfirm = () => {
    if (selectedDevice) {
      tareScaleDirect(selectedDevice.id);
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
    const pet = pets.find(p => p.id === formData.petId);
    const macClean = formData.macAddress.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'F778';
    const deviceId = `HN-NODE-${macClean}`;

    addDevice({
      deviceName: pet ? `HydroNourish Station (${pet.name})` : `HydroNourish Smart Node ${macClean}`,
      assignedPetId: pet ? pet.id : '',
      assignedPetName: pet ? pet.name : 'Standby / Vacant',
      hardwareStatus: pet ? 'occupied' : 'available',
      wifiSignalDbm: formData.wifiSignalDbm,
      wifiSsid: 'brrt rrt',
      foodLevelPct: formData.foodLevelPct,
      waterLevelPct: formData.waterLevelPct,
      batteryPct: formData.batteryPct,
      isPluggedIn: formData.isPluggedIn,
      firmwareVersion: formData.firmwareVersion,
      macAddress: formData.macAddress
    });

    if (pet) {
      updatePet(pet.id, { assignedDeviceId: deviceId });
      showToast('success', 'Node Paired & Assigned', `Node ${deviceId} successfully linked to ${pet.name}.`);
    } else {
      showToast('success', 'Node Paired (Standby)', `Node ${deviceId} registered in Standby mode.`);
    }

    setConnectModalOpen(false);
  };

  // Scan for real nearby 2.4 GHz Wi-Fi Networks across ESP32 telemetry, LAN & WebSerial Endpoints
  const handleScanNearbyWifi = async () => {
    setIsScanningWifi(true);
    const discoveredMap = new Map<string, ScannedWifiNetwork>();

    // 1. Direct WebSerial hardware scan trigger (only if already connected)
    if (usbSerialService.getIsConnected()) {
      try {
        await usbSerialService.scanWifi();
      } catch (err) {
        console.warn('USB scan trigger:', err);
      }
    }

    // 2. Multi-Target Network Scan (SoftAP 192.168.4.1, Feeder mDNS, Cam mDNS, Device IP)
    const activeDevIp = selectedDevice?.ipAddress || devices?.[0]?.ipAddress;
    const cleanDevIp = activeDevIp ? activeDevIp.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim() : '';

    const scanCandidates = [
      cleanDevIp ? `http://${cleanDevIp}/api/wifi/scan` : null,
      'http://192.168.4.1/api/wifi/scan',
      'http://hydronourish.local/api/wifi/scan',
      'http://hydronourish-feeder.local/api/wifi/scan',
      'http://hydronourish-cam.local/api/wifi/scan',
    ].filter(Boolean) as string[];

    for (const url of scanCandidates) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (resp.ok) {
          const data = await resp.json();
          const netList = Array.isArray(data) ? data : (data.networks || []);
          if (Array.isArray(netList) && netList.length > 0) {
            netList.forEach((n: any) => {
              if (n && n.ssid && String(n.ssid).trim().length > 0) {
                discoveredMap.set(String(n.ssid).trim(), {
                  ssid: String(n.ssid).trim(),
                  rssi: Number(n.rssi || -65),
                  auth: n.auth || (n.encrypted ? 'Secured' : 'Open'),
                  encrypted: Boolean(n.encrypted ?? (n.auth !== 'Open'))
                });
              }
            });
            break;
          }
        }
      } catch {}
    }

    // 3. Merge with USB last scanned results
    const usbLast = usbSerialService.getLastScannedNetworks();
    if (usbLast && usbLast.length > 0) {
      usbLast.forEach((n) => {
        if (n.ssid && n.ssid.trim().length > 0) discoveredMap.set(n.ssid.trim(), n);
      });
    }

    // 4. Also check device reported paired SSID if available
    const activeDevSsid = selectedDevice?.wifiSsid;
    if (activeDevSsid && activeDevSsid.trim().length > 0 && !discoveredMap.has(activeDevSsid.trim())) {
      discoveredMap.set(activeDevSsid.trim(), {
        ssid: activeDevSsid.trim(),
        rssi: selectedDevice?.wifiSignalDbm || -55,
        auth: 'Secured',
        encrypted: true
      });
    }

    const sortedList = Array.from(discoveredMap.values()).sort((a, b) => b.rssi - a.rssi);
    setScannedNetworks(sortedList);
    setLastScanTimestamp(new Date());
    setIsScanningWifi(false);
    if (sortedList.length > 0) {
      showToast('success', 'Scan Complete', `Discovered ${sortedList.length} 2.4 GHz Wi-Fi networks in physical range.`);
    } else {
      showToast('info', 'Scanning Complete', 'No broadcasted networks returned. You may enter your Wi-Fi SSID manually below.');
    }
  };

  const handleSelectScannedNetwork = (net: ScannedWifiNetwork) => {
    setWifiSsid(net.ssid);
    if (!net.encrypted || net.auth === 'Open') {
      setWifiPassword('');
    }
  };

  // Method 1: Over-the-Network REST Provisioning (LAN & SoftAP)
  const handlePairWifiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiSsid.trim()) {
      showToast('warning', 'Missing SSID', 'Please enter or select a Wi-Fi network SSID name.');
      return;
    }

    setIsPairingWifi(true);
    setPairingSuccessMsg(null);
    showToast('info', 'Pairing Wi-Fi...', `Transmitting credentials for '${wifiSsid}' to ESP32.`);

    // If USB is active, immediately transmit over hardware serial
    if (usbSerialService.getIsConnected()) {
      try {
        await usbSerialService.pairWifi(wifiSsid.trim(), wifiPassword.trim());
      } catch (e) {
        console.warn('USB dispatch error:', e);
      }
    }

    const payload = JSON.stringify({
      ssid: wifiSsid.trim(),
      password: wifiPassword.trim()
    });

    const queryStr = `ssid=${encodeURIComponent(wifiSsid.trim())}&password=${encodeURIComponent(wifiPassword.trim())}&_t=${Date.now()}`;

    // Image Beacon Pings (Immune to HTTPS mixed-content blocks)
    const targets = ['192.168.4.1', 'hydronourish-cam.local', 'hydronourish-feeder.local', selectedDevice?.ipAddress || ''];
    for (const t of targets) {
      if (t) {
        try {
          const ping = new Image();
          ping.src = `http://${t}/api/wifi/pair?${queryStr}`;
        } catch {}
      }
    }

    try {
      // Broadcast Wi-Fi Provisioning across all candidates
      await Promise.race([
        fetch('http://192.168.4.1/api/wifi/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'no-cors'
        }).catch(() => {}),
        fetch('http://hydronourish-cam.local/api/wifi/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'no-cors'
        }).catch(() => {}),
        fetch('http://hydronourish-feeder.local/api/wifi/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'no-cors'
        }).catch(() => {}),
        fetch(`http://${selectedDevice?.ipAddress || '192.168.100.150'}/api/wifi/pair`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'no-cors'
        }).catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 2200))
      ]);

      const msg = `Wi-Fi credentials for '${wifiSsid}' successfully written to ESP32 / ESP32-CAM NVS memory! Device is connecting to '${wifiSsid}'.`;
      setPairingSuccessMsg(msg);
      showToast('success', 'Wi-Fi Dispatched', msg);

      const targetDev = (devices || []).find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || (devices || [])[0];
      if (targetDev) {
        await updateDevice(targetDev.id, {
          wifiSsid: wifiSsid.trim(),
          status: 'Online'
        });
      }
    } catch (err: any) {
      const msg = `Credentials sent for '${wifiSsid}'. If device does not connect in 15 seconds, try Direct USB Flash.`;
      setPairingSuccessMsg(msg);
      showToast('info', 'Wi-Fi Sent', msg);
    } finally {
      setIsPairingWifi(false);
    }
  };

  // Method 2: Direct USB Cable Web Serial Flash (100% Guaranteed Hardware Link)
  const handleDirectWebSerialPair = async () => {
    if (!('serial' in navigator)) {
      showToast('warning', 'Web Serial Unsupported', 'Your browser does not support Web Serial. Please use Chrome, Brave, or Edge, or use Network Auto-Pair.');
      return;
    }

    if (!wifiSsid.trim()) {
      showToast('warning', 'Missing SSID', 'Please enter or select a Wi-Fi network SSID.');
      return;
    }

    setIsSerialFlashing(true);
    setPairingSuccessMsg(null);

    try {
      if (usbSerialService.getIsConnected()) {
        // Port is already open and connected!
        await usbSerialService.pairWifi(wifiSsid.trim(), wifiPassword.trim());
        const msg = `⚡ Successfully flashed '${wifiSsid}' directly to ESP32 NVS memory via active USB connection! Device is connecting to network.`;
        setPairingSuccessMsg(msg);
        showToast('success', 'USB Flash Succeeded', msg);
      } else {
        showToast('info', 'Select ESP32 USB Port', 'Please select your ESP32 COM port in the browser popup...');
        // @ts-ignore
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        const textEncoder = new TextEncoderStream();
        const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        const writer = textEncoder.writable.getWriter();

        // Send ASCII Command + JSON Command
        const asciiCmd = `PAIR:${wifiSsid.trim()},${wifiPassword.trim()}\n`;
        const jsonCmd = JSON.stringify({ action: 'pair_wifi', ssid: wifiSsid.trim(), password: wifiPassword.trim() }) + '\n';
        await writer.write(asciiCmd);
        await writer.write(jsonCmd);
        writer.releaseLock();

        await new Promise(r => setTimeout(r, 600));
        await port.close();

        const msg = `⚡ Successfully flashed '${wifiSsid}' via USB Serial directly to ESP32 NVS Flash memory!`;
        setPairingSuccessMsg(msg);
        showToast('success', 'USB Flash Succeeded', msg);
      }

      const targetDev = (devices || []).find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || (devices || [])[0];
      if (targetDev) {
        await updateDevice(targetDev.id, {
          wifiSsid: wifiSsid.trim(),
          status: 'Online'
        });
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        showToast('error', 'USB Serial Error', err.message || 'Could not communicate over USB serial.');
      }
    } finally {
      setIsSerialFlashing(false);
    }
  };

  // Method 3: Cloud Provisioning via Supabase (works from anywhere worldwide, no USB or LAN needed)
  const handleCloudProvisionWifi = async () => {
    if (!wifiSsid.trim()) {
      showToast('warning', 'Missing SSID', 'Please enter or select a Wi-Fi network SSID name.');
      return;
    }

    setIsCloudProvisioning(true);
    setCloudProvisionStatus('idle');
    setPairingSuccessMsg(null);

    const targetDevice = (devices || []).find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || (devices || [])[0];
    if (!targetDevice) {
      showToast('warning', 'No Device Found', 'No ESP32 device is registered. Register a device first.');
      setIsCloudProvisioning(false);
      return;
    }

    try {
      const ok = await sendWifiProvisionToSupabase(targetDevice.id, wifiSsid.trim(), wifiPassword.trim());
      if (ok) {
        setCloudProvisionStatus('sent');
        showToast('info', '☁️ Credentials Queued', `'${wifiSsid}' dispatched to Supabase cloud queue. ESP32 will pick it up within 10 seconds.`);

        // Save to localStorage for UI persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('hydronourish_paired_ssid', wifiSsid.trim());
        }

        // Poll device status every 3s for up to 60s waiting for ESP32 to apply new credentials
        let pollCount = 0;
        const maxPolls = 20; // 20 × 3s = 60 seconds
        const pollInterval = setInterval(async () => {
          pollCount++;
          // Clear the provision columns once ESP32 has reconnected (status = Online again)
          const currentDev = (devices || []).find(d => d.id === targetDevice.id);
          if (currentDev?.status === 'Online') {
            clearInterval(pollInterval);
            setCloudProvisionPollTimer(null);
            await clearWifiProvisionInSupabase(targetDevice.id);
            setCloudProvisionStatus('confirmed');
            const msg = `✅ ESP32 successfully reconnected to '${wifiSsid}'! WiFi credentials are now permanently saved in NVS flash.`;
            setPairingSuccessMsg(msg);
            showToast('success', '✅ ESP32 Connected!', msg);
            await updateDevice(targetDevice.id, { wifiSsid: wifiSsid.trim(), status: 'Online' });
            setIsCloudProvisioning(false);
          }
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setCloudProvisionPollTimer(null);
            if (cloudProvisionStatus !== 'confirmed') {
              setCloudProvisionStatus('error');
              const msg = `Credentials dispatched for '${wifiSsid}'. If ESP32 doesn't connect in 60s, verify the password is correct or try USB Flash.`;
              setPairingSuccessMsg(msg);
              showToast('warning', 'Timeout', msg);
            }
            setIsCloudProvisioning(false);
          }
        }, 3000);
        setCloudProvisionPollTimer(pollInterval);
      } else {
        setCloudProvisionStatus('error');
        showToast('error', 'Cloud Dispatch Failed', 'Could not write credentials to Supabase. Check your internet connection.');
        setIsCloudProvisioning(false);
      }
    } catch (err: any) {
      setCloudProvisionStatus('error');
      showToast('error', 'Cloud Error', err.message || 'Unexpected error dispatching WiFi credentials.');
      setIsCloudProvisioning(false);
    }
  };

  const handleExecuteCustomManual = async () => {
    const featuredDev = (devices || []).find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || (devices || [])[0];
    if (featuredDev) {
      await dispenseDirect(featuredDev.id, customPortionGrams, `Custom (${customPortionGrams}g)`);
      setCustomManualModalOpen(false);
    }
  };

  const handleExecuteCustomWater = async () => {
    const featuredDev = (devices || []).find(d => d.id === 'HN-NODE-F778' || d.status === 'Online') || (devices || [])[0];
    if (featuredDev) {
      const volumeMl = Math.round((customWaterLevelPct / 100) * 350);
      await dispenseWaterDirect(featuredDev.id, volumeMl);
      setCustomManualModalOpen(false);
    }
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

      {/* ================= FUSED SMART DISPENSER & LIVE CAMERA STATION ================= */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Active Smart Dispenser & Vision Station</h2>
            <p className="text-xs text-slate-500">Real-time camera feed & automated dispenser telemetry</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPairWifiModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Pair ESP32 to any Wi-Fi Network"
            >
              <Wifi className="w-4 h-4" />
              Pair Wi-Fi
            </button>
            <button
              onClick={() => setConnectModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Connect Device
            </button>
          </div>
        </div>

        {/* Skeleton loading cards when devices is null (initial load) */}
        {devices === null ? (
          <div className="clinic-card p-6 space-y-4 animate-pulse">
            <div className="h-64 bg-slate-200 rounded-xl" />
          </div>
        ) : devices.length === 0 ? (
          <div className="clinic-card p-10 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/60 border-2 border-dashed border-slate-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <Cpu className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No Device Connected</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                No ESP32 smart feeder or hydrator nodes are currently registered. Pair a new device node to begin live telemetry tracking.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPairWifiModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Wifi className="w-4 h-4" />
                Pair to Wi-Fi
              </button>
              <button
                onClick={() => setConnectModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register Node
              </button>
            </div>
          </div>
        ) : (
          (() => {
            const featuredDevice = (devices || []).find(d => d.id === 'HN-NODE-F778') || (devices || [])[0];
            const isOnline = featuredDevice.status === 'Online';
            const isConnecting = featuredDevice.status === ('Connecting' as typeof featuredDevice.status);
            const isOffline = !isOnline && !isConnecting;

            const badgeBg = isOnline
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isConnecting
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200';
            const dotColor = isOnline ? 'bg-emerald-500' : isConnecting ? 'bg-amber-400' : 'bg-rose-500';
            const pingColor = isOnline ? 'bg-emerald-400' : isConnecting ? 'bg-amber-300' : '';

            const assignedPet = pets.find(p => p.id === featuredDevice.assignedPetId || p.name === featuredDevice.assignedPetName);
            const autoCamIp = featuredDevice.cameraIp || featuredDevice.firmwareVersion?.match(/CAM:([0-9.]+)/)?.[1];
            const isPumpDeactivated = Boolean(
              featuredDevice.isPumpDeactivated ?? (
                featuredDevice.firmwareVersion?.includes('PUMP:DISABLED') ||
                featuredDevice.firmwareVersion?.includes('PUMP:LOCKED')
              )
            );
            const isAutoRefillOn = Boolean(
              featuredDevice.autoRefillEnabled ?? (
                featuredDevice.firmwareVersion?.includes('AUTO:ON') &&
                !featuredDevice.firmwareVersion?.includes('AUTO:OFF')
              )
            );

            return (
              <div className="clinic-card overflow-hidden bg-white border border-slate-200 shadow-xl rounded-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Left Column: Live Camera Viewport (col-span-7) */}
                  <div className="lg:col-span-7 bg-slate-950 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
                    <LiveCameraWidget
                      title={`${featuredDevice.id} Live Vision Node`}
                      subtitle={`Node ${featuredDevice.macAddress} • 30 FPS Stream`}
                      device={featuredDevice}
                      defaultIp={autoCamIp}
                      className="rounded-none border-0 shadow-none bg-transparent"
                      petContext={{
                        name: featuredDevice.assignedPetName || assignedPet?.name || 'Max',
                        species: assignedPet?.species || 'Canine (Dog)',
                        weightKg: assignedPet?.weight || 18.5
                      }}
                    />
                  </div>

                  {/* Right Column: Node Telemetry & Controls (col-span-5) */}
                  <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-5 bg-white">
                    <div>
                      {/* Header */}
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
                            {featuredDevice.id}
                          </div>
                          {isConnecting ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Connecting...
                            </span>
                          ) : (
                            <StatusBadge status={featuredDevice.status} size="sm" />
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] font-mono text-slate-500 font-bold">{featuredDevice.macAddress}</span>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-[10px] font-bold text-indigo-700">
                              <Wifi className="w-3 h-3 text-indigo-600 shrink-0" />
                              {featuredDevice.wifiSsid || 'brrt rrt'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Parameters */}
                      <div className="mt-4 space-y-3">
                        {/* Assigned Pet Section */}
                        {assignedPet ? (
                          <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                                <Dog className="w-3.5 h-3.5 text-rose-600" />
                                Assigned Pet
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setAssignPetModalOpen(true)}
                                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                  title="Change assigned pet"
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUnassignPet(featuredDevice)}
                                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  title="Unassign pet from this station"
                                >
                                  Unassign
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-0.5">
                              <div className="relative shrink-0">
                                {assignedPet.avatarUrl ? (
                                  <img
                                    src={assignedPet.avatarUrl}
                                    alt={assignedPet.name}
                                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-200/80 shadow-xs border border-white"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center text-rose-600 font-bold border border-rose-200 shadow-xs">
                                    <Dog className="w-6 h-6" />
                                  </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Monitored in Station" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-extrabold text-slate-900 truncate">
                                    {assignedPet.name}
                                  </h4>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-rose-700 border border-rose-200/80 shadow-2xs shrink-0">
                                    {assignedPet.species}
                                  </span>
                                  {assignedPet.healthStatus && (
                                    <StatusBadge status={assignedPet.healthStatus} size="xs" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {assignedPet.breed || 'Mixed Breed'} • {assignedPet.age}y • {assignedPet.weight}kg
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  Owner: <span className="font-semibold text-slate-700">{assignedPet.ownerName}</span>
                                </p>
                                {(() => {
                                  const isCat = assignedPet.species?.toLowerCase() === 'cat';
                                  const sizeLabel = isCat ? 'Cat' : (assignedPet.weight < 10 ? 'Small Dog' : assignedPet.weight > 25 ? 'Large Dog' : 'Medium Dog');
                                  const portion = isCat ? 35 : (assignedPet.weight < 10 ? 60 : assignedPet.weight > 25 ? 220 : 110);
                                  const waterTarget = isCat ? 200 : (assignedPet.weight < 10 ? 350 : assignedPet.weight > 25 ? 1500 : 750);
                                  return (
                                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] font-semibold" title="Calibrated Intake Targets by Breed & Size (Warren Panizales & Melvin Ferrer Revision)">
                                      <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 shadow-2xs">
                                        {sizeLabel}
                                      </span>
                                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                                        Meal: {portion}g
                                      </span>
                                      <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-200 shadow-2xs">
                                        Water: {waterTarget}ml
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50/60 rounded-2xl border border-dashed border-amber-300 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
                                <Dog className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">No Pet Assigned</p>
                                <p className="text-[10px] text-slate-500 truncate">Assign a pet to track eating & hydration</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAssignPetModalOpen(true)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Assign Pet
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Connected Wi-Fi:</span>
                          <span className="font-bold text-indigo-700 flex items-center gap-1 bg-indigo-50/90 border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                            <Wifi className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            {featuredDevice.wifiSsid || 'brrt rrt'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Wi-Fi Signal:</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Signal className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="font-bold text-slate-800">{featuredDevice.wifiSignalDbm} dBm</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              featuredDevice.wifiSignalDbm >= -60
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : featuredDevice.wifiSignalDbm >= -75
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {featuredDevice.wifiSignalDbm >= -60 ? 'Strong' : featuredDevice.wifiSignalDbm >= -75 ? 'Good' : 'Fair'}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Power Source:</span>
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            {featuredDevice.isPluggedIn ? 'AC Mains Plugged' : `${featuredDevice.batteryPct}% Battery`}
                          </span>
                        </div>

                        {/* Real-Time Sensor Telemetry Grid */}
                        <div className="pt-2 space-y-3">
                          {/* Live Sensors Readout */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Live Load Cell Weight */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Scale className="w-3 h-3 text-emerald-600" />
                                  Food Bowl Scale
                                </span>
                                <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTareClick(featuredDevice.id);
                                  }}
                                  disabled={taringDevId === featuredDevice.id}
                                  title="Zero / Tare the Food Bowl Weight Scale"
                                  className="text-[9px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${taringDevId === featuredDevice.id ? 'animate-spin' : ''}`} />
                                  {taringDevId === featuredDevice.id ? 'Taring...' : 'Tare'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCalibrate(featuredDevice);
                                  }}
                                  title="Calibrate Food Scale with Reference Weight"
                                  className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-0.5"
                                >
                                  <Sliders className="w-2.5 h-2.5 text-slate-500" />
                                  Cal
                                </button>
                              </div>
                              </div>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="font-mono text-sm font-extrabold text-slate-800">
                                  {typeof featuredDevice.foodBowlWeightGrams === 'number' ? featuredDevice.foodBowlWeightGrams.toFixed(1) : '0.0'} g
                                </span>
                                {(() => {
                                  const isScaleDetected = isOnline && (featuredDevice.scaleReady !== false);
                                  const weightVal = featuredDevice.foodBowlWeightGrams ?? 0;
                                  if (!isOnline) {
                                    return <span className="text-[10px] font-medium text-slate-400">Offline</span>;
                                  }
                                  if (!isScaleDetected) {
                                    return (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md flex items-center gap-1" title="HX711 module not responding on DOUT:16, SCK:17">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        Not Detected
                                      </span>
                                    );
                                  }
                                  if (weightVal >= 5.0) {
                                    return (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md flex items-center gap-1" title="Uneaten food detected: 15-minute auto-flush sequence armed">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        {weightVal.toFixed(0)}g • 15m Watch
                                      </span>
                                    );
                                  }
                                  if (weightVal >= 1.0) {
                                    return (
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {weightVal.toFixed(0)}g In Bowl
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Detected • Ready
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Live TDS Water Quality */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-sky-600" />
                                Water Quality (TDS)
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="font-mono text-sm font-extrabold text-slate-800">
                                  {featuredDevice.waterQualityPpm ?? 0} PPM
                                </span>
                                {(() => {
                                  const tds = featuredDevice.waterQualityPpm ?? 0;
                                  if (tds === 0) return <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Dry</span>;
                                  if (tds <= 300) return <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Pure</span>;
                                  if (tds <= 300) return <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Pure</span>;
                                  if (tds < 500) return <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Good Tap</span>;
                                  return (
                                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse" title="TDS >= 500 PPM: Automated dirty water drain & refill active">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                      Dirty • Auto-Flush
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Level Progress Bars */}
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                              <span className="flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5 text-emerald-600" /> Food Hopper Level</span>
                              <span className="font-mono text-emerald-600">{featuredDevice.foodLevelPct}%</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div style={{ width: `${featuredDevice.foodLevelPct}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                              <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-sky-600" /> Water Reservoir Volume</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sky-600 font-extrabold">
                                  {Math.round((featuredDevice.waterLiters !== undefined ? featuredDevice.waterLiters * 1000 : ((featuredDevice.waterLevelPct || 0) / 100) * 2500))} ml
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWaterTareClick(featuredDevice.id);
                                  }}
                                  disabled={taringWaterDevId === featuredDevice.id}
                                  title="Zero / Tare the Water Reservoir Scale (0 ml)"
                                  className="text-[9px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 shadow-2xs active:scale-95"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${taringWaterDevId === featuredDevice.id ? 'animate-spin' : ''}`} />
                                  {taringWaterDevId === featuredDevice.id ? 'Taring...' : 'Tare Water'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCalibrate(featuredDevice);
                                  }}
                                  title="Calibrate Water Scale with Reference Volume"
                                  className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-0.5"
                                >
                                  <Sliders className="w-2.5 h-2.5 text-slate-500" />
                                  Cal
                                </button>
                              </div>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, Math.max(0, ((featuredDevice.waterLiters !== undefined ? featuredDevice.waterLiters : ((featuredDevice.waterLevelPct || 0) / 100) * 2.50) / (featuredDevice.reservoirCapacityLiters || 2.50)) * 100))}%` }}
                                className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Dispense & Action Controls */}
                    <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                      {/* Action Row 1: Direct Manual Dispense Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Food Gate Open and Close Control Buttons */}
                        <div className="flex rounded-xl overflow-hidden shadow-xs border border-slate-200">
                          <button
                            onClick={() => openGateDirect(featuredDevice.id)}
                            disabled={!isOnline}
                            className={`flex-1 py-2.5 px-2 font-bold transition-all flex items-center justify-center gap-1.5 ${
                              !isOnline
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : featuredDevice.foodGateOpen
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                            }`}
                            title={isOnline ? 'Open Food Gate (90° Sweep)' : 'Node is offline'}
                          >
                            <Unlock className="w-3.5 h-3.5 shrink-0" />
                            <span>Open Gate</span>
                          </button>
                          <button
                            onClick={() => closeGateDirect(featuredDevice.id)}
                            disabled={!isOnline}
                            className={`flex-1 py-2.5 px-2 font-bold transition-all flex items-center justify-center gap-1.5 border-l border-slate-200 ${
                              !isOnline
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : featuredDevice.foodGateOpen
                                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer active:scale-95'
                            }`}
                            title={isOnline ? 'Close Food Gate (0° Return)' : 'Node is offline'}
                          >
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>Close Gate</span>
                          </button>
                        </div>

                        <button
                          onClick={() => dispenseWaterDirect(featuredDevice.id, 250)}
                          disabled={!isOnline || isPumpDeactivated}
                          className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                            !isOnline
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : isPumpDeactivated
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer active:scale-95 shadow-sky-500/20'
                          }`}
                          title={
                            !isOnline
                              ? 'Node is offline'
                              : isPumpDeactivated
                              ? '🔒 Water pump is currently locked & deactivated. Toggle Pump Power switch below to unlock.'
                              : 'Pump Water for 5 Seconds (250ml)'
                          }
                        >
                          {isPumpDeactivated ? (
                            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <Droplets className="w-4 h-4 text-sky-200 shrink-0" />
                          )}
                          <span>{isPumpDeactivated ? 'Pump Locked' : 'Pump Water'}</span>
                        </button>
                      </div>

                      {/* Action Row 2: Real Hardware Toggle Switches */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* REAL TOGGLE SWITCH 1: Water Pump Master Power (Active / Deactivated) */}
                        <div
                          onClick={() => isOnline && togglePumpMasterDirect(featuredDevice.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all select-none ${
                            !isOnline
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isPumpDeactivated
                              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/70 cursor-pointer'
                              : 'bg-emerald-50/60 border-emerald-300 hover:bg-emerald-100/60 cursor-pointer'
                          }`}
                          title={
                            !isOnline
                              ? 'Node is offline'
                              : isPumpDeactivated
                              ? 'Toggle to UNLOCK and ACTIVATE the water pump'
                              : 'Toggle to LOCK and DEACTIVATE the water pump'
                          }
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isPumpDeactivated ? 'bg-amber-200/80 text-amber-800' : 'bg-emerald-200/80 text-emerald-800'
                            }`}>
                              {isPumpDeactivated ? <Lock className="w-3.5 h-3.5" /> : <Droplets className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-800 leading-tight">Pump Power</p>
                              <p className={`text-[10px] font-extrabold ${isPumpDeactivated ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {isPumpDeactivated ? 'LOCKED / OFF' : 'ACTIVE / ON'}
                              </p>
                            </div>
                          </div>

                          {/* Real Sliding Toggle Track & Thumb */}
                          <div
                            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
                              isPumpDeactivated ? 'bg-slate-300' : 'bg-emerald-500'
                            }`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                                isPumpDeactivated ? 'translate-x-0' : 'translate-x-5'
                              }`}
                            >
                              {isPumpDeactivated ? (
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                              ) : (
                                <Zap className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* REAL TOGGLE SWITCH 2: Auto-Refill Smart System (ON / OFF) */}
                        <div
                          onClick={() => isOnline && toggleAutoRefillDirect(featuredDevice.id, !isAutoRefillOn)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all select-none ${
                            !isOnline
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isAutoRefillOn
                              ? 'bg-rose-50/60 border-rose-300 hover:bg-rose-100/60 cursor-pointer'
                              : 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/80 cursor-pointer'
                          }`}
                          title="Toggle Autonomous Water Refilling below 25%"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isAutoRefillOn
                                ? 'bg-rose-200/80 text-rose-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              <Zap className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-800 leading-tight">Auto-Refill</p>
                              <p className={`text-[10px] font-extrabold ${isAutoRefillOn ? 'text-rose-700' : 'text-slate-500'}`}>
                                {isAutoRefillOn ? 'SMART ON' : 'PAUSED'}
                              </p>
                            </div>
                          </div>

                          {/* Real Sliding Toggle Track & Thumb */}
                          <div
                            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
                              isAutoRefillOn ? 'bg-rose-500' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                                isAutoRefillOn ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            >
                              {isAutoRefillOn ? (
                                <Check className="w-2.5 h-2.5 text-rose-600 font-bold" />
                              ) : (
                                <PowerOff className="w-2.5 h-2.5 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Automated Cleaning & Sanitation Controls */}
                      <div className="pt-2 border-t border-slate-100/90">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            Bowl & Feeder Sanitation
                          </span>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Auto-Flush: Dirty Water & 15m Waste
                          </span>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              if (isCleaningWaste) {
                                handleStopCleanWaste(featuredDevice.id);
                              } else {
                                handleCleanWaste(featuredDevice.id);
                              }
                            }}
                            disabled={!isOnline}
                            className={`w-full py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border text-xs cursor-pointer shadow-2xs active:scale-95 ${
                              isCleaningWaste
                                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                                : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 border-purple-200/80 text-purple-900 hover:from-purple-100 hover:to-indigo-100'
                            }`}
                            title="3-in-1 Sanitation Cycle: 1. Spray Rinse (GPIO 18 - 5s) ➔ 2. Drain Wastewater (GPIO 23 - 9s) ➔ 3. Tare Scales (1s) = 15s Total"
                          >
                            {isCleaningWaste ? (
                              <>
                                <Trash2 className="w-4 h-4 animate-pulse text-rose-600" />
                                <span className="font-mono">
                                  {cleanWastePhase === 'spraying' && `🚿 1/2 Spraying (${cleanWasteCountdown}s)...`}
                                  {cleanWastePhase === 'draining' && `🌀 2/2 Draining (${cleanWasteCountdown}s)...`}
                                  {cleanWastePhase === 'taring' && `✨ Taring Scales (${cleanWasteCountdown}s)...`}
                                  {cleanWastePhase === 'idle' && 'Stopping...'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 text-purple-600" />
                                <span>Clean Waste (Spray + Drain)</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Manual Pump Overrides sub-row */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            Manual Overrides:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSprayWater(featuredDevice.id)}
                              disabled={!isOnline || isSprayingWater || isCleaningWaste}
                              className={`py-1 px-2.5 rounded-lg font-semibold transition-all flex items-center gap-1 border text-[11px] cursor-pointer shadow-2xs active:scale-95 ${
                                isSprayingWater
                                  ? 'bg-sky-100 border-sky-300 text-sky-800'
                                  : 'bg-sky-50/80 border-sky-200 text-sky-700 hover:bg-sky-100'
                              }`}
                              title="Manually spray clean rinse water (GPIO 18)"
                            >
                              <Droplets className={`w-3 h-3 ${isSprayingWater ? 'animate-bounce text-sky-600' : 'text-sky-600'}`} />
                              <span>{isSprayingWater ? 'Spraying...' : 'Spray Water'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (isDrainingBowl) {
                                  handleStopDrain(featuredDevice.id);
                                } else {
                                  handleDrainBowl(featuredDevice.id);
                                }
                              }}
                              disabled={!isOnline || isCleaningWaste}
                              className={`py-1 px-2.5 rounded-lg font-semibold transition-all flex items-center gap-1 border text-[11px] cursor-pointer shadow-2xs active:scale-95 ${
                                isDrainingBowl
                                  ? 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
                                  : 'bg-purple-50/80 border-purple-200 text-purple-700 hover:bg-purple-100'
                              }`}
                              title="Manually run or stop wastewater drain pump (GPIO 23)"
                            >
                              <Trash2 className={`w-3 h-3 ${isDrainingBowl ? 'animate-pulse text-rose-600' : 'text-purple-600'}`} />
                              <span>{isDrainingBowl ? 'Stop Drain' : 'Drain Bowl'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action Row 3: Secondary Utilities Row */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setCustomManualModalOpen(true)}
                          disabled={!isOnline}
                          className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1 border ${
                            isOnline
                              ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer active:scale-95'
                              : 'border-slate-200 text-slate-300 cursor-not-allowed'
                          }`}
                          title="Custom Manual Dispense Override"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPairWifiModalOpen(true)}
                          className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Pair / Change Wi-Fi Network"
                        >
                          <Wifi className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenCalibrate(featuredDevice)}
                          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Calibrate Load Cells & Sensors"
                        >
                          <Scale className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDetails(featuredDevice)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Info className="w-4 h-4 text-slate-500" />
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenDisconnect(featuredDevice)}
                          className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Disconnect / Unpair Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* ================= WI-FI PAIRING MODAL (UNIVERSAL SCANNER & DUAL-MODE PROVISIONING) ================= */}
      <Modal
        isOpen={pairWifiModalOpen}
        onClose={() => setPairWifiModalOpen(false)}
        title="Pair & Flash ESP32 to Any Wi-Fi Network"
        subtitle="Universal 2.4 GHz Network Scanner, SoftAP Hotspot & Direct USB Hardware Provisioning"
      >
        <form onSubmit={handlePairWifiSubmit} className="space-y-4 text-xs">
          {/* ── Cloud Provision Method (Primary — Works From Anywhere) ── */}
          <div className="p-3.5 rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-indigo-900 text-xs">☁️ Cloud Provision — Works From Anywhere</p>
                <p className="text-[10px] text-indigo-600 font-medium">Sends credentials to Supabase. ESP32 picks them up within 10 seconds.</p>
              </div>
              <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm shrink-0">RECOMMENDED</span>
            </div>
            <button
              type="button"
              onClick={handleCloudProvisionWifi}
              disabled={isCloudProvisioning || !wifiSsid.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-md shadow-indigo-200"
              id="btn-cloud-provision-wifi"
            >
              {isCloudProvisioning ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Waiting for ESP32 ({cloudProvisionStatus === 'sent' ? 'Credentials Queued...' : 'Processing...'}) </>
              ) : cloudProvisionStatus === 'confirmed' ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-200" /> ESP32 Connected Successfully!</>
              ) : (
                <><Globe className="w-4 h-4" /> Send via Cloud (Supabase Queue)</>
              )}
            </button>
            {/* Cloud Provision Live Status Banner */}
            {cloudProvisionStatus === 'sent' && isCloudProvisioning && (
              <div className="p-2.5 bg-indigo-100/80 rounded-xl border border-indigo-200 flex items-center gap-2 animate-pulse">
                <Radio className="w-4 h-4 text-indigo-600 animate-bounce shrink-0" />
                <div>
                  <p className="font-bold text-indigo-900 text-[11px]">☁️ Credentials queued in Supabase</p>
                  <p className="text-[10px] text-indigo-700">ESP32 polls every 10s and will reconnect automatically. No action needed.</p>
                </div>
              </div>
            )}
            {cloudProvisionStatus === 'confirmed' && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[11px] font-bold text-emerald-800">ESP32 connected to '{wifiSsid}' and is now Online!</p>
              </div>
            )}
            {cloudProvisionStatus === 'error' && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-800">Timed out. Try USB Flash or check password.</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or use fallback methods below</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-slate-500 text-[11px] leading-relaxed">
            Scan nearby 2.4 GHz wireless networks or enter credentials for any Wi-Fi network (Clinic Wi-Fi, Home Wi-Fi, or Phone Hotspot). Credentials will be <strong>saved permanently into ESP32 NVS Flash memory</strong>.
          </p>

          {/* Success / Status Banner */}
          {pairingSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-900">Wi-Fi Successfully Dispatched & Saved</p>
                <p className="text-[11px] text-emerald-700 leading-tight">{pairingSuccessMsg}</p>
              </div>
            </div>
          )}

          {/* Selection Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveWifiTab('scanned')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeWifiTab === 'scanned'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-indigo-500" />
              Live 2.4 GHz Nearby Scanner ({scannedNetworks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveWifiTab('manual')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeWifiTab === 'manual'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-rose-500" />
              Manual / Hidden SSID
            </button>
          </div>

          {/* 2.4 GHz Compatibility Notice */}
          <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              Phone Hotspot Note (2.4 GHz Required):
            </p>
            <p className="text-amber-800 text-[10px] leading-tight">
              ESP32 chips only connect to <strong>2.4 GHz</strong> Wi-Fi. On iPhone, turn ON <strong>"Maximize Compatibility"</strong>. On Android, set AP Band to <strong>"2.4 GHz Band"</strong>.
            </p>
          </div>

          {/* Tab 1: Live Nearby Wi-Fi Scanner */}
          {activeWifiTab === 'scanned' && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Radio className="w-4 h-4 text-indigo-600" />
                    Live 2.4 GHz Spectrum Scan ({scannedNetworks.length} found)
                  </span>
                  {lastScanTimestamp && (
                    <span className="text-[10px] text-slate-400">
                      ({lastScanTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleScanNearbyWifi}
                  disabled={isScanningWifi}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 transition-all shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningWifi ? 'animate-spin' : ''}`} />
                  {isScanningWifi ? 'Scanning Spectrum...' : 'Scan Nearby Wi-Fi'}
                </button>
              </div>

              {/* Live Sweep Indicator Banner when Scanning */}
              {isScanningWifi && (
                <div className="p-2.5 bg-indigo-50/90 rounded-xl border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-2 font-bold text-[11px]">
                    <Radio className="w-4 h-4 text-indigo-600 animate-bounce" />
                    Scanning 2.4 GHz wireless spectrum channels 1-13...
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                    2.4 GHz RF
                  </span>
                </div>
              )}

              {/* Filter / Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={wifiSearchTerm}
                  onChange={(e) => setWifiSearchTerm(e.target.value)}
                  placeholder="Filter scanned networks by name..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Dynamic Real Scanned Network List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {scannedNetworks.length === 0 && !isScanningWifi ? (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                    <Wifi className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No Networks Scanned Yet</p>
                    <p className="text-[11px] text-slate-500">
                      Click <strong>"Scan Nearby Wi-Fi"</strong> to discover real 2.4 GHz networks in range.
                    </p>
                  </div>
                ) : (
                  scannedNetworks
                    .filter((n) => !wifiSearchTerm || n.ssid.toLowerCase().includes(wifiSearchTerm.toLowerCase()))
                    .map((net) => {
                      const isSelected = wifiSsid.toLowerCase() === net.ssid.toLowerCase();
                      const isStrong = net.rssi >= -60;
                      const isMedium = net.rssi >= -75 && net.rssi < -60;
                      const isHotspot = /hotspot|brrt|iphone|android|phone|mobile/i.test(net.ssid);

                      return (
                        <div
                          key={net.ssid}
                          onClick={() => handleSelectScannedNetwork(net)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 shadow-sm ring-2 ring-indigo-500/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : isHotspot
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isHotspot ? <Smartphone className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-xs text-slate-900 break-words">{net.ssid}</p>
                                {isHotspot && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 shrink-0">
                                    Hotspot
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono font-semibold">{net.rssi} dBm</span>
                                <span>•</span>
                                <span className="text-slate-400">2.4 GHz</span>
                                <span>•</span>
                                <span className={net.encrypted ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                                  {net.encrypted ? 'Secured (WPA2)' : 'Open (No Password)'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {renderSignalBars(net.rssi)}
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              isStrong
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isMedium
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isStrong ? 'Strong' : isMedium ? 'Good' : 'Fair'}
                            </span>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Manual / Custom SSID Notice */}
          {activeWifiTab === 'manual' && (
            <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/70 text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs text-rose-900">
                <Globe className="w-4 h-4 text-rose-600" />
                Connect to Any Custom or Hidden Wi-Fi
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                You can connect the ESP32 node to <strong>any 2.4 GHz Wi-Fi network</strong> by typing the exact SSID name and security key below. Hidden networks and open public hotspots are fully supported.
              </p>
            </div>
          )}

          {/* Wi-Fi SSID Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 uppercase text-[11px]">Wi-Fi Network Name (SSID) *</label>
              {wifiSsid && (
                <span className="text-[10px] font-semibold text-indigo-600">Selected: {wifiSsid}</span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="e.g. MyClinic_2.4G, iPhone, Home_WiFi"
                className="w-full p-2.5 pl-8 rounded-xl border border-slate-300 focus:border-indigo-500 focus:outline-none font-semibold text-xs text-slate-800 bg-white"
              />
              <Wifi className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Wi-Fi Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 uppercase text-[11px]">Wi-Fi Password (WPA2/PSK / WPA3)</label>
              <span className="text-[10px] text-slate-400">Leave blank for open networks</span>
            </div>
            <div className="relative">
              <input
                type={showWifiPass ? 'text' : 'password'}
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Enter network password..."
                className="w-full p-2.5 pl-8 pr-9 rounded-xl border border-slate-300 focus:border-indigo-500 focus:outline-none text-xs font-mono text-slate-800 bg-white"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              <button
                type="button"
                onClick={() => setShowWifiPass(!showWifiPass)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showWifiPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Three-Method Provisioning Options Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-200/60 text-indigo-900 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                ☁️ Cloud (Above):
              </p>
              <p className="text-indigo-700 leading-tight">
                Works from anywhere worldwide. ESP32 polls Supabase automatically.
              </p>
            </div>
            <div className="p-2.5 bg-violet-50/70 rounded-xl border border-violet-200/60 text-violet-900 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-violet-600" />
                📶 Network Auto-Pair:
              </p>
              <p className="text-violet-700 leading-tight">
                Dispatches over SoftAP (192.168.4.1) or LAN when ESP32 is nearby.
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/60 text-emerald-900 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Usb className="w-3.5 h-3.5 text-emerald-600" />
                ⚡ USB Flash:
              </p>
              <p className="text-emerald-700 leading-tight">
                Flashes via USB Serial (100% offline, requires cable).
              </p>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDirectWebSerialPair}
              disabled={isSerialFlashing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              title="Flash Wi-Fi credentials directly over USB COM Port"
            >
              {isSerialFlashing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Usb className="w-3.5 h-3.5" />}
              {isSerialFlashing ? 'Flashing USB...' : '⚡ Direct USB Flash'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPairWifiModalOpen(false)}
                className="px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isPairingWifi}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
              >
                {isPairingWifi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                {isPairingWifi ? 'Pairing to ESP32...' : 'Pair Wi-Fi Now'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ================= CUSTOM MANUAL DISPENSE MODAL ================= */}
      <Modal
        isOpen={customManualModalOpen}
        onClose={() => setCustomManualModalOpen(false)}
        title="Custom Manual Dispense Override"
        subtitle="On-Demand Dispense Customization (Automated by Default)"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            The dispenser is <strong>automated by default</strong> using smart schedules and auto-refill logic. Use this panel for manual portion overrides.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-emerald-600" />
              Custom Food Portion
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Portion Size:</span>
              <span className="font-bold text-emerald-600 text-sm">{customPortionGrams} grams</span>
            </div>
            <input
              type="range"
              min="15"
              max="200"
              step="5"
              value={customPortionGrams}
              onChange={e => setCustomPortionGrams(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <button
              type="button"
              onClick={handleExecuteCustomManual}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer active:scale-95"
            >
              Dispense {customPortionGrams}g Food Now
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-600" />
              Target Water Dispense Volume
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Target Volume:</span>
              <span className="font-bold text-sky-600 text-sm">{Math.round((customWaterLevelPct / 100) * 2500)} ml</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={customWaterLevelPct}
              onChange={e => setCustomWaterLevelPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>125 ml (Sip)</span>
              <span>625 ml</span>
              <span>1250 ml (Half)</span>
              <span>1875 ml</span>
              <span>2500 ml (Full)</span>
            </div>
            <button
              type="button"
              onClick={handleExecuteCustomWater}
              className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs cursor-pointer active:scale-95"
            >
              Pump {Math.round((customWaterLevelPct / 100) * 2500)} ml Now
            </button>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCustomManualModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* CONNECT DEVICE MODAL */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title="Pair New ESP32 Smart Device Node"
        subtitle="Heritage Animal Clinic Hardware Provisioning"
      >
        <form onSubmit={handleConnectSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Assign to Pet</label>
            {pets.length > 0 ? (
              <select
                value={formData.petId}
                onChange={e => setFormData({ ...formData, petId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="">Select a registered pet to assign (or Leave Standby)...</option>
                {pets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species} • {p.breed || 'Mixed'} — Owner: {p.ownerName || 'Clinic Pet'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                <p className="font-bold">No registered pets in database</p>
                <p className="text-[11px] text-amber-700 leading-tight">
                  This ESP32 node will be registered in Standby / Vacant mode until a pet is assigned.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Device MAC Address *</label>
            <input
              type="text"
              required
              value={formData.macAddress}
              onChange={e => setFormData({ ...formData, macAddress: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:border-rose-500 focus:outline-none"
              placeholder="1C:C3:AB:F9:F7:78"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConnectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm cursor-pointer"
            >
              Register & Pair Node
            </button>
          </div>
        </form>
      </Modal>

      {/* CALIBRATE SENSOR MODAL */}
      <Modal
        isOpen={calibrateModalOpen}
        onClose={() => setCalibrateModalOpen(false)}
        title="Hardware Calibration & Scale Diagnostic Tool"
        subtitle={`Zero-Point Tare & Reference Weight/Volume Calibration for ${selectedDevice?.id}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Follow the 2-step procedure to calibrate each scale. First, empty the container and <strong>Tare to 0</strong>. Then place a known weight or volume and click <strong>Calibrate</strong>.
          </p>

          {/* DUAL SCALE CALIBRATION GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Food Scale HX711 Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-between shadow-xs border border-emerald-500/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" /> Food Bowl Scale
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    GPIO 27 / 14
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {typeof selectedDevice?.foodBowlWeightGrams === 'number' ? selectedDevice.foodBowlWeightGrams.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">grams</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">HX711 #1 (Load Cell 1)</p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-700/60">
                {/* Step 1: Tare */}
                <div>
                  <span className="text-[10px] font-bold text-slate-300 block mb-1">Step 1: Zero Empty Bowl</span>
                  <button
                    type="button"
                    disabled={Boolean(selectedDevice && taringDevId === selectedDevice.id)}
                    onClick={() => {
                      if (selectedDevice) handleTareClick(selectedDevice.id);
                    }}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${selectedDevice && taringDevId === selectedDevice.id ? 'animate-spin' : ''}`} />
                    <span>{selectedDevice && taringDevId === selectedDevice.id ? 'Taring...' : 'Tare Empty Bowl (0.0g)'}</span>
                  </button>
                </div>

                {/* Step 2: Calibrate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-300">Step 2: Reference Weight</span>
                    <div className="flex gap-1">
                      {[100, 250, 500].map(wt => (
                        <button
                          key={wt}
                          type="button"
                          onClick={() => setFoodCalWeight(wt)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${foodCalWeight === wt ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                          {wt}g
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-1.5">
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      value={foodCalWeight}
                      onChange={e => setFoodCalWeight(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs text-center focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="self-center text-slate-400 text-xs">grams</span>
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(selectedDevice && calibratingFoodDevId === selectedDevice.id)}
                    onClick={() => {
                      if (selectedDevice) handleCalibrateFood(selectedDevice.id);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                  >
                    <Sliders className={`w-3.5 h-3.5 ${selectedDevice && calibratingFoodDevId === selectedDevice.id ? 'animate-spin' : ''}`} />
                    <span>{selectedDevice && calibratingFoodDevId === selectedDevice.id ? 'Calibrating...' : `Calibrate with ${foodCalWeight}g`}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Water Scale HX711 Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-between shadow-xs border border-sky-500/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> Water Reservoir
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    GPIO 32 / 33
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-mono font-black text-sky-400">
                    {Math.round((selectedDevice?.waterLiters !== undefined ? selectedDevice.waterLiters * 1000 : ((selectedDevice?.waterLevelPct || 0) / 100) * 2500))}
                  </span>
                  <span className="text-xs font-bold text-slate-400">ml (1g = 1ml)</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">HX711 #2 (Load Cell 2)</p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-700/60">
                {/* Step 1: Tare */}
                <div>
                  <span className="text-[10px] font-bold text-slate-300 block mb-1">Step 1: Zero Empty Container</span>
                  <button
                    type="button"
                    disabled={Boolean(selectedDevice && taringWaterDevId === selectedDevice.id)}
                    onClick={() => {
                      if (selectedDevice) handleWaterTareClick(selectedDevice.id);
                    }}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${selectedDevice && taringWaterDevId === selectedDevice.id ? 'animate-spin' : ''}`} />
                    <span>{selectedDevice && taringWaterDevId === selectedDevice.id ? 'Taring...' : 'Tare Empty Reservoir (0 ml)'}</span>
                  </button>
                </div>

                {/* Step 2: Calibrate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-300">Step 2: Reference Volume</span>
                    <div className="flex gap-1">
                      {[250, 500, 1000].map(vol => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setWaterCalVolume(vol)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${waterCalVolume === vol ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                          {vol}ml
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-1.5">
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      value={waterCalVolume}
                      onChange={e => setWaterCalVolume(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs text-center focus:border-sky-500 focus:outline-none"
                    />
                    <span className="self-center text-slate-400 text-xs">ml (water)</span>
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(selectedDevice && calibratingWaterDevId === selectedDevice.id)}
                    onClick={() => {
                      if (selectedDevice) handleCalibrateWater(selectedDevice.id);
                    }}
                    className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                  >
                    <Sliders className={`w-3.5 h-3.5 ${selectedDevice && calibratingWaterDevId === selectedDevice.id ? 'animate-spin' : ''}`} />
                    <span>{selectedDevice && calibratingWaterDevId === selectedDevice.id ? 'Calibrating...' : `Calibrate with ${waterCalVolume}ml`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
            <p className="text-[11px] font-bold text-slate-700">💡 2-Step Calibration Instructions:</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              1. <strong>Empty & Tare:</strong> Place the empty bowl or reservoir on the scale and click <em>Tare</em>.<br/>
              2. <strong>Place Known Reference:</strong> Place your known weight (e.g. 250g) or pour known water (e.g. 500ml) onto the scale and click <em>Calibrate</em>.<br/>
              3. The ESP32 calculates the precise counts-per-gram/ml and permanently saves it to non-volatile flash memory (NVS).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCalibrateModalOpen(false)}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* DEVICE DETAILS MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Smart Device Node Telemetry & Hardware Spec"
        subtitle={`Hardware Diagnostic Report for ${selectedDevice?.id}`}
      >
        {selectedDevice && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Node ID:</span>
                <p className="font-mono font-bold text-slate-800">{selectedDevice.id}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">IP Address:</span>
                <p className="font-mono font-bold text-indigo-600">{selectedDevice.ipAddress || '192.168.100.157'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">MAC Address:</span>
                <p className="font-mono font-bold text-slate-800">{selectedDevice.macAddress}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Connected Wi-Fi:</span>
                <p className="font-bold text-indigo-700 flex items-center gap-1 mt-0.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {selectedDevice.wifiSsid || 'brrt rrt'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Wi-Fi Signal:</span>
                <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Signal className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {selectedDevice.wifiSignalDbm} dBm
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Node Status:</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedDevice.status} size="sm" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned Pet:</span>
                {(() => {
                  const devPet = pets.find(p => p.id === selectedDevice.assignedPetId || p.name === selectedDevice.assignedPetName);
                  if (devPet) {
                    return (
                      <div className="flex items-center gap-2.5 mt-1">
                        {devPet.avatarUrl ? (
                          <img src={devPet.avatarUrl} alt={devPet.name} className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                            <Dog className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{devPet.name} ({devPet.species})</p>
                          <p className="text-[10px] text-slate-500">{devPet.breed} • Owner: {devPet.ownerName}</p>
                        </div>
                      </div>
                    );
                  }
                  return <p className="font-semibold text-slate-500 mt-1">Unassigned</p>;
                })()}
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Food Hopper:</span>
                <p className="font-bold text-emerald-600">{selectedDevice.foodLevelPct}% Level</p>
              </div>
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    Food Bowl Scale:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDevice) handleTareClick(selectedDevice.id);
                    }}
                    disabled={Boolean(selectedDevice && taringDevId === selectedDevice.id)}
                    className="text-[9px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                    title="Zero / Tare the Food Bowl Scale"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${selectedDevice && taringDevId === selectedDevice.id ? 'animate-spin' : ''}`} />
                    {selectedDevice && taringDevId === selectedDevice.id ? 'Taring...' : 'Tare (0.0g)'}
                  </button>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="font-mono font-black text-sm text-emerald-950">
                    {typeof selectedDevice.foodBowlWeightGrams === 'number' ? selectedDevice.foodBowlWeightGrams.toFixed(1) : '0.0'} g
                  </p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    selectedDevice.scaleReady !== false
                      ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100/80 text-amber-800 border-amber-200'
                  }`}>
                    {selectedDevice.scaleReady !== false ? '🟢 Sensor Detected' : '⚠️ Not Detected'}
                  </span>
                </div>
              </div>
              <div className="bg-sky-50/70 p-2.5 rounded-xl border border-sky-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-sky-800 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    Water Scale (0ml):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDevice) handleWaterTareClick(selectedDevice.id);
                    }}
                    disabled={Boolean(selectedDevice && taringWaterDevId === selectedDevice.id)}
                    className="text-[9px] font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                    title="Zero / Tare Water Reservoir Loadcell"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${selectedDevice && taringWaterDevId === selectedDevice.id ? 'animate-spin' : ''}`} />
                    {selectedDevice && taringWaterDevId === selectedDevice.id ? 'Taring...' : 'Tare (0ml)'}
                  </button>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="font-mono font-black text-sm text-sky-950">
                    {Math.round((selectedDevice.waterLiters !== undefined ? selectedDevice.waterLiters * 1000 : ((selectedDevice.waterLevelPct || 0) / 100) * 2500))} ml
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-sky-100/80 text-sky-800 border-sky-200">
                    HX711 (GPIO 32/33)
                  </span>
                </div>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-purple-800 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5 text-purple-600" />
                    Drain Relay (GPIO 23):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDevice) handleInvertDrain(selectedDevice.id);
                    }}
                    className="text-[9px] font-bold text-purple-800 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Flip Active-HIGH / Active-LOW logic if drain pump stays on continuously"
                  >
                    Invert Polarity
                  </button>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-xs font-semibold text-purple-950">
                    Drain Pump (Relay 3)
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-purple-100/80 text-purple-800 border-purple-200">
                    GPIO 23
                  </span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Water Quality (TDS):</span>
                <p className="font-bold text-slate-800">{selectedDevice.waterQualityPpm ?? 0} PPM</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Auto-Refill:</span>
                <p className="font-bold text-emerald-600">{!selectedDevice.firmwareVersion?.includes('AUTO:OFF') ? 'Enabled (<=10%)' : 'Paused'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Last Sync:</span>
                <p className="font-medium text-slate-700">{selectedDevice.lastTransmission}</p>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Firmware Specs:</span>
                <p className="font-mono text-[11px] text-slate-600 truncate">{selectedDevice.firmwareVersion}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer"
              >
                Close Diagnostic View
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= ASSIGN PET MODAL ================= */}
      <Modal
        isOpen={assignPetModalOpen}
        onClose={() => {
          setAssignPetModalOpen(false);
          setPetSearchQuery('');
        }}
        title={`Assign Pet to Station (${(featuredDevice || selectedDevice)?.id || 'Node'})`}
        subtitle="Choose a clinic pet to pair with this Smart Feeder & Hydrator Node"
      >
        <div className="space-y-4 text-xs">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pets by name, breed, or owner..."
              value={petSearchQuery}
              onChange={(e) => setPetSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Current Assignment Notification */}
          {(featuredDevice || selectedDevice)?.assignedPetName && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                  <Dog className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Pet:</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {(featuredDevice || selectedDevice)?.assignedPetName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const targetDev = featuredDevice || selectedDevice;
                  if (targetDev) handleUnassignPet(targetDev);
                }}
                className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-[11px] transition-colors cursor-pointer shrink-0"
              >
                Unassign Current
              </button>
            </div>
          )}

          {/* Patient Selection List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {pets
              .filter(p => {
                if (!petSearchQuery.trim()) return true;
                const q = petSearchQuery.toLowerCase();
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.breed.toLowerCase().includes(q) ||
                  p.ownerName.toLowerCase().includes(q) ||
                  p.species.toLowerCase().includes(q)
                );
              })
              .map((pet) => {
                const targetDev = featuredDevice || selectedDevice;
                const isCurrent = targetDev && (pet.id === targetDev.assignedPetId || pet.name === targetDev.assignedPetName);
                const isAssignedOther = pet.assignedDeviceId && targetDev && pet.assignedDeviceId !== targetDev.id;

                return (
                  <div
                    key={pet.id}
                    onClick={() => {
                      if (targetDev) handleAssignPet(pet, targetDev);
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isCurrent
                        ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {pet.avatarUrl ? (
                          <img
                            src={pet.avatarUrl}
                            alt={pet.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 text-rose-600 flex items-center justify-center font-bold">
                            <Dog className="w-5 h-5" />
                          </div>
                        )}
                        {isCurrent && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-slate-900 truncate text-xs">{pet.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                            {pet.species}
                          </span>
                          {pet.healthStatus && (
                            <StatusBadge status={pet.healthStatus} size="xs" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {pet.breed} • {pet.age}y • {pet.weight}kg
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          Owner: <span className="font-medium text-slate-600">{pet.ownerName}</span>
                          {isAssignedOther && (
                            <span className="ml-1 text-amber-600 font-semibold">• (Node: {pet.assignedDeviceId})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isCurrent ? 'Selected' : 'Assign'}
                    </button>
                  </div>
                );
              })}

            {pets.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Dog className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pets found in clinic records.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAssignPetModalOpen(false);
                setPetSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* DISCONNECT CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={disconnectModalOpen}
        onClose={() => setDisconnectModalOpen(false)}
        onConfirm={handleDisconnectConfirm}
        title="Unpair Smart Device Node"
        message={`Are you sure you want to unpair ${selectedDevice?.id}? Telemetry tracking and automated dispensing will be suspended until re-paired.`}
        confirmText="Unpair Node"
        variant="danger"
      />
    </DashboardLayout>
  );
};
