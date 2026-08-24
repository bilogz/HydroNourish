import React, { useState, useEffect, useRef } from 'react';
import {
  Usb,
  Power,
  RefreshCw,
  Utensils,
  Droplets,
  Zap,
  Activity,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Send,
  Trash2,
  Terminal,
  Lock,
  Unlock,
  Radio,
  Wifi,
  ChevronDown,
  ChevronUp,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Gauge
} from 'lucide-react';
import { usbSerialService, USBTelemetry, ScannedWifiNetwork } from '../services/usbSerialService';

interface DirectUSBConsoleWidgetProps {
  onClose?: () => void;
  isOpen?: boolean;
}

interface LogEntry {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'rx' | 'tx' | 'error' | 'telemetry';
}

export const DirectUSBConsoleWidget: React.FC<DirectUSBConsoleWidgetProps> = () => {
  const [isConnected, setIsConnected] = useState(usbSerialService.getIsConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [telemetry, setTelemetry] = useState<USBTelemetry | null>(usbSerialService.getLastTelemetry());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputCommand, setInputCommand] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState<'controls' | 'terminal' | 'telemetry'>('controls');
  const [isActing, setIsActing] = useState(false);
  const [wifiSsidInput, setWifiSsidInput] = useState('Garcia Wifi 4G Wifi');
  const [wifiPassInput, setWifiPassInput] = useState('GaRCi4F4m');
  const [scannedUsbNetworks, setScannedUsbNetworks] = useState<ScannedWifiNetwork[]>(usbSerialService.getLastScannedNetworks());
  const [isScanningWifi, setIsScanningWifi] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubStatus = usbSerialService.onStatus((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setIsConnecting(false);
      }
    });

    const unsubTelemetry = usbSerialService.onTelemetry((data) => {
      setTelemetry(data);
    });

    const unsubWifi = usbSerialService.onWifiScan((nets) => {
      setScannedUsbNetworks(nets);
    });

    const unsubLog = usbSerialService.onLog((text, type = 'info') => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs((prev) => [...prev.slice(-150), { id: Math.random().toString(), time, text, type }]);
    });

    return () => {
      unsubStatus();
      unsubTelemetry();
      unsubWifi();
      unsubLog();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleConnectToggle = async () => {
    if (isConnected) {
      await usbSerialService.disconnect();
    } else {
      setIsConnecting(true);
      try {
        await usbSerialService.connect();
      } catch (err) {
        // User cancelled or port open failed
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCommand.trim()) return;

    const cmd = inputCommand.trim();
    setInputCommand('');

    // If starts with { send as JSON, otherwise send as raw string
    if (cmd.startsWith('{') && cmd.endsWith('}')) {
      try {
        const parsed = JSON.parse(cmd);
        await usbSerialService.sendCommand(parsed);
        return;
      } catch {}
    }
    await usbSerialService.sendRaw(cmd);
  };

  const runAction = async (actionFn: () => Promise<any>) => {
    setIsActing(true);
    try {
      await actionFn();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActing(false);
    }
  };

  const quickCommands = [
    { label: '🍖 Feed (90°)', cmd: 'FEED' },
    { label: '💧 Water (2.5s)', cmd: 'WATER' },
    { label: '🌊 Pump ON', cmd: 'PUMP ON' },
    { label: '🛑 Pump OFF', cmd: 'PUMP OFF' },
    { label: '🔄 360° Test', cmd: 'TESTMOTOR' },
    { label: '🔀 Invert Dir', cmd: 'INVERTDIR' },
    { label: '⚡ Speed: 1500µs', cmd: 'SPEED:1500' },
    { label: '⚡ Speed: 2000µs', cmd: 'SPEED:2000' },
    { label: '⚡ Speed: 3000µs', cmd: 'SPEED:3000' },
    { label: '📊 Status', cmd: 'STATUS' },
    { label: '🛠️ Diag', cmd: 'DIAG' },
    { label: '🔒 Lock Motor', cmd: 'MOTOR ON' },
    { label: '🔓 Free Motor', cmd: 'MOTOR OFF' },
    { label: '📶 Scan WiFi', cmd: 'SCAN' },
    { label: '❓ Help', cmd: 'HELP' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 mb-8">
      {/* Header Bar */}
      <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
            isConnected
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            <Usb className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white tracking-tight">Direct USB Wired Console</h3>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Connected @ 115200 Baud
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  Ready to Connect
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Zero-latency direct hardware link via USB Serial (WebSerial API)
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'controls' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct Controls
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'terminal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Live Serial Logs {logs.length > 0 && `(${logs.length})`}
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'telemetry' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Live Telemetry
            </button>
          </div>

          <button
            onClick={handleConnectToggle}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
              isConnected
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Selecting Port...
              </>
            ) : isConnected ? (
              <>
                <Power className="w-4 h-4" />
                Disconnect USB
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Connect Direct USB
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5">
        {!isConnected && (
          <div className="mb-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-indigo-200">Hardware Plug-and-Play Available</p>
                <p className="text-indigo-400/90 leading-tight">
                  Connect your ESP32 via USB cable to this PC, click <strong>"Connect Direct USB"</strong>, and choose the COM port in your browser prompt for instant, offline control.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectToggle}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              Plug & Connect
            </button>
          </div>
        )}

        {/* Tab 1: Direct Controls */}
        {activeTab === 'controls' && (
          <div className="space-y-4">
            {/* Quick Actuator Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Food Dispense */}
              <button
                onClick={() => runAction(() => usbSerialService.dispenseFood(50, 800))}
                disabled={!isConnected || isActing}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 flex flex-col items-center text-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Dispense Food</p>
                  <p className="text-[10px] text-slate-400">Smooth 90° Cycle</p>
                </div>
              </button>

              {/* Water Dispense */}
              <button
                onClick={() => runAction(() => usbSerialService.dispenseWater(2500))}
                disabled={!isConnected || isActing}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 flex flex-col items-center text-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Pump Water</p>
                  <p className="text-[10px] text-slate-400">2.5s Hydration Pulse</p>
                </div>
              </button>

              {/* Force Pump ON */}
              <button
                onClick={() => runAction(() => usbSerialService.setPump(true))}
                disabled={!isConnected || isActing}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 flex flex-col items-center text-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Force Pump ON</p>
                  <p className="text-[10px] text-slate-400">Relay Continuous</p>
                </div>
              </button>

              {/* Force Pump OFF */}
              <button
                onClick={() => runAction(() => usbSerialService.setPump(false))}
                disabled={!isConnected || isActing}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/50 flex flex-col items-center text-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Stop Pump</p>
                  <p className="text-[10px] text-slate-400">Turn Relay OFF</p>
                </div>
              </button>

              {/* Auto-Refill Toggle */}
              <button
                onClick={() => runAction(() => usbSerialService.toggleAutoRefill())}
                disabled={!isConnected || isActing}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/50 flex flex-col items-center text-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Toggle Auto-Refill</p>
                  <p className="text-[10px] text-slate-400">{telemetry?.autoRefill ? 'Enabled' : 'Disabled'}</p>
                </div>
              </button>

              {/* Diagnostics Self-Test */}
              <button
                onClick={() => runAction(() => usbSerialService.runDiagnostics())}
                disabled={!isConnected || isActing}
                className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 flex flex-col items-center text-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Run Diagnostics</p>
                  <p className="text-[10px] text-slate-400">LED, Pump, Motor</p>
                </div>
              </button>
            </div>

            {/* Stepper Motor & Motion Hardware Controls */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">A4988 Stepper Motion & Tuning</h4>
                  <p className="text-[11px] text-slate-400">Non-stalling smooth S-curve acceleration (2000 µs optimal timing)</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => runAction(() => usbSerialService.sendRaw('TESTMOTOR'))}
                  disabled={!isConnected || isActing}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  360° Smooth Test
                </button>
                <button
                  onClick={() => runAction(() => usbSerialService.sendRaw('INVERTDIR'))}
                  disabled={!isConnected || isActing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
                  title="Reverse Motor Direction"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                  Invert Direction
                </button>
                <button
                  onClick={() => runAction(() => usbSerialService.controlMotor('lock'))}
                  disabled={!isConnected || isActing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Lock Coils
                </button>
                <button
                  onClick={() => runAction(() => usbSerialService.controlMotor('free'))}
                  disabled={!isConnected || isActing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  Free Coils (Cool)
                </button>
                <button
                  onClick={() => runAction(() => usbSerialService.refillHopper())}
                  disabled={!isConnected || isActing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Reset Hopper 100%
                </button>
              </div>
            </div>

            {/* Direct USB Wi-Fi Provisioning & Spectrum Scanner */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">ESP32 2.4 GHz Wi-Fi Hardware Provisioning</h4>
                    <p className="text-[11px] text-slate-400">Scan nearby wireless networks and flash credentials directly over USB</p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    setIsScanningWifi(true);
                    try {
                      await usbSerialService.scanWifi();
                    } finally {
                      setTimeout(() => setIsScanningWifi(false), 1500);
                    }
                  }}
                  disabled={!isConnected || isScanningWifi}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningWifi ? 'animate-spin' : ''}`} />
                  {isScanningWifi ? 'Scanning Networks...' : 'Scan Nearby Wi-Fi'}
                </button>
              </div>

              {/* Scanned Networks Quick Chips */}
              {scannedUsbNetworks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discovered Networks:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {scannedUsbNetworks.map((n) => (
                      <button
                        key={n.ssid}
                        onClick={() => {
                          setWifiSsidInput(n.ssid);
                          if (!n.encrypted || n.auth === 'Open') setWifiPassInput('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                          wifiSsidInput === n.ssid
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {n.encrypted ? <Lock className="w-2.5 h-2.5 text-slate-400" /> : <Unlock className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>{n.ssid}</span>
                        <span className="text-[10px] text-slate-500">({n.rssi}dBm)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Pair Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={wifiSsidInput}
                    onChange={(e) => setWifiSsidInput(e.target.value)}
                    placeholder="SSID Name (e.g. MyWiFi)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="password"
                    value={wifiPassInput}
                    onChange={(e) => setWifiPassInput(e.target.value)}
                    placeholder="Password (blank if open)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    onClick={() => runAction(() => usbSerialService.pairWifi(wifiSsidInput, wifiPassInput))}
                    disabled={!isConnected || isActing || !wifiSsidInput.trim()}
                    className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 active:scale-95 transition-all shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    Flash Wi-Fi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Terminal Console Log */}
        {activeTab === 'terminal' && (
          <div className="space-y-3">
            {/* Quick Command Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
              {quickCommands.map((q) => (
                <button
                  key={q.cmd}
                  onClick={() => {
                    if (isConnected) usbSerialService.sendRaw(q.cmd);
                  }}
                  disabled={!isConnected}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Terminal Window */}
            <div className="h-64 overflow-y-auto bg-slate-950 rounded-2xl p-3.5 font-mono text-xs border border-slate-800/80 shadow-inner space-y-1 select-text">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                  <Terminal className="w-8 h-8 mb-2 opacity-50" />
                  <p>No USB communication logged yet.</p>
                  <p className="text-[11px] text-slate-600">Connect the ESP32 USB cable to stream serial logs.</p>
                </div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 text-[10px] shrink-0 font-sans">{l.time}</span>
                    {l.type === 'tx' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 shrink-0">TX</span>
                    )}
                    {l.type === 'rx' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 shrink-0">RX</span>
                    )}
                    {l.type === 'telemetry' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 shrink-0">TELEMETRY</span>
                    )}
                    {l.type === 'error' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 shrink-0">ERR</span>
                    )}
                    {l.type === 'info' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 shrink-0">INFO</span>
                    )}
                    <span className={`break-all ${
                      l.type === 'tx' ? 'text-amber-200' :
                      l.type === 'telemetry' ? 'text-sky-300' :
                      l.type === 'error' ? 'text-rose-300' :
                      l.type === 'rx' ? 'text-emerald-200' : 'text-slate-300'
                    }`}>
                      {l.text}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Command Input Bar */}
            <form onSubmit={handleSendCommand} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  placeholder={isConnected ? 'Type command (e.g. FEED, WATER, STATUS, TESTMOTOR, or {"action":"feed"})...' : 'Connect USB to send commands'}
                  disabled={!isConnected}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!isConnected || !inputCommand.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Live Telemetry Gauges */}
        {activeTab === 'telemetry' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Water Level */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-semibold">Water Level</span>
                <Droplets className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {telemetry ? `${telemetry.waterLevel}%` : '--'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                ADC: {telemetry?.waterRaw ?? '--'}
              </p>
            </div>

            {/* TDS Water Purity */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-semibold">TDS Purity</span>
                <Activity className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {telemetry ? `${telemetry.tds} PPM` : '--'}
              </div>
              <p className="text-[10px] text-rose-400 mt-1 font-semibold">
                {telemetry?.waterQuality || 'Pending Sync'}
              </p>
            </div>

            {/* Food Hopper */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-semibold">Food Hopper</span>
                <Utensils className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {telemetry ? `${telemetry.foodLevel}%` : '--'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Step Delay: {telemetry?.stepDelay ? `${telemetry.stepDelay} µs` : 'Standard'}
              </p>
            </div>

            {/* System / Heap */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-semibold">Wi-Fi & System</span>
                <Radio className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-lg font-bold text-white truncate">
                {telemetry?.ip || 'USB Standalone'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Free Heap: {telemetry?.freeHeap ? `${telemetry.freeHeap} KB` : '--'} | {telemetry?.wifiConnected ? 'WiFi Online' : 'SoftAP/Offline'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
