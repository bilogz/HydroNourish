/**
 * Station presence contract: dashboard `isOnline` is derived from an established
 * USB or LAN/Wi-Fi link, not from a single late telemetry packet.
 *
 * A node is marked Offline only after 3 consecutive missed heartbeats.
 */

import type { Device } from '../types';

export const HEARTBEAT_STRIKE_LIMIT = 3;
/** Hold a proven LAN/USB link long enough to cover 3 missed 2s polls. */
export const LIVE_LINK_HOLD_MS = 8_000;

const lastLiveLinkAt = new Map<string, number>();
const statusDropStrikes = new Map<string, number>();
const lanMissStrikes = new Map<string, number>();

export function markDeviceLiveLink(deviceId: string, atMs: number = Date.now()): void {
  if (!deviceId) return;
  lastLiveLinkAt.set(deviceId, atMs);
  lanMissStrikes.set(deviceId, 0);
  statusDropStrikes.set(deviceId, 0);
}

export function clearDeviceLiveLink(deviceId: string): void {
  lastLiveLinkAt.delete(deviceId);
}

export function hasFreshLiveLink(deviceId: string, atMs: number = Date.now()): boolean {
  const t = lastLiveLinkAt.get(deviceId);
  return typeof t === 'number' && atMs - t < LIVE_LINK_HOLD_MS;
}

export function isLiveTransmissionLabel(label?: string | null): boolean {
  if (!label) return false;
  return label.includes('Live — Direct USB') || label.includes('Live — Wi-Fi LAN');
}

/** Returns true once the LAN poller has missed 3 consecutive cycles. */
export function recordLanPollResult(deviceId: string, success: boolean): boolean {
  if (!deviceId) return false;
  if (success) {
    lanMissStrikes.set(deviceId, 0);
    markDeviceLiveLink(deviceId);
    return false;
  }
  const next = (lanMissStrikes.get(deviceId) || 0) + 1;
  lanMissStrikes.set(deviceId, next);
  if (next >= HEARTBEAT_STRIKE_LIMIT) {
    clearDeviceLiveLink(deviceId);
    return true;
  }
  return false;
}

export function applyStatusStrikes(
  deviceId: string,
  previous: Device['status'] | undefined,
  incoming: Device['status']
): Device['status'] {
  if (incoming === 'Online') {
    statusDropStrikes.set(deviceId, 0);
    return 'Online';
  }

  if (previous === 'Online') {
    const next = (statusDropStrikes.get(deviceId) || 0) + 1;
    statusDropStrikes.set(deviceId, next);
    if (next < HEARTBEAT_STRIKE_LIMIT) {
      return 'Online';
    }
    return incoming;
  }

  if (previous === ('Connecting' as Device['status']) && incoming === 'Offline') {
    const next = (statusDropStrikes.get(deviceId) || 0) + 1;
    statusDropStrikes.set(deviceId, next);
    if (next < HEARTBEAT_STRIKE_LIMIT) {
      return previous;
    }
  }

  return incoming;
}

export function isRealStationHost(host?: string | null): boolean {
  if (!host) return false;
  const h = host.trim();
  return h.length > 0 && h !== '0.0.0.0' && h !== 'Direct USB' && h !== 'Offline';
}

/** Wi-Fi station link is up (distinct from USB-only presence). */
export function isStationWifiOnline(opts: {
  usbConnected: boolean;
  usbWifiConnected?: boolean;
  deviceStatus?: Device['status'] | string;
  wifiSsid?: string | null;
  ipAddress?: string | null;
}): boolean {
  if (opts.usbConnected && opts.usbWifiConnected) return true;
  if (opts.deviceStatus !== 'Online') return false;
  const ssidOk = Boolean(opts.wifiSsid && opts.wifiSsid !== 'Offline');
  return ssidOk || isRealStationHost(opts.ipAddress);
}

/** Node is reachable: USB serial OR established Online station telemetry. */
export function isNodeOnline(usbConnected: boolean, deviceStatus?: Device['status'] | string): boolean {
  return usbConnected || deviceStatus === 'Online';
}
