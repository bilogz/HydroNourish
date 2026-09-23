/**
 * ============================================================================
 *  HydroNourish CameraSetupStudioModal - Direct Web Setup & Smoothness Studio
 * ============================================================================
 *  - 1-Click WebSerial USB Setup (Zero Local AP or Terminal Needed)
 *  - Remote Wi-Fi & Cloud Auto-Sync (via Supabase and Image Beacon Dispatch)
 *  - Real-time Stream Smoothness Presets (30 FPS Ultra-Smooth / Balanced / HD)
 *  - Hardware Sensor Calibration (Flip, Mirror, Flashlight, Brightness, Contrast)
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  Usb,
  Sliders,
  Check,
  RefreshCw,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FlipHorizontal,
  FlipVertical,
  SunMedium,
  Gauge,
  Sparkles,
  Layers,
  Terminal,
  Cpu
} from 'lucide-react';
import { useAppContext } from '../../hooks/useAppContext';
import { updateDeviceInSupabase } from '../../services/supabase';

interface CameraSetupStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraIp: string;
  onUpdateCameraIp: (ip: string) => void;
  currentPreset?: 'smooth' | 'balanced' | 'hd';
  onApplyPreset?: (preset: 'smooth' | 'balanced' | 'hd') => void;
  deviceId?: string;
  isStreamOnline?: boolean;
}

interface ScannedNetwork {
  ssid: string;
  rssi: number;
  encrypted: boolean;
}

export const CameraSetupStudioModal: React.FC<CameraSetupStudioModalProps> = ({
  isOpen,
  onClose,
  cameraIp,
  onUpdateCameraIp,
  currentPreset = 'balanced',
  onApplyPreset,
  deviceId = 'HN-NODE-F778',
  isStreamOnline = true
}) => {
  const { showToast, devices } = useAppContext();

  const [activeTab, setActiveTab] = useState<'smoothness' | 'usb' | 'wifi' | 'optics'>(() => {
    return isStreamOnline ? 'smoothness' : 'wifi';
  });

  // ── Stream Smoothness & Presets ──
  const [selectedPreset, setSelectedPreset] = useState<'smooth' | 'balanced' | 'hd'>(currentPreset);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  // ── Wi-Fi Setup State ──
  const [wifiSsid, setWifiSsid] = useState('Garcia Wifi 4G Wifi');
  const [wifiPassword, setWifiPassword] = useState('GaRCi4F4m');
  const [showPassword, setShowPassword] = useState(false);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [isPairingWifi, setIsPairingWifi] = useState(false);
  const [scannedNetworks, setScannedNetworks] = useState<ScannedNetwork[]>([]);
  const [wifiPairResult, setWifiPairResult] = useState<{ success: boolean; msg: string } | null>(null);

  // ── WebSerial USB Setup State ──
  const [isSerialPairing, setIsSerialPairing] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [serialStatus, setSerialStatus] = useState<'idle' | 'connecting' | 'flashing' | 'connected' | 'error'>('idle');

  // ── Hardware Sensor Calibration ──
  const [vflip, setVflip] = useState(false);
  const [hmirror, setHmirror] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [flashLed, setFlashLed] = useState(false);

  // ── Manual IP Override ──
  const [manualIpInput, setManualIpInput] = useState(cameraIp);

  useEffect(() => {
    setManualIpInput(cameraIp);
  }, [cameraIp]);

  if (!isOpen) return null;

  const cleanIp = (cameraIp || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

  // Helper to dispatch non-blocking HTTP requests to Camera IP & mDNS
  const sendCameraControl = (varName: string, val: string | number) => {
    const endpoints = [
      `http://${cleanIp}/control?var=${varName}&val=${val}`,
      `http://${cleanIp}:81/control?var=${varName}&val=${val}`,
      `http://hydronourish-cam.local/control?var=${varName}&val=${val}`,
      `http://192.168.4.1/control?var=${varName}&val=${val}`
    ];

    for (const ep of endpoints) {
      try {
        fetch(ep, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      } catch {}
      try {
        const img = new Image();
        img.src = `${ep}&_t=${Date.now()}`;
      } catch {}
    }
  };

  // ── Apply Smoothness Preset ──────────────────────────────────────────────
  const handleSelectSmoothnessPreset = async (preset: 'smooth' | 'balanced' | 'hd') => {
    setSelectedPreset(preset);
    setIsApplyingPreset(true);

    try {
      sendCameraControl('preset', preset);
      localStorage.setItem('hn_cam_preset', preset);

      if (onApplyPreset) {
        onApplyPreset(preset);
      }

      // Also sync to Supabase so remote camera picks it up on next heartbeat
      await updateDeviceInSupabase(deviceId, {
        firmwareVersion: `ESP32|CAM_PRESET:${preset}|CAM:${cleanIp}`
      });

      showToast(
        'success',
        preset === 'smooth'
          ? '⚡ Ultra-Smooth 30 FPS Activated'
          : preset === 'hd'
          ? '💎 High-Definition Mode Active'
          : '⚖️ Balanced Mode Active',
        preset === 'smooth'
          ? 'Optimized CIF mode with ultra-low latency. High framerate on slow Wi-Fi!'
          : preset === 'hd'
          ? 'High-res SVGA mode for maximum optical detail.'
          : 'Standard VGA resolution with balanced 20-25 FPS.'
      );
    } catch {
      // Continue gracefully
    } finally {
      setIsApplyingPreset(false);
    }
  };

  // ── Toggle Sensor Flip / Mirror ───────────────────────────────────────────
  const handleToggleFlip = () => {
    const next = !vflip;
    setVflip(next);
    sendCameraControl('vflip', next ? 1 : 0);
    showToast('info', 'Vertical Flip Toggled', next ? 'Camera image inverted 180°.' : 'Normal vertical orientation.');
  };

  const handleToggleMirror = () => {
    const next = !hmirror;
    setHmirror(next);
    sendCameraControl('hmirror', next ? 1 : 0);
    showToast('info', 'Horizontal Mirror Toggled', next ? 'Camera image mirrored horizontally.' : 'Normal horizontal orientation.');
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    sendCameraControl('brightness', val);
  };

  const handleContrastChange = (val: number) => {
    setContrast(val);
    sendCameraControl('contrast', val);
  };

  const handleToggleFlashlight = () => {
    const next = !flashLed;
    setFlashLed(next);
    sendCameraControl('flash', next ? 1 : 0);
    showToast('info', next ? '💡 Flashlight Active' : '🌑 Flashlight Off', `GPIO 4 LED is now ${next ? 'ON' : 'OFF'}.`);
  };

  // ── Scan 2.4 GHz Networks on Camera ──────────────────────────────────────
  const handleScanWifi = async () => {
    setIsScanningWifi(true);
    setWifiPairResult(null);

    const scanEndpoints = [
      `http://${cleanIp}/api/wifi/scan`,
      `http://hydronourish-cam.local/api/wifi/scan`,
      `http://192.168.4.1/api/wifi/scan`
    ];

    let foundNetworks: ScannedNetwork[] = [];

    for (const url of scanEndpoints) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.networks)) {
            foundNetworks = data.networks.filter((n: ScannedNetwork) => n.ssid);
            break;
          }
        }
      } catch {}
    }

    setScannedNetworks(foundNetworks);
    setIsScanningWifi(false);

    if (foundNetworks.length > 0) {
      showToast('success', 'Scan Complete', `Discovered ${foundNetworks.length} 2.4 GHz Wi-Fi networks in range.`);
    } else {
      showToast('info', 'Scan Complete', 'Type your Wi-Fi SSID manually below.');
    }
  };

  // ── Pair Wi-Fi Over Direct Beacon & Supabase Cloud Queue ──────────────────
  const handlePairWifiDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiSsid.trim()) {
      showToast('warning', 'Missing SSID', 'Please enter your Wi-Fi network name.');
      return;
    }

    setIsPairingWifi(true);
    setWifiPairResult(null);

    const queryStr = `ssid=${encodeURIComponent(wifiSsid.trim())}&password=${encodeURIComponent(wifiPassword.trim())}&_t=${Date.now()}`;
    const payload = JSON.stringify({ ssid: wifiSsid.trim(), password: wifiPassword.trim() });

    // 1. Direct Image Beacons (bypasses browser mixed-content)
    const targets = [cleanIp, 'hydronourish-cam.local', '192.168.4.1', '192.168.100.159', '192.168.100.157'];
    for (const t of targets) {
      if (t) {
        try {
          const ping = new Image();
          ping.src = `http://${t}/api/wifi/pair?${queryStr}`;
        } catch {}
        try {
          fetch(`http://${t}/api/wifi/pair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            mode: 'no-cors'
          }).catch(() => {});
        } catch {}
      }
    }

    // 2. Cloud Supabase Queue (Camera polls Supabase every 30s)
    try {
      await updateDeviceInSupabase(deviceId, {
        firmwareVersion: `ESP32|CAM_PAIR:${wifiSsid.trim()},${wifiPassword.trim()}`
      });
    } catch {}

    setWifiPairResult({
      success: true,
      msg: `Credentials dispatched for "${wifiSsid}"! Connecting now... Waiting for camera announcement.`
    });
    showToast('info', 'Wi-Fi Dispatched', `Pairing camera to ${wifiSsid}...`);

    // 3. Watch for new camera IP in Supabase
    let checks = 0;
    const watcher = setInterval(() => {
      checks++;
      const currentDev = (devices || []).find((d) => d.id === deviceId);
      if (currentDev?.cameraIp && currentDev.cameraIp !== cleanIp) {
        onUpdateCameraIp(currentDev.cameraIp);
        setWifiPairResult({
          success: true,
          msg: `🎉 Camera connected! IP: ${currentDev.cameraIp}. Stream online!`
        });
        showToast('success', 'Camera Connected!', `Live IP: ${currentDev.cameraIp}`);
        clearInterval(watcher);
        setIsPairingWifi(false);
        setTimeout(() => onClose(), 2000);
      }
      if (checks >= 15) {
        clearInterval(watcher);
        setIsPairingWifi(false);
      }
    }, 1500);
  };

  // ── 1-Click USB Auto-Setup via WebSerial API ──────────────────────────────
  const handleUsbSerialPair = async () => {
    if (!('serial' in navigator)) {
      showToast('warning', 'Browser Unsupported', 'Web Serial requires Chrome, Brave, or Microsoft Edge.');
      return;
    }

    if (!wifiSsid.trim()) {
      showToast('warning', 'Missing SSID', 'Please enter your Wi-Fi SSID first.');
      return;
    }

    setIsSerialPairing(true);
    setSerialStatus('connecting');
    setSerialLogs((prev) => [...prev, `[USB] Requesting USB serial device (115200 baud)...`]);

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });

      setSerialStatus('flashing');
      setSerialLogs((prev) => [...prev, `[USB] Port opened! Transmitting Wi-Fi credentials...`]);

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      const pairCommand = `PAIR:${wifiSsid.trim()},${wifiPassword.trim()}\n`;
      await writer.write(encoder.encode(pairCommand));
      writer.releaseLock();

      setSerialLogs((prev) => [...prev, `[USB] Sent: PAIR:${wifiSsid.trim()},******`]);
      setSerialLogs((prev) => [...prev, `[USB] Camera flashing credentials to NVS and connecting to Wi-Fi...`]);

      // Read serial response
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();

      const timeoutTimer = setTimeout(() => {
        try {
          reader.cancel();
          port.close();
        } catch {}
        setIsSerialPairing(false);
        if (serialStatus !== 'connected') {
          setSerialStatus('idle');
        }
      }, 10000);

      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              const lines = value.split('\n');
              for (const l of lines) {
                const trimmed = l.trim();
                if (trimmed.length > 0) {
                  setSerialLogs((prev) => [...prev.slice(-10), trimmed]);

                  // Try JSON parse first
                  try {
                    const json = JSON.parse(trimmed);
                    if (json.status === 'connected' && json.ip) {
                      const detectedIp = json.ip;
                      setSerialStatus('connected');
                      setSerialLogs((prev) => [...prev, `[USB] ✅ Connected! Got IP: ${detectedIp}`]);
                      onUpdateCameraIp(detectedIp);
                      showToast('success', 'Camera Paired Over USB!', `Assigned IP: ${detectedIp}. Live streaming!`);
                      clearTimeout(timeoutTimer);
                      setTimeout(() => {
                        try {
                          reader.cancel();
                          port.close();
                        } catch {}
                        setIsSerialPairing(false);
                        onClose();
                      }, 1800);
                      return;
                    }
                  } catch {}

                  // Regex fallback
                  const match = trimmed.match(/Got IP:\s*([0-9.]+)/i) || trimmed.match(/Camera IP:\s*http:\/\/([0-9.]+)/i);
                  if (match && match[1]) {
                    const detectedIp = match[1];
                    setSerialStatus('connected');
                    setSerialLogs((prev) => [...prev, `[USB] ✅ Connected! Got IP: ${detectedIp}`]);
                    onUpdateCameraIp(detectedIp);
                    showToast('success', 'Camera Paired Over USB!', `Assigned IP: ${detectedIp}. Live streaming!`);
                    clearTimeout(timeoutTimer);
                    setTimeout(() => {
                      try {
                        reader.cancel();
                        port.close();
                      } catch {}
                      setIsSerialPairing(false);
                      onClose();
                    }, 1800);
                    return;
                  }
                }
              }
            }
          }
        } catch {}
      })();
    } catch (err: any) {
      setSerialStatus('error');
      setSerialLogs((prev) => [...prev, `[USB Error] ${err?.message || 'Device disconnected or cancelled'}`]);
      setIsSerialPairing(false);
    }
  };

  // ── Manual IP Save ──
  const handleSaveManualIp = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = manualIpInput.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    if (formatted) {
      onUpdateCameraIp(formatted);
      localStorage.setItem('hn_camera_ip', formatted);
      showToast('success', 'Camera IP Saved', `Active IP set to ${formatted}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[85] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-100">ESP32-CAM Setup &amp; Vision Studio</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isStreamOnline ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}>
                  {isStreamOnline ? 'ONLINE' : 'STANDBY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Active Node: <span className="text-rose-400 font-bold">{cleanIp || 'Not Configured'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('wifi');
              if (scannedNetworks.length === 0) handleScanWifi();
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'wifi'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wireless Wi-Fi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('smoothness')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'smoothness'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Smoothness (FPS)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('optics')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'optics'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Optics &amp; Flip</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usb')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'usb'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>USB Recovery</span>
          </button>
        </div>

        {/* ================= TAB 1: STREAM SMOOTHNESS & FPS ================= */}
        {activeTab === 'smoothness' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Select Real-Time Stream Performance Profile:
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Target: 25–30 FPS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Weak or slow Wi-Fi? Switch to <strong className="text-rose-300">Ultra-Smooth 30 FPS</strong>.
                It reduces image byte payload by 75% so video flows butter smooth without lag!
              </p>

              {/* 3 Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Ultra-Smooth */}
                <button
                  type="button"
                  onClick={() => handleSelectSmoothnessPreset('smooth')}
                  disabled={isApplyingPreset}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    selectedPreset === 'smooth'
                      ? 'bg-emerald-950/60 border-emerald-400/80 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">⚡</span>
                    {selectedPreset === 'smooth' && (
                      <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">ACTIVE</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-emerald-300">Ultra-Smooth</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">30 FPS • Low Latency</p>
                  <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-1.5">
                    CIF 400x296 • ~10 KB/f<br />
                    <span className="text-emerald-400 font-bold">Fast on slow Wi-Fi</span>
                  </div>
                </button>

                {/* 2. Balanced (Recommended) */}
                <button
                  type="button"
                  onClick={() => handleSelectSmoothnessPreset('balanced')}
                  disabled={isApplyingPreset}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    selectedPreset === 'balanced'
                      ? 'bg-sky-950/60 border-sky-400/80 ring-2 ring-sky-500/30'
                      : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">⚖️</span>
                    {selectedPreset === 'balanced' && (
                      <span className="bg-sky-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">ACTIVE</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-sky-300">Balanced (Default)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">20–25 FPS • Crisp</p>
                  <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-1.5">
                    VGA 640x480 • ~16 KB/f<br />
                    <span className="text-sky-300">Sharp clinic view</span>
                  </div>
                </button>

                {/* 3. HD Detail */}
                <button
                  type="button"
                  onClick={() => handleSelectSmoothnessPreset('hd')}
                  disabled={isApplyingPreset}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    selectedPreset === 'hd'
                      ? 'bg-indigo-950/60 border-indigo-400/80 ring-2 ring-indigo-500/30'
                      : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">💎</span>
                    {selectedPreset === 'hd' && (
                      <span className="bg-indigo-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">ACTIVE</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-indigo-300">HD Detail</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">15–20 FPS • High Res</p>
                  <div className="mt-2 text-[9px] font-mono text-slate-500 border-t border-slate-800/80 pt-1.5">
                    SVGA 800x600 • ~35 KB/f<br />
                    <span className="text-indigo-400">Needs strong Wi-Fi</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Manual IP / Domain Port Override */}
            <form onSubmit={handleSaveManualIp} className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Stream Target IP:</span>
              <input
                type="text"
                value={manualIpInput}
                onChange={(e) => setManualIpInput(e.target.value)}
                placeholder="192.168.100.159 or domain"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
              >
                Save
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 2: 1-CLICK USB AUTO-SETUP ================= */}
        {activeTab === 'usb' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  <Usb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-100">Zero-Config USB Direct Setup</h4>
                  <p className="text-xs text-slate-400">No local AP or manual router setup needed.</p>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <p>1. Plug ESP32-CAM USB cable into this computer.</p>
                <p>2. Enter your Wi-Fi name &amp; password below.</p>
                <p>3. Click <strong className="text-teal-400">"Auto-Pair via USB"</strong> — the website transmits credentials directly and starts streaming immediately!</p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Wi-Fi Network Name (SSID):</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Garcia Wifi 4G Wifi"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Wi-Fi Password:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Enter Wi-Fi Password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleUsbSerialPair}
                disabled={isSerialPairing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Usb className="w-4 h-4" />
                <span>{isSerialPairing ? 'Flashing Camera over USB...' : '⚡ 1-Click Auto-Pair via USB'}</span>
              </button>

              {/* Live Terminal Output */}
              {serialLogs.length > 0 && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 space-y-0.5 max-h-28 overflow-y-auto">
                  {serialLogs.map((log, i) => (
                    <div key={i} className="truncate">{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: WI-FI & CLOUD AUTO-SYNC ================= */}
        {activeTab === 'wifi' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  Nearby 2.4 GHz Networks Discovered:
                </span>
                <button
                  type="button"
                  onClick={handleScanWifi}
                  disabled={isScanningWifi}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanningWifi ? 'animate-spin' : ''}`} />
                  <span>{isScanningWifi ? 'Scanning...' : 'Scan Networks'}</span>
                </button>
              </div>

              {/* Network Pills */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {scannedNetworks.length > 0 ? (
                  scannedNetworks.map((net, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWifiSsid(net.ssid)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        wifiSsid === net.ssid
                          ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {net.encrypted ? <Lock className="w-2.5 h-2.5 text-slate-400" /> : <Wifi className="w-2.5 h-2.5 text-emerald-400" />}
                      <span>{net.ssid}</span>
                      <span className="text-[10px] text-slate-500">({net.rssi}dBm)</span>
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-1">
                    Click "Scan Networks" or type SSID manually below.
                  </p>
                )}
              </div>

              {/* Wi-Fi Credential Input Form */}
              <form onSubmit={handlePairWifiDirect} className="space-y-2.5 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Wi-Fi Network Name (SSID):</label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Enter Wi-Fi SSID"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Wi-Fi Password:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Enter Wi-Fi Password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {wifiPairResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    wifiPairResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{wifiPairResult.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPairingWifi}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPairingWifi ? 'Dispatching to Camera & Cloud...' : '💾 Save & Connect Remotely'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SENSOR OPTICS & ORIENTATION ================= */}
        {activeTab === 'optics' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
                Cage Mounting Orientation &amp; Alignment
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleToggleFlip}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
                    vflip
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Vertical Flip: {vflip ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleMirror}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition-all cursor-pointer ${
                    hmirror
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Horizontal Mirror: {hmirror ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Flashlight LED Control */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-200">High-Power White Flashlight LED (GPIO 4)</h5>
                  <p className="text-[10px] text-slate-400">Illuminates pet bowl and feeding area in dark wards.</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleFlashlight}
                  className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    flashLed
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${flashLed ? 'fill-slate-950' : ''}`} />
                  <span>{flashLed ? 'Flash ON' : 'Turn Flash ON'}</span>
                </button>
              </div>

              {/* Brightness & Contrast Sliders */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-bold">Brightness Adjustment:</span>
                    <span className="font-mono text-rose-300 font-bold">{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={brightness}
                    onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-bold">Contrast Adjustment:</span>
                    <span className="font-mono text-rose-300 font-bold">{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={contrast}
                    onChange={(e) => handleContrastChange(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1 font-mono">
            <span>mDNS:</span>
            <a
              href="http://hydronourish-cam.local/"
              target="_blank"
              rel="noreferrer"
              className="text-rose-400 hover:underline flex items-center gap-0.5"
            >
              hydronourish-cam.local
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
