/**
 * HydroNourish ESP32 - Direct USB Wired Hardware Service (WebSerial API)
 * Provides zero-latency, bidirectional USB communication with the ESP32 node.
 */

export interface USBTelemetry {
  type: 'telemetry';
  deviceId: string;
  waterLevel: number;
  waterRaw?: number;
  tds: number;
  tdsVoltage?: number;
  waterQuality: string;
  foodLevel: number;
  isPumping: boolean;
  pumpDeactivated: boolean;
  autoRefill: boolean;
  activeHigh?: boolean;
  pumpRelayPin?: number;
  motorLocked?: boolean;
  motorHoldCoils?: boolean;
  enableActiveLow?: boolean;
  stepDelay?: number;
  wifiConnected: boolean;
  ssid: string;
  ip: string;
  rssi: number;
  cameraIp?: string;
  freeHeap?: number;
  uptime?: number;
  localTime?: string;
  schedulesCount?: number;
  foodBowlWeightGrams?: number;
  scaleReady?: boolean;
  waterLiters?: number;
  waterMl?: number;
  waterScaleReady?: boolean;
  foodGateOpen?: boolean;
  gateOpenDeg?: number;
  gateClosedDeg?: number;
  currentServoAngle?: number;
  lastIntakeFoodGrams?: number;
  lastIntakeWaterMl?: number;
  autoFlush?: boolean;
  autoSpray?: boolean;
  offlineMode?: boolean;
}

export interface USBResponse {
  type: 'response';
  action: string;
  success: boolean;
  message?: string;
  [key: string]: any;
}

export interface ScannedWifiNetwork {
  ssid: string;
  rssi: number;
  auth?: string;
  encrypted?: boolean;
}

export type USBLogListener = (log: string, type?: 'info' | 'rx' | 'tx' | 'error' | 'telemetry') => void;
export type USBTelemetryListener = (telemetry: USBTelemetry | null) => void;
export type USBStatusListener = (connected: boolean, portInfo?: any) => void;
export type USBWifiScanListener = (networks: ScannedWifiNetwork[]) => void;

class USBSerialService {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private isConnected: boolean = false;
  private readLoopActive: boolean = false;
  private logListeners: Set<USBLogListener> = new Set();
  private telemetryListeners: Set<USBTelemetryListener> = new Set();
  private statusListeners: Set<USBStatusListener> = new Set();
  private wifiScanListeners: Set<USBWifiScanListener> = new Set();
  private lastTelemetry: USBTelemetry | null = null;
  private lastScannedNetworks: ScannedWifiNetwork[] = [];
  private rxBuffer: string = '';
  private telemetryTimer: any = null;
  private autoConnectAttempted: boolean = false;
  private wifiFalseStrikes: number = 0;
  private reportedWifiConnected: boolean = false;

  constructor() {
    this.initPlugAndPlay();
  }

  private initPlugAndPlay() {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) return;

    try {
      // Plug-and-Play: Automatically connect when USB device is physically plugged in
      (navigator as any).serial.addEventListener('connect', async (event: any) => {
        this.emitLog('🔌 USB device plugged in. Auto-connecting (Plug & Play)...', 'info');
        if (event?.target) {
          await this.openPort(event.target).catch(() => {});
        } else {
          await this.autoConnect();
        }
      });

      // Disconnect: Handle physical unplug event gracefully
      (navigator as any).serial.addEventListener('disconnect', () => {
        this.emitLog('🔌 USB device physically unplugged.', 'info');
        this.stopTelemetryLoop();
        this.readLoopActive = false;
        this.port = null;
        this.lastTelemetry = null;
        this.wifiFalseStrikes = 0;
        this.reportedWifiConnected = false;
        this.emitStatus(false);
        this.telemetryListeners.forEach((fn) => {
          try { fn(null); } catch {}
        });
      });

      // Attempt auto-connect on startup/page load for any previously-paired port
      if (typeof window !== 'undefined') {
        window.addEventListener('load', () => {
          setTimeout(() => this.autoConnect().catch(() => {}), 400);
        });
        setTimeout(() => this.autoConnect().catch(() => {}), 600);
      }
    } catch (e) {
      console.warn('[USB] Plug & Play listener init warning:', e);
    }
  }

  public async autoConnect(): Promise<boolean> {
    if (!this.isSupported() || this.isConnected) return false;
    try {
      // @ts-ignore
      const ports = await navigator.serial.getPorts();
      if (ports && ports.length > 0) {
        this.emitLog(`🔌 Auto-connecting to authorized USB port (Plug & Play)...`, 'info');
        await this.openPort(ports[0]);
        return true;
      }
    } catch (e: any) {
      console.warn('[USB] Auto-connect error:', e);
    }
    return false;
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getLastTelemetry(): USBTelemetry | null {
    return this.lastTelemetry;
  }

  public getLastScannedNetworks(): ScannedWifiNetwork[] {
    return this.lastScannedNetworks;
  }

  public isWifiConnected(): boolean {
    return this.isConnected && this.reportedWifiConnected;
  }

  public getWifiSsid(): string {
    return this.lastTelemetry?.ssid || '';
  }

  public getWifiIp(): string {
    return this.lastTelemetry?.ip || '';
  }

  public getWifiRssi(): number | null {
    return typeof this.lastTelemetry?.rssi === 'number' ? this.lastTelemetry.rssi : null;
  }

  public getConnectionMode(isWifiOnlineFallback: boolean = false): 'usb' | 'wifi' | 'offline' {
    const wifi = this.isWifiConnected() || isWifiOnlineFallback;
    if (wifi) return 'wifi';
    if (this.isConnected) return 'usb';
    return 'offline';
  }

  public onLog(listener: USBLogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public onTelemetry(listener: USBTelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    if (this.lastTelemetry) listener(this.lastTelemetry);
    return () => this.telemetryListeners.delete(listener);
  }

  public onStatus(listener: USBStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected);
    return () => this.statusListeners.delete(listener);
  }

  public onWifiScan(listener: USBWifiScanListener): () => void {
    this.wifiScanListeners.add(listener);
    if (this.lastScannedNetworks.length > 0) listener(this.lastScannedNetworks);
    return () => this.wifiScanListeners.delete(listener);
  }

  private emitLog(msg: string, type: 'info' | 'rx' | 'tx' | 'error' | 'telemetry' = 'info') {
    this.logListeners.forEach((fn) => {
      try { fn(msg, type); } catch {}
    });
  }

  private emitStatus(connected: boolean) {
    this.isConnected = connected;
    if (!connected) {
      this.lastTelemetry = null;
      this.wifiFalseStrikes = 0;
      this.reportedWifiConnected = false;
    }
    this.statusListeners.forEach((fn) => {
      try { fn(connected, this.port?.getInfo?.()); } catch {}
    });
  }

  private emitWifiScan(networks: ScannedWifiNetwork[]) {
    this.lastScannedNetworks = networks;
    this.wifiScanListeners.forEach((fn) => {
      try { fn(networks); } catch {}
    });
  }

  private startTelemetryLoop() {
    this.stopTelemetryLoop();
    this.telemetryTimer = setInterval(() => {
      if (this.isConnected) {
        // Query status/telemetry via USB serial every 500ms for responsive real-time scale display
        this.sendCommand({ action: 'status' }).catch(() => {});
      } else {
        this.stopTelemetryLoop();
      }
    }, 500);
  }

  private stopTelemetryLoop() {
    if (this.telemetryTimer) {
      clearInterval(this.telemetryTimer);
      this.telemetryTimer = null;
    }
  }

  public async openPort(port: any): Promise<boolean> {
    if (this.isConnected) return true;
    try {
      this.port = port;
      await this.port.open({ baudRate: 115200 });

      this.emitStatus(true);
      this.emitLog('🟢 USB COM Port connected (Plug & Play Active - Offline Ready)!', 'info');

      // Start non-blocking read stream
      this.startReading();

      // Start continuous telemetry loop for offline monitoring
      this.startTelemetryLoop();

      // Query initial status and handshake
      setTimeout(() => {
        this.sendCommand({ action: 'ping' });
        this.sendCommand({ action: 'status' });
      }, 300);

      return true;
    } catch (err: any) {
      this.emitStatus(false);
      this.port = null;
      const isLocked = String(err?.message || '').toLowerCase().includes('failed to open') ||
                       String(err?.message || '').toLowerCase().includes('denied');
      if (isLocked) {
        const enhancedErr = new Error(
          'COM Port is locked or in use by another program (e.g., PlatformIO Serial Monitor in VSCode, another terminal, or another browser window). Please stop the serial monitor in VSCode terminal (Ctrl+C) and try again.'
        );
        enhancedErr.name = 'PortLockedError';
        throw enhancedErr;
      }
      throw err;
    }
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Brave.');
    }

    if (this.isConnected) {
      return true;
    }

    try {
      this.emitLog('Requesting USB Serial Port (ESP32 Node)...', 'info');
      // @ts-ignore
      const selectedPort = await navigator.serial.requestPort();
      return await this.openPort(selectedPort);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        this.emitLog(`❌ Connection Error: ${err.message || err}`, 'error');
      }
      this.emitStatus(false);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    this.stopTelemetryLoop();
    this.readLoopActive = false;
    try {
      if (this.reader) {
        await this.reader.cancel().catch(() => {});
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close().catch(() => {});
        this.writer = null;
      }
      if (this.port) {
        await this.port.close().catch(() => {});
        this.port = null;
      }
    } catch (e) {
      console.warn('Error during serial port disconnect:', e);
    } finally {
      this.emitStatus(false);
      this.emitLog('🔌 USB Serial Port Disconnected.', 'info');
      this.telemetryListeners.forEach((fn) => {
        try { fn(null); } catch {}
      });
    }
  }

  private async startReading() {
    if (!this.port || this.readLoopActive) return;
    this.readLoopActive = true;

    try {
      // @ts-ignore
      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable).catch(() => {});
      this.reader = textDecoder.readable.getReader();

      while (this.readLoopActive) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.handleIncomingChunk(value);
        }
      }
    } catch (err: any) {
      if (this.readLoopActive) {
        this.emitLog(`⚠️ USB Read stream closed: ${err.message || err}`, 'error');
      }
    } finally {
      this.readLoopActive = false;
      this.emitStatus(false);
    }
  }

  private handleIncomingChunk(chunk: string) {
    this.rxBuffer += chunk;
    const lines = this.rxBuffer.split(/\r?\n/);
    this.rxBuffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check if it is a JSON payload
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'telemetry' || parsed.waterLevel !== undefined || parsed.foodBowlWeightGrams !== undefined || parsed.food_bowl_weight_grams !== undefined) {
            if (!parsed.deviceId && parsed.device_id) parsed.deviceId = parsed.device_id;
            if (typeof parsed.foodBowlWeightGrams !== 'number' && parsed.food_bowl_weight_grams !== undefined) {
              parsed.foodBowlWeightGrams = Number(parsed.food_bowl_weight_grams);
            }
            const rawWifi = Boolean(parsed.wifiConnected);
            if (rawWifi) {
              this.wifiFalseStrikes = 0;
              this.reportedWifiConnected = true;
            } else {
              this.wifiFalseStrikes += 1;
              if (this.wifiFalseStrikes >= 3) {
                this.reportedWifiConnected = false;
              }
            }
            parsed.wifiConnected = this.reportedWifiConnected;
            this.lastTelemetry = parsed as USBTelemetry;
            this.telemetryListeners.forEach((fn) => {
              try { fn(parsed); } catch {}
            });
            this.emitLog(`📊 [Telemetry] Water: ${parsed.waterLevel ?? 0}% | Scale: ${parsed.foodBowlWeightGrams ?? 0}g | TDS: ${parsed.tds ?? 0} PPM | Gate: ${parsed.foodGateOpen ? 'OPEN' : 'CLOSED'}`, 'telemetry');
            continue;
          } else if (parsed.type === 'response') {
            if (parsed.action === 'scan_wifi' || parsed.action === 'wifi_scan' || parsed.action === 'scan' || parsed.networks) {
              const nets: ScannedWifiNetwork[] = (parsed.networks || []).map((n: any) => ({
                ssid: String(n.ssid || '').trim(),
                rssi: Number(n.rssi || -70),
                auth: n.auth || (n.encrypted ? 'Secured' : 'Open'),
                encrypted: Boolean(n.encrypted ?? (n.auth !== 'Open'))
              })).filter((n: ScannedWifiNetwork) => n.ssid.length > 0);
              
              if (nets.length > 0) {
                this.emitWifiScan(nets);
                this.emitLog(`📶 [WiFi Scan] Found ${nets.length} 2.4 GHz networks over USB Serial.`, 'rx');
              }
            }
            this.emitLog(`✅ [Response] ${parsed.action}: ${parsed.message || (parsed.success ? 'Success' : 'Failed')}`, 'rx');
            continue;
          } else if (parsed.type === 'device_info') {
            this.emitLog(`👋 [Device Info] ${parsed.name} (${parsed.deviceId}) v${parsed.version} ready at ${parsed.baud} baud`, 'info');
            continue;
          }
        } catch {
          // Not valid JSON, process as plain log
        }
      }

      // Check for plain text Wi-Fi scan results (e.g. "  - Garcia Wifi 4G Wifi (-65 dBm) [Locked]")
      const wifiMatch = line.match(/^[-*]\s+(.+?)\s+\(([-0-9]+)\s*dBm\)\s*(\[.+?\])?$/i);
      if (wifiMatch) {
        const ssid = wifiMatch[1].trim();
        const rssi = parseInt(wifiMatch[2], 10) || -70;
        const lockTag = (wifiMatch[3] || '').toLowerCase();
        const encrypted = !lockTag.includes('open');
        const auth = encrypted ? 'Secured' : 'Open';
        
        const existing = this.lastScannedNetworks.filter(n => n.ssid !== ssid);
        const updated = [...existing, { ssid, rssi, auth, encrypted }];
        this.emitWifiScan(updated);
      }

      // Log plain text response
      this.emitLog(line, 'rx');
    }
  }

  public async sendRaw(text: string): Promise<boolean> {
    if (!this.port || !this.isConnected) {
      this.emitLog('❌ Cannot send command: USB Serial is not connected.', 'error');
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const payload = text.endsWith('\n') ? text : text + '\n';
      const writer = this.port.writable.getWriter();
      await writer.write(encoder.encode(payload));
      writer.releaseLock();

      this.emitLog(`📤 [TX] ${text.trim()}`, 'tx');
      return true;
    } catch (err: any) {
      this.emitLog(`❌ Send error: ${err.message || err}`, 'error');
      return false;
    }
  }

  public async sendCommand(cmd: Record<string, any>): Promise<boolean> {
    return this.sendRaw(JSON.stringify(cmd));
  }

  // ── High-Level Hardware Actions ─────────────────────────────────────────────

  public async dispenseFood(portionGrams: number = 75, steps: number = 39): Promise<boolean> {
    return this.sendCommand({ action: 'feed', amount: portionGrams, steps });
  }

  public async openGate(angle?: number): Promise<boolean> {
    if (typeof angle === 'number') {
      const clamped = Math.max(10, Math.min(180, Math.round(angle)));
      await this.sendRaw(`GATEANGLE:${clamped}`);
      await this.sendRaw('OPEN');
      return this.sendCommand({ action: 'gate_open', angle: clamped, manual: true });
    }
    await this.sendRaw('OPEN');
    return this.sendCommand({ action: 'gate_open', manual: true });
  }

  public async closeGate(): Promise<boolean> {
    await this.sendRaw('CLOSE');
    return this.sendCommand({ action: 'gate_close', manual: true });
  }

  public async setServoAngle(angle: number, test: boolean = false): Promise<boolean> {
    const clamped = Math.max(10, Math.min(180, Math.round(angle)));
    await this.sendRaw(`GATEANGLE:${clamped}`);
    return this.sendCommand({ action: 'set_servo_angle', angle: clamped, test });
  }

  public async dispenseWater(durationMs: number = 10000): Promise<boolean> {
    return this.sendCommand({ action: 'water', duration: durationMs });
  }

  public async setPump(on: boolean): Promise<boolean> {
    return this.sendCommand({ action: on ? 'pump_on' : 'pump_off' });
  }

  public async toggleAutoRefill(enabled?: boolean): Promise<boolean> {
    await this.sendRaw(enabled ? 'AUTO ON' : 'AUTO OFF');
    return this.sendCommand({ action: 'auto_refill', enabled });
  }

  public async toggleAutoFlush(enabled?: boolean): Promise<boolean> {
    await this.sendRaw(enabled ? 'AUTO_FLUSH ON' : 'AUTO_FLUSH OFF');
    return this.sendCommand({ action: 'auto_flush', enabled });
  }

  public async toggleAutoSpray(enabled?: boolean): Promise<boolean> {
    await this.sendRaw(enabled ? 'AUTO_SPRAY ON' : 'AUTO_SPRAY OFF');
    return this.sendCommand({ action: 'auto_spray', enabled });
  }

  public async togglePumpMaster(locked?: boolean): Promise<boolean> {
    return this.sendCommand({ action: locked ? 'deactivate_pump' : 'activate_pump', locked });
  }

  public async refillHopper(): Promise<boolean> {
    return this.sendCommand({ action: 'refill' });
  }

  public async deductFood(grams: number): Promise<boolean> {
    return this.sendCommand({ action: 'deduct_food_level', grams: Math.round(grams) });
  }

  public async setFoodLevel(levelPct: number): Promise<boolean> {
    return this.sendCommand({ action: 'set_food_level', percent: Math.round(levelPct) });
  }

  public async runDiagnostics(): Promise<boolean> {
    return this.sendCommand({ action: 'diagnostics' });
  }

  public async scanWifi(): Promise<boolean> {
    await this.sendRaw('SCAN');
    return this.sendCommand({ action: 'scan_wifi' });
  }

  public async pairWifi(ssid: string, pass: string): Promise<boolean> {
    // Send both JSON action and plain-text PAIR:ssid,pass for universal ESP32 firmware compatibility
    await this.sendRaw(`PAIR:${ssid.trim()},${pass.trim()}`);
    return this.sendCommand({ action: 'pair_wifi', ssid: ssid.trim(), password: pass.trim() });
  }

  public async disconnectWifi(): Promise<boolean> {
    await this.sendRaw('DISCONNECT_WIFI');
    await this.sendRaw('WIFIOFF');
    return this.sendCommand({ action: 'disconnect_wifi', enabled: true });
  }

  public async controlMotor(state: 'lock' | 'free' | 'hold_on' | 'hold_off' | 'step' | 'test', steps?: number): Promise<boolean> {
    return this.sendCommand({ action: 'motor', state, steps });
  }

  public async dispenseCleaningWater(durationMs: number = 3000): Promise<boolean> {
    await this.sendRaw(`SPRAY ${durationMs}`);
    return this.sendCommand({ action: 'spray', duration: durationMs });
  }

  public async run19WDrainPump(durationMs: number = 15000): Promise<boolean> {
    await this.sendRaw(`DRAIN ${durationMs}`);
    return this.sendCommand({ action: 'drain', duration: durationMs });
  }

  public async disposeWaste(durationMs: number = 15000): Promise<boolean> {
    await this.sendRaw(`DRAIN ${durationMs}`);
    return this.sendCommand({ action: 'drain', duration: durationMs });
  }

  public async fullSanitation(): Promise<boolean> {
    await this.sendRaw('CLEANWASTE');
    return this.sendCommand({ action: 'full_sanitation' });
  }

  public async runBowlSanitationCycle(): Promise<boolean> {
    return this.sendCommand({ action: 'sanitation_cycle' });
  }

  public async getTelemetry(): Promise<boolean> {
    return this.sendCommand({ action: 'status' });
  }

  public async tareWaterScale(): Promise<boolean> {
    await this.sendRaw('WATERTARE');
    return this.sendCommand({ action: 'watertare' });
  }

  public async calibrateWaterScale(knownMl?: number, factor?: number): Promise<boolean> {
    if (knownMl) {
      await this.sendRaw(`WATERCAL:${knownMl}`);
      return this.sendCommand({ action: 'watercalibrate', knownMl });
    } else {
      const f = factor || 420.0;
      await this.sendRaw(`WATERCAL:${f}`);
      return this.sendCommand({ action: 'watercalibrate', factor: f });
    }
  }

  public async tareScale(): Promise<boolean> {
    await this.sendRaw('TARE');
    return this.sendCommand({ action: 'tare' });
  }

  public async calibrateScale(knownGrams?: number, factor?: number): Promise<boolean> {
    if (knownGrams) {
      await this.sendRaw(`CALWEIGHT:${knownGrams}`);
      return this.sendCommand({ action: 'calibrate', knownGrams });
    } else {
      const f = factor || 420.0;
      await this.sendRaw(`CAL:${f}`);
      return this.sendCommand({ action: 'calibrate', factor: f });
    }
  }

  public async setSimulatedWeight(grams: number): Promise<boolean> {
    await this.sendRaw(`SETWEIGHT:${grams}`);
    return this.sendCommand({ action: 'set_weight', weight: grams });
  }

  public async setSimulatedWater(ml: number): Promise<boolean> {
    await this.sendRaw(`SETWATER:${ml}`);
    return this.sendCommand({ action: 'set_water', ml, waterMl: ml });
  }

  public async readScales(): Promise<boolean> {
    await this.sendRaw('READ_SCALES');
    return this.sendCommand({ action: 'read_scales' });
  }

  public async setOfflineMode(offline: boolean): Promise<boolean> {
    await this.sendRaw(offline ? 'OFFLINE' : 'ONLINE');
    return this.sendCommand({ action: offline ? 'offline' : 'online', enabled: offline });
  }
}

export const usbSerialService = new USBSerialService();
