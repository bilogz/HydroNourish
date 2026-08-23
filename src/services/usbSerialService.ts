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
export type USBTelemetryListener = (telemetry: USBTelemetry) => void;
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
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });

      this.emitStatus(true);
      this.emitLog('🟢 USB COM Port opened successfully at 115200 baud!', 'info');

      // Start non-blocking read loop
      this.startReading();

      // Query initial status and handshake
      setTimeout(() => {
        this.sendCommand({ action: 'ping' });
        this.sendCommand({ action: 'status' });
      }, 300);

      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        this.emitLog(`❌ Connection Error: ${err.message || err}`, 'error');
      }
      this.emitStatus(false);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
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
          if (parsed.type === 'telemetry') {
            this.lastTelemetry = parsed as USBTelemetry;
            this.telemetryListeners.forEach((fn) => {
              try { fn(parsed); } catch {}
            });
            this.emitLog(`📊 [Telemetry] Water: ${parsed.waterLevel}% | TDS: ${parsed.tds} PPM | Food: ${parsed.foodLevel}% | Pump: ${parsed.isPumping ? 'ON' : 'OFF'}`, 'telemetry');
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

  public async dispenseWater(durationMs: number = 2500): Promise<boolean> {
    return this.sendCommand({ action: 'water', duration: durationMs });
  }

  public async setPump(on: boolean): Promise<boolean> {
    return this.sendCommand({ action: on ? 'pump_on' : 'pump_off' });
  }

  public async toggleAutoRefill(enabled?: boolean): Promise<boolean> {
    return this.sendCommand({ action: 'auto_refill', enabled });
  }

  public async togglePumpMaster(locked?: boolean): Promise<boolean> {
    return this.sendCommand({ action: locked ? 'deactivate_pump' : 'activate_pump', locked });
  }

  public async refillHopper(): Promise<boolean> {
    return this.sendCommand({ action: 'refill' });
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

  public async controlMotor(state: 'lock' | 'free' | 'hold_on' | 'hold_off' | 'step' | 'test', steps?: number): Promise<boolean> {
    return this.sendCommand({ action: 'motor', state, steps });
  }

  public async getTelemetry(): Promise<boolean> {
    return this.sendCommand({ action: 'status' });
  }
}

export const usbSerialService = new USBSerialService();
