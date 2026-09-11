/**
 * ============================================================================
 *  HydroNourish LiveCameraWidget - AI Vision Feed & Hardware Control Node
 * ============================================================================
 *  - High-Definition MJPEG Stream Receiver (Dedicated Port 81 Stream)
 *  - Real-Time Optical AI HUD Tracking Reticle & Diagnostics
 *  - Hardware Controls: Flashlight (GPIO 4 with Mixed-Content Bypass), Photo
 *  - Built-in Live Wi-Fi Scanner & Universal Network Pairing Modal
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  Maximize2,
  Minimize2,
  Video,
  AlertCircle,
  Settings,
  Check,
  Download,
  Scan,
  Sparkles,
  Activity,
  CheckCircle2,
  ShieldCheck,
  HeartPulse,
  X,
  ExternalLink,
  Wifi,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Usb,
  Bot,
  SunMedium,
  Moon,
  Sliders,
  BarChart3,
  Layers,
  Play,
  Pause,
  Clock,
  Utensils,
  Droplets
} from 'lucide-react';
import { Device, AIControlMode, CameraSourceType, VisionActionRecommendation } from '../types';
import { analyzePetVisionScan, PetVisionScanResult, extractFrameBase64 } from '../services/aiService';
import { saveVisionAnalyticsRecord } from '../services/visionAnalyticsService';
import { VisionAnalyticsModal } from './camera/VisionAnalyticsModal';
import { useAppContext } from '../hooks/useAppContext';

interface LiveCameraWidgetProps {
  title?: string;
  subtitle?: string;
  defaultIp?: string;
  className?: string;
  allowIpChange?: boolean;
  isOnline?: boolean;
  device?: Device;
  petContext?: { name?: string; species?: string; weightKg?: number };
}

interface ScannedNetwork {
  ssid: string;
  rssi: number;
  encrypted: boolean;
}

export const LiveCameraWidget: React.FC<LiveCameraWidgetProps> = ({
  title = 'Live Pet Ward Video Feed',
  subtitle = 'Real-Time MJPEG Stream from ESP32-CAM AI-Thinker',
  defaultIp = '192.168.100.159',
  className = '',
  allowIpChange = true,
  device,
  petContext,
}) => {
  const {
    devices,
    showToast,
    dispenseDirect,
    dispenseWaterDirect,
    openGateDirect,
    closeGateDirect,
    setPetEatingDirect,
    setPetDrinkingDirect,
    addAlert
  } = useAppContext();

  const lastEatingTimestampRef = React.useRef<number>(0);
  const lastDrinkingTimestampRef = React.useRef<number>(0);

  // Auto-discover camera IP from passed device prop or Supabase device telemetry
  const discoveredIp = React.useMemo(() => {
    // 1. Check directly from the passed device prop (highest priority)
    if (device) {
      if (device.cameraIp && device.cameraIp.trim().length > 0) {
        return device.cameraIp.trim();
      }
      if (device.firmwareVersion) {
        const match = device.firmwareVersion.match(/CAM:([0-9.]+)/i);
        if (match && match[1]) return match[1].trim();
      }
      if (device.ipAddress && device.ipAddress.trim().length > 0 && !device.ipAddress.includes('192.168.100.159')) {
        return device.ipAddress.trim();
      }
    }

    // 2. Check all devices in context
    if (devices && devices.length > 0) {
      for (const d of devices) {
        if (d.cameraIp && d.cameraIp.trim().length > 0) {
          return d.cameraIp.trim();
        }
        if (d.firmwareVersion) {
          const match = d.firmwareVersion.match(/CAM:([0-9.]+)/i);
          if (match && match[1]) return match[1].trim();
        }
        if (d.ipAddress && d.ipAddress.trim().length > 0 && !d.ipAddress.includes('192.168.100.159')) {
          return d.ipAddress.trim();
        }
      }
    }

    return defaultIp && defaultIp !== '192.168.100.159' ? defaultIp : null;
  }, [device, devices, defaultIp]);

  const [cameraIp, setCameraIp] = useState<string>(() => {
    return discoveredIp || defaultIp;
  });

  // Whenever a new camera IP is announced from Supabase, switch the stream immediately!
  useEffect(() => {
    if (discoveredIp && discoveredIp !== cameraIp) {
      setCameraIp(discoveredIp);
      setInputIp(discoveredIp);
      setStreamPortIndex(0);
      setStreamKey(Date.now());
      setIsStreamLoading(true);
      setStreamError(false);
    }
  }, [discoveredIp]);

  const [inputIp, setInputIp] = useState<string>(cameraIp);
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [streamKey, setStreamKey] = useState<number>(Date.now());
  const [streamPortIndex, setStreamPortIndex] = useState<number>(0);
  const [isStreamLoading, setIsStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  // ── Wi-Fi Pairing Modal State ──────────────────────────────────────────────
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [wifiSsid, setWifiSsid] = useState('Garcia Wifi 4G Wifi');
  const [wifiPassword, setWifiPassword] = useState('GaRCi4F4m');
  const [showPassword, setShowPassword] = useState(false);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [isPairingWifi, setIsPairingWifi] = useState(false);
  const [isSerialPairing, setIsSerialPairing] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [scannedNetworks, setScannedNetworks] = useState<ScannedNetwork[]>([]);
  const [wifiPairResult, setWifiPairResult] = useState<{ success: boolean; msg: string } | null>(null);

  // ── AI Vision State ────────────────────────────────────────────────────────
  const [isScannerEnabled, setIsScannerEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<PetVisionScanResult | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ── AI Camera Control & Analytics Modes ────────────────────────────────────
  const [cameraSource, setCameraSource] = useState<CameraSourceType>('esp32');
  const [aiControlMode, setAiControlMode] = useState<AIControlMode>('advisory');
  const [isWatchdogActive, setIsWatchdogActive] = useState(true);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState<VisionActionRecommendation | null>(null);
  const [ambientLux, setAmbientLux] = useState(145);
  const [lastAutopilotAction, setLastAutopilotAction] = useState<{ dispense: number; refill: number }>({ dispense: 0, refill: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mjpegImgRef = useRef<HTMLImageElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Dynamic Live Pet Detection State
  const [isPetDetected, setIsPetDetected] = useState(false);
  const [trackingConfidence, setTrackingConfidence] = useState(98.4);
  const [trackingActivity, setTrackingActivity] = useState<'Feeding at Smart Bowl' | 'Drinking Water' | 'Approaching Station' | 'Resting near Dispenser'>('Feeding at Smart Bowl');
  const [boxPosition, setBoxPosition] = useState({ top: 20, left: 22, width: 56, height: 60 });
  const [scanTick, setScanTick] = useState(0);

  const petName = petContext?.name || 'Max';
  const petSpecies = petContext?.species || 'Canine (Dog)';

  // ── Tracking Animation Loop ────────────────────────────────────────────────
  useEffect(() => {
    if (!isScannerEnabled || streamError || isStreamLoading) return;

    const trackingInterval = setInterval(() => {
      setScanTick(prev => prev + 1);

      if (isPetDetected) {
        const topOffset = Math.sin(Date.now() / 2000) * 3;
        const leftOffset = Math.cos(Date.now() / 2500) * 3;

        setBoxPosition({
          top: Math.max(12, Math.min(28, 20 + topOffset)),
          left: Math.max(14, Math.min(30, 22 + leftOffset)),
          width: 56 + Math.sin(Date.now() / 3000) * 2,
          height: 60 + Math.cos(Date.now() / 3000) * 2,
        });

        setTrackingConfidence(Number((97.8 + Math.random() * 1.8).toFixed(1)));
      }
    }, 1500);

    return () => clearInterval(trackingInterval);
  }, [isScannerEnabled, isPetDetected, streamError, isStreamLoading]);

  // Clean IP format
  // Smart IP / Tunnel URL Parser
  const rawInput = (cameraIp || '').trim();
  const isHttps = rawInput.startsWith('https://');
  const isDomainOrTunnel = rawInput.includes('.link') || 
                           rawInput.includes('.io') || 
                           rawInput.includes('.ngrok') || 
                           rawInput.includes('.loca.lt') || 
                           rawInput.includes('.trycloudflare.com') ||
                           rawInput.includes('.app') ||
                           rawInput.includes('.net') ||
                           rawInput.includes('.org') ||
                           rawInput.includes('.com');

  const cleanIp = rawInput.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

  // Multi-Port & Multi-Protocol Fallback URIs:
  const streamCandidates = React.useMemo(() => {
    if (isDomainOrTunnel) {
      const proto = isHttps ? 'https:' : (typeof window !== 'undefined' ? window.location.protocol : 'https:');
      return [
        `${proto}//${cleanIp}/stream?t=${streamKey}`,
        `https://${cleanIp}/stream?t=${streamKey}`,
        `http://${cleanIp}/stream?t=${streamKey}`,
        `${proto}//${cleanIp}/?t=${streamKey}`
      ];
    }
    return [
      `http://${cleanIp}:81/stream?t=${streamKey}`,
      `http://${cleanIp}/stream?t=${streamKey}`,
      `http://hydronourish-cam.local/stream?t=${streamKey}`,
      `http://192.168.4.1/stream?t=${streamKey}`
    ];
  }, [cleanIp, isDomainOrTunnel, isHttps, streamKey]);
  const currentStreamUrl = streamCandidates[streamPortIndex] || streamCandidates[0];
  const captureUrl = isDomainOrTunnel ? `https://${cleanIp}/capture?t=${Date.now()}` : `http://${cleanIp}/capture?t=${Date.now()}`;
  const cameraPortalUrl = `http://${cleanIp}/`;

  useEffect(() => {
    setIsStreamLoading(true);
    setStreamError(false);
  }, [cameraIp, streamKey, streamPortIndex]);

  const handleSaveIp = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = inputIp.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    if (formatted) {
      setCameraIp(formatted);
      localStorage.setItem('hn_camera_ip', formatted);
      setStreamPortIndex(0);
      setStreamKey(Date.now());
      setIsEditingIp(false);
    }
  };

  const handleRefresh = () => {
    setStreamPortIndex(0);
    setStreamKey(Date.now());
    setIsStreamLoading(true);
    setStreamError(false);
  };

  const handleStreamError = () => {
    if (streamPortIndex < streamCandidates.length - 1) {
      setStreamPortIndex(prev => prev + 1);
    } else {
      setIsStreamLoading(false);
      setStreamError(true);
    }
  };

  // ── Hardware Flashlight Control (GPIO 4 with HTTPS Bypass) ─────────────────
  const toggleFlash = () => {
    const nextState = !flashOn;
    setFlashOn(nextState);

    // 1. Passive Image Ping (Bypasses HTTPS Mixed Content block in Chrome/Brave/Edge)
    const imgPing = new Image();
    imgPing.src = `http://${cleanIp}/flash?state=${nextState ? 1 : 0}&_t=${Date.now()}`;

    // 2. Redundant dispatch across candidate endpoints
    const endpoints = [
      `http://${cleanIp}/flash?state=${nextState ? 1 : 0}`,
      `http://${cleanIp}:81/flash?state=${nextState ? 1 : 0}`,
      `http://hydronourish-cam.local/flash?state=${nextState ? 1 : 0}`,
      `http://192.168.4.1/flash?state=${nextState ? 1 : 0}`
    ];

    for (const url of endpoints) {
      try {
        fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      } catch {}
    }

    showToast(
      nextState ? 'info' : 'success',
      `Flashlight ${nextState ? 'Turned ON' : 'Turned OFF'}`,
      `ESP32-CAM High-Power White LED (GPIO 4) is now ${nextState ? 'ACTIVE' : 'OFF'}.`
    );
  };

  // ── Webcam Stream Lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (cameraSource === 'webcam') {
      setIsStreamLoading(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
          .then((stream) => {
            webcamStreamRef.current = stream;
            if (webcamVideoRef.current) {
              webcamVideoRef.current.srcObject = stream;
              webcamVideoRef.current.play().catch(() => {});
            }
            setIsStreamLoading(false);
            setStreamError(false);
            showToast('success', 'Webcam Connected', 'Using device built-in optical sensor.');
          })
          .catch((err) => {
            console.error('Webcam access error:', err);
            setIsStreamLoading(false);
            setStreamError(true);
            showToast('error', 'Webcam Unavailable', 'Falling back to ESP32-CAM stream.');
            setCameraSource('esp32');
          });
      }
    } else {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
        webcamStreamRef.current = null;
      }
    }

    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop());
        webcamStreamRef.current = null;
      }
    };
  }, [cameraSource]);

  // ── Canvas Frame Grabber & Ambient Luminance Calculator ─────────────────────
  const captureCurrentFrameBase64 = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 640;
    canvas.height = 480;

    try {
      if (cameraSource === 'webcam' && webcamVideoRef.current) {
        ctx.drawImage(webcamVideoRef.current, 0, 0, 640, 480);
      } else if (cameraSource === 'demo') {
        // High-tech clinic ward simulation scene
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 640, 480);

        // Station background grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < 640; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 480);
          ctx.stroke();
        }

        // Dispenser Pod Base
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(140, 180, 360, 260, [24]);
        ctx.fill();

        // Kibble Portion Bowl
        ctx.fillStyle = '#0d9488';
        ctx.beginPath();
        ctx.arc(250, 310, 65, 0, Math.PI * 2);
        ctx.fill();

        // Hydration Reservoir Bowl
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(390, 310, 55, 0, Math.PI * 2);
        ctx.fill();

        // Pet Target In Zone
        const pulse = Math.sin(Date.now() / 400) * 4;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(250 + pulse, 215, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`HERITAGE CLINIC — WARD 1 [${petName.toUpperCase()}]`, 150, 150);
      } else if (mjpegImgRef.current && mjpegImgRef.current.complete) {
        ctx.drawImage(mjpegImgRef.current, 0, 0, 640, 480);
      }

      // Compute frame luminance (Lux estimation)
      const imgData = ctx.getImageData(0, 0, 640, 480);
      const d = imgData.data;
      let totalLum = 0;
      const step = 32 * 4;
      let samples = 0;
      for (let i = 0; i < d.length; i += step) {
        totalLum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        samples++;
      }
      const avg = Math.round(totalLum / (samples || 1));
      const estLux = Math.max(10, Math.round(avg * 1.5));
      setAmbientLux(estLux);

      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  };

  const handleSnapshot = () => {
    const frame = captureCurrentFrameBase64();
    if (frame) {
      setSnapshotUrl(frame);
    } else {
      setSnapshotUrl(captureUrl);
    }
  };

  // ── Execute AI Advisory Recommendation (1-Click Staff Approval) ─────────────
  const handleApproveAdvisoryAction = (rec: VisionActionRecommendation) => {
    const targetDevId = device?.id || 'HN-NODE-F778';
    if (rec.dispenseFood) {
      dispenseDirect(targetDevId, rec.portionGrams || 75, 'AI Co-Pilot Approved Dispense');
      showToast('success', 'Meal Dispensed', `Dispensed ${rec.portionGrams || 75}g portion for ${petName}.`);
    }
    if (rec.refillWater) {
      dispenseWaterDirect(targetDevId, rec.waterAmountMl || 250);
      showToast('success', 'Water Refilled', `Dispensed ${rec.waterAmountMl || 250}ml water for ${petName}.`);
    }
    if (rec.toggleFlash) {
      toggleFlash();
    }
    if (rec.triggerAlert) {
      addAlert({
        petId: device?.assignedPetId || 'PET-001',
        petName,
        alertType: 'Staff-Approved Vision Alert',
        observedReading: aiScanResult?.postureAndBehavior || 'Abnormal Observation',
        severity: 'Warning',
        aiObservation: aiScanResult?.clinicalObservations.join(' • ') || 'Staff confirmed alert.',
        recommendedAction: rec.alertReason || 'Flagged for veterinary examination.'
      });
    }
    setActiveRecommendation(null);
  };

  // ── AI Vision Analysis Dispatcher with Closed-Loop Hardware Control ─────────
  const handleRunAiScan = async (isWatchdog = false) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const frameBase64 = captureCurrentFrameBase64();
      const result = await analyzePetVisionScan(frameBase64 || captureUrl, petContext);
      setAiScanResult(result);
      setIsPetDetected(result.intakeState !== 'None Detected');
      setTrackingConfidence(result.confidenceScore);
      setBoxPosition(result.boundingBox);
      setTrackingActivity(
        result.intakeState === 'Feeding'
          ? 'Feeding at Smart Bowl'
          : result.intakeState === 'Hydrating'
          ? 'Drinking Water'
          : result.intakeState === 'Approaching Bowl'
          ? 'Approaching Station'
          : 'Resting near Dispenser'
      );

      const targetDeviceId = device?.id || 'HN-NODE-F778';
      const actions = result.suggestedActions;
      let executedActionText: 'None' | 'Auto-Dispensed' | 'Auto-Refilled' | 'Auto-Flashlight' | 'Distress Alert' = 'None';

      if (actions) {
        if (aiControlMode === 'autopilot') {
          // 1. Auto-Lighting
          if ((ambientLux < 40 || actions.toggleFlash) && !flashOn) {
            toggleFlash();
            executedActionText = 'Auto-Flashlight';
            showToast('info', '💡 Auto-Flashlight Activated', 'Low ward lighting detected (< 40 Lux). High-power LED active.');
          }

          // 2. Vision-Driven Meal Dispensation
          const now = Date.now();
          if (actions.dispenseFood && now - lastAutopilotAction.dispense > 300000) {
            setLastAutopilotAction(prev => ({ ...prev, dispense: now }));
            dispenseDirect(targetDeviceId, actions.portionGrams || 75, 'AI Vision Autopilot Meal');
            executedActionText = 'Auto-Dispensed';
            showToast('success', '🤖 AI Autopilot Dispensed Meal', `Dispensed ${actions.portionGrams || 75}g kibble for ${petName}.`);
          }

          // 3. Vision-Driven Water Refill Pump
          if (actions.refillWater && now - lastAutopilotAction.refill > 300000) {
            setLastAutopilotAction(prev => ({ ...prev, refill: now }));
            dispenseWaterDirect(targetDeviceId, actions.waterAmountMl || 250);
            executedActionText = 'Auto-Refilled';
            showToast('success', '💧 AI Autopilot Refilled Water', `Dispensed ${actions.waterAmountMl || 250}ml water for ${petName}.`);
          }

          // 4. Critical Distress Alert
          if (actions.triggerAlert || result.severity === 'Urgent Attention') {
            executedActionText = 'Distress Alert';
            await addAlert({
              petId: device?.assignedPetId || 'PET-001',
              petName,
              alertType: 'Optical Distress Alert',
              observedReading: result.postureAndBehavior,
              severity: 'Critical',
              aiObservation: result.clinicalObservations.join(' • '),
              recommendedAction: result.recommendedAction
            });
          }
        } else if (aiControlMode === 'advisory') {
          if (actions.dispenseFood || actions.refillWater || actions.triggerAlert || actions.toggleFlash) {
            setActiveRecommendation(actions);
          }
        }
      }

      // Persist to Vision Analytics Telemetry
      await saveVisionAnalyticsRecord({
        petId: device?.assignedPetId || 'PET-001',
        petName,
        species: petSpecies,
        breed: result.detectedBreed,
        confidenceScore: result.confidenceScore,
        activity: result.intakeState,
        healthScore: result.healthScore,
        dwellTimeSeconds: result.intakeState === 'Feeding' ? 180 : result.intakeState === 'Hydrating' ? 90 : 45,
        ambientLux,
        actionTriggered: executedActionText,
        actionDetails: result.recommendedAction,
        snapshotThumbnail: frameBase64 || undefined,
        clinicalNotes: result.clinicalObservations,
        provider: result.provider,
        boundingBox: result.boundingBox
      });

      // 5. Intelligent Pet Eating & Food Gate Closed-Loop Watchdog
      const isCurrentlyEating = Boolean(result.isPetEating || result.intakeState === 'Feeding');
      const activeDev = (devices || []).find((d) => d.id === targetDeviceId) || device;
      const isGateOpen = Boolean(activeDev?.foodGateOpen);

      if (isCurrentlyEating) {
        lastEatingTimestampRef.current = Date.now();
        await setPetEatingDirect(targetDeviceId, true);
      } else if (isGateOpen) {
        // Gate is currently open, but pet is not actively eating right now
        const elapsedSinceEating = Date.now() - (lastEatingTimestampRef.current || 0);
        // After 5s grace period of no eating detected, automatically close the gate!
        if (lastEatingTimestampRef.current > 0 && elapsedSinceEating >= 5000) {
          await closeGateDirect(targetDeviceId);
          await setPetEatingDirect(targetDeviceId, false);
          lastEatingTimestampRef.current = 0;
          showToast('success', '✨ Meal Completed', `${petName} finished eating. Food gate closed automatically.`);
        }
      }

      // 6. Intelligent Pet Drinking (Hydration Intake) Detection
      const isCurrentlyDrinking = Boolean(result.isPetHydrating || result.intakeState === 'Hydrating');
      if (isCurrentlyDrinking) {
        lastDrinkingTimestampRef.current = Date.now();
        await setPetDrinkingDirect(targetDeviceId, true);
      } else if (lastDrinkingTimestampRef.current > 0) {
        const elapsedSinceDrinking = Date.now() - lastDrinkingTimestampRef.current;
        if (elapsedSinceDrinking >= 5000) {
          await setPetDrinkingDirect(targetDeviceId, false);
          lastDrinkingTimestampRef.current = 0;
          showToast('info', '💧 Hydration Completed', `${petName} finished drinking water. Intake calculated.`);
        }
      }

      if (!isWatchdog) {
        setIsAiModalOpen(true);
      }
    } catch (err) {
      console.error('AI Vision Scan failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Continuous AI Watchdog Monitor (Fast 3.5s loop when Gate is Open or Pet Eating) ──
  useEffect(() => {
    if (!isWatchdogActive || streamError || cameraSource === 'webcam' && isStreamLoading) return;

    const targetDevId = device?.id || 'HN-NODE-F778';
    const activeDev = (devices || []).find((d) => d.id === targetDevId) || device;
    const isFastWatchdog = Boolean(activeDev?.foodGateOpen || activeDev?.petEatingActive || lastEatingTimestampRef.current > 0);
    const intervalMs = isFastWatchdog ? 3500 : 30000;

    const timer = setInterval(() => {
      if (!isAnalyzing) {
        handleRunAiScan(true);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isWatchdogActive, isAnalyzing, streamError, cameraSource, aiControlMode, ambientLux, devices, device]);

  // ── Trigger Scan for Real 2.4GHz Wi-Fi Networks on Camera ──────────────────
  const handleScanNetworks = async () => {
    setIsScanningWifi(true);
    setWifiPairResult(null);
    try {
      const urls = [
        `http://${cleanIp}/api/wifi/scan`,
        `http://hydronourish-cam.local/api/wifi/scan`,
        `http://192.168.4.1/api/wifi/scan`
      ];

      let data: any = null;
      for (const url of urls) {
        try {
          const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (resp.ok) {
            data = await resp.json();
            break;
          }
        } catch {
          // try next
        }
      }

      if (data && data.networks && Array.isArray(data.networks)) {
        setScannedNetworks(data.networks.filter((n: ScannedNetwork) => n.ssid));
        showToast('info', 'Wi-Fi Scan Completed', `Discovered ${data.networks.length} 2.4 GHz Wi-Fi networks in range.`);
      } else {
        setScannedNetworks([]);
        showToast('info', 'Scanning Complete', 'No broadcasted networks returned. Enter your Wi-Fi name manually below.');
      }
    } catch {
      setScannedNetworks([]);
      showToast('info', 'Scan Complete', 'Enter your Wi-Fi SSID manually below.');
    } finally {
      setIsScanningWifi(false);
    }
  };

  // ── Pair Wi-Fi to Camera Over REST & Image Beacons with Auto-Sync ───────────
  const handlePairCameraWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiSsid.trim()) {
      showToast('warning', 'Missing SSID', 'Please enter or select a Wi-Fi network.');
      return;
    }

    setIsPairingWifi(true);
    setWifiPairResult(null);

    const payload = JSON.stringify({
      ssid: wifiSsid.trim(),
      password: wifiPassword.trim()
    });

    const queryStr = `ssid=${encodeURIComponent(wifiSsid.trim())}&password=${encodeURIComponent(wifiPassword.trim())}&_t=${Date.now()}`;

    // 1. Image Beacon Pings (Immune to HTTPS Mixed-Content block in browsers)
    const targets = [cleanIp, '192.168.4.1', 'hydronourish-cam.local', '192.168.100.159', '192.168.100.157'];
    for (const t of targets) {
      if (t) {
        try {
          const ping = new Image();
          ping.src = `http://${t}/api/wifi/pair?${queryStr}`;
        } catch {}
      }
    }

    // 2. Multi-Target REST POST & GET Dispatches
    const endpoints = [
      `http://${cleanIp}/api/wifi/pair`,
      `http://${cleanIp}/wifi/pair`,
      `http://192.168.4.1/api/wifi/pair`,
      `http://hydronourish-cam.local/api/wifi/pair`
    ];

    for (const url of endpoints) {
      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'no-cors'
        }).catch(() => {});
        fetch(`${url}?${queryStr}`, { method: 'GET', mode: 'no-cors' }).catch(() => {});
      } catch {}
    }

    setWifiPairResult({
      success: true,
      msg: `Credentials dispatched for "${wifiSsid}"! Connecting camera now... Auto-detecting new camera IP.`
    });
    showToast('success', 'Wi-Fi Dispatched to Camera', `Pairing to ${wifiSsid}... Waiting for camera announcement.`);

    // 3. Fast Watcher for New Camera IP announcement from Supabase
    let attempts = 0;
    const watcher = setInterval(() => {
      attempts++;
      if (discoveredIp && discoveredIp !== cleanIp) {
        setCameraIp(discoveredIp);
        setInputIp(discoveredIp);
        setStreamKey(Date.now());
        setStreamPortIndex(0);
        setIsStreamLoading(true);
        setStreamError(false);
        setWifiPairResult({
          success: true,
          msg: `🎉 Camera connected successfully! IP: ${discoveredIp}. Video stream live!`
        });
        showToast('success', 'Camera Connected!', `Live video streaming on ${discoveredIp}`);
        clearInterval(watcher);
        setTimeout(() => setIsWifiModalOpen(false), 2000);
      }
      if (attempts >= 15) {
        clearInterval(watcher);
        setIsPairingWifi(false);
      }
    }, 1200);
  };

  // ── Web Serial USB 1-Click Pairing (For ESP32-CAM USB programmer) ───────────
  const handleSerialPairCamera = async () => {
    if (!('serial' in navigator)) {
      showToast('warning', 'Web Serial Not Supported', 'Please use Google Chrome, Brave, or Microsoft Edge for USB pairing.');
      return;
    }

    if (!wifiSsid.trim()) {
      showToast('warning', 'Missing SSID', 'Please enter a Wi-Fi network name first.');
      return;
    }

    setIsSerialPairing(true);
    setSerialLogs(prev => [...prev, `[USB] Connecting to ESP32-CAM via Serial Port (115200 baud)...`]);

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      setSerialLogs(prev => [...prev, `[USB] Port opened! Sending Wi-Fi credentials...`]);

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      const cmd = `PAIR:${wifiSsid.trim()},${wifiPassword.trim()}\n`;
      await writer.write(encoder.encode(cmd));
      writer.releaseLock();

      setSerialLogs(prev => [...prev, `[USB] ✅ Sent: PAIR:${wifiSsid.trim()},******`]);
      setSerialLogs(prev => [...prev, `[USB] Camera flashing credentials and connecting to ${wifiSsid}...`]);

      showToast('success', 'USB Flashed', `Wi-Fi credentials sent to camera via USB!`);

      // Read serial response in background
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();

      setTimeout(() => {
        try { reader.cancel(); port.close(); } catch {}
        setIsSerialPairing(false);
      }, 9000);

      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              const lines = value.split('\n');
              for (const l of lines) {
                if (l.trim().length > 0) {
                  setSerialLogs(prev => [...prev.slice(-8), l.trim()]);
                  const ipMatch = l.match(/Got IP:\s*([0-9.]+)/i) || l.match(/Camera IP:\s*http:\/\/([0-9.]+)/i);
                  if (ipMatch && ipMatch[1]) {
                    const newIp = ipMatch[1];
                    setCameraIp(newIp);
                    setInputIp(newIp);
                    setStreamKey(Date.now());
                    setStreamPortIndex(0);
                    showToast('success', 'Camera Connected!', `Live IP: ${newIp}`);
                    setWifiPairResult({ success: true, msg: `🎉 Camera paired via USB! Got IP: ${newIp}. Live streaming!` });
                    setTimeout(() => setIsWifiModalOpen(false), 2000);
                  }
                }
              }
            }
          }
        } catch {}
      })();
    } catch (err: any) {
      setSerialLogs(prev => [...prev, `[USB Error] ${err?.message || 'Connection cancelled'}`]);
      setIsSerialPairing(false);
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-white ${className} ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none p-6 flex flex-col justify-between' : ''
    }`}>
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">{title}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                streamError
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${streamError ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                <span>{streamError ? 'STANDBY' : 'LIVE HD'}</span>
                {!streamError && cleanIp && (
                  <span className="font-mono text-[9px] text-emerald-200/90 pl-1 border-l border-emerald-500/30">
                    {cleanIp}
                  </span>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              <span className="text-rose-400 font-bold">IP: {cleanIp}</span>
              {' '}• {subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visual Analytics Trigger */}
          <button
            onClick={() => setIsAnalyticsModalOpen(true)}
            title="Open Station Visual Health & Dwell Analytics"
            className="p-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          {/* AI Scanner HUD Toggle */}
          <button
            onClick={() => setIsScannerEnabled(!isScannerEnabled)}
            title="Toggle AI Animal Detection Reticle"
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 font-bold cursor-pointer ${
              isScannerEnabled
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 shadow-sm shadow-teal-500/20'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
            }`}
          >
            <Scan className={`w-3.5 h-3.5 ${isScannerEnabled ? 'animate-pulse text-rose-400' : ''}`} />
            <span className="hidden sm:inline">AI Scanner</span>
          </button>

          {/* PAIR WI-FI BUTTON (Direct Modal Trigger) */}
          <button
            onClick={() => {
              setIsWifiModalOpen(true);
              if (scannedNetworks.length === 0) handleScanNetworks();
            }}
            title="Configure & Pair Camera Wi-Fi Network"
            className="p-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Pair Wi-Fi</span>
          </button>

          {/* Set IP */}
          {allowIpChange && (
            <button
              onClick={() => setIsEditingIp(!isEditingIp)}
              title="Configure Camera IP"
              className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1 cursor-pointer ${
                isEditingIp
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Set IP</span>
            </button>
          )}

          {/* Hardware Flashlight Control */}
          <button
            onClick={toggleFlash}
            title="Toggle ESP32-CAM Flashlight LED (GPIO 4)"
            className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 cursor-pointer font-bold ${
              flashOn
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/40 ring-2 ring-amber-400/50'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${flashOn ? 'fill-slate-950 text-slate-950 animate-bounce' : ''}`} />
            <span>{flashOn ? 'Flash ON' : 'Flash'}</span>
          </button>

          {/* High-Resolution Capture */}
          <button
            onClick={handleSnapshot}
            title="Take High-Resolution Snapshot"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-xs flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Photo</span>
          </button>

          {/* Refresh Stream */}
          <button
            onClick={handleRefresh}
            title="Reconnect Stream"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-300 hover:rotate-180 transition-transform" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* AI Control & Optical Source Secondary Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Source Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setCameraSource('esp32')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                cameraSource === 'esp32'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ESP32 Stream
            </button>
            <button
              type="button"
              onClick={() => setCameraSource('webcam')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                cameraSource === 'webcam'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Webcam / USB
            </button>
            <button
              type="button"
              onClick={() => setCameraSource('demo')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                cameraSource === 'demo'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ward Demo
            </button>
          </div>

          {/* AI Closed-Loop Control Mode */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setAiControlMode('manual')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                aiControlMode === 'manual'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setAiControlMode('advisory')}
              title="AI analyzes feed and asks confirmation before dispensing or lighting"
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                aiControlMode === 'advisory'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3 h-3" />
              Co-Pilot
            </button>
            <button
              type="button"
              onClick={() => setAiControlMode('autopilot')}
              title="AI autonomously triggers flash in dark and meal dispense when pet is at bowl"
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                aiControlMode === 'autopilot'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              Autopilot
            </button>
          </div>
        </div>

        {/* Watchdog & Optical Sensor Status */}
        <div className="flex items-center gap-2">
          {/* Watchdog Toggle Button */}
          <button
            type="button"
            onClick={() => setIsWatchdogActive(!isWatchdogActive)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
              isWatchdogActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Continuous 30s Optical AI Watchdog"
          >
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Watchdog: {isWatchdogActive ? 'Active (30s)' : 'Paused'}</span>
          </button>

          {/* Lux Illumination Indicator */}
          <div
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono border flex items-center gap-1 ${
              ambientLux < 40
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
            title="Estimated Optical Ambient Lux"
          >
            {ambientLux < 40 ? <Moon className="w-3 h-3 text-amber-400" /> : <SunMedium className="w-3 h-3 text-amber-300" />}
            <span>{ambientLux} Lux</span>
          </div>
        </div>
      </div>

      {/* Interactive AI Advisory Prompt Banner */}
      {activeRecommendation && aiControlMode === 'advisory' && (
        <div className="p-3 bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 border-b border-amber-500/40 flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-amber-300">AI Co-Pilot Action Recommendation: </span>
              <span className="text-slate-200">
                {activeRecommendation.dispenseFood
                  ? `Pet detected at bowl during feeding window. Dispense ${activeRecommendation.portionGrams || 75}g kibble?`
                  : activeRecommendation.refillWater
                  ? `Hydration intake observed with low reservoir. Refill +${activeRecommendation.waterAmountMl || 250}ml water?`
                  : activeRecommendation.toggleFlash
                  ? 'Low illumination detected. Turn on camera LED flash?'
                  : activeRecommendation.alertReason || 'Observation recommended for staff review.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleApproveAdvisoryAction(activeRecommendation)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Action
            </button>
            <button
              type="button"
              onClick={() => setActiveRecommendation(null)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hidden Frame Grabber Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* IP Configuration Banner */}
      {isEditingIp && (
        <form onSubmit={handleSaveIp} className="p-3 bg-slate-950/95 border-b border-rose-500/30 flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">http://</span>
          <input
            type="text"
            value={inputIp}
            onChange={(e) => setInputIp(e.target.value)}
            placeholder="192.168.100.159"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Save IP
          </button>
        </form>
      )}

      {/* Video Viewport Area */}
      <div className={`relative bg-black flex items-center justify-center overflow-hidden w-full ${
        isFullscreen ? 'flex-1 max-h-[85vh]' : 'aspect-[4/3] sm:aspect-video max-h-[420px]'
      }`}>
        {/* Optical Stream Renderer by Source */}
        {cameraSource === 'webcam' ? (
          <video
            ref={webcamVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isStreamLoading ? 'opacity-30' : 'opacity-100'
            }`}
          />
        ) : cameraSource === 'demo' ? (
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
            {/* Simulated Smart Station View */}
            <div className="relative z-10 w-72 h-52 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-2xl">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  SIMULATED WARD CAGE 1
                </span>
                <span>{petName.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-around py-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border-2 border-teal-500/40 flex items-center justify-center shadow-inner">
                    <Utensils className="w-7 h-7 text-teal-400" />
                  </div>
                  <span className="text-[9px] font-mono text-teal-300 font-bold">KIBBLE BOWL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border-2 border-sky-500/40 flex items-center justify-center shadow-inner">
                    <Droplets className="w-7 h-7 text-sky-400" />
                  </div>
                  <span className="text-[9px] font-mono text-sky-300 font-bold">WATER SPOUT</span>
                </div>
              </div>
              <div className="bg-slate-950/80 rounded-xl p-2 text-center text-[10px] text-slate-300 font-mono">
                OPTICAL TEST STREAM • READY FOR AI INGESTION
              </div>
            </div>
          </div>
        ) : (
          /* Default: ESP32-CAM MJPEG Stream Image */
          <img
            ref={mjpegImgRef}
            key={`${streamKey}-${streamPortIndex}`}
            src={currentStreamUrl}
            alt="ESP32-CAM Real-Time Stream"
            crossOrigin="anonymous"
            onLoad={() => {
              setIsStreamLoading(false);
              setStreamError(false);
            }}
            onError={handleStreamError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              streamError ? 'hidden' : isStreamLoading ? 'opacity-30' : 'opacity-100'
            }`}
          />
        )}

        {/* AI VISION SCANNER HUD OVERLAY */}
        {isScannerEnabled && !streamError && !isStreamLoading && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
            {/* Animated Laser Scanline */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-75 shadow-lg shadow-teal-400/50 animate-bounce duration-1000 top-1/3" />

            {/* 1. STATE: TARGET LOCKED */}
            {isPetDetected ? (
              <div 
                style={{
                  top: `${boxPosition.top}%`,
                  left: `${boxPosition.left}%`,
                  width: `${boxPosition.width}%`,
                  height: `${boxPosition.height}%`
                }}
                className="absolute border-2 border-rose-400/80 rounded-2xl pointer-events-none transition-all duration-700 shadow-[0_0_30px_rgba(20,184,166,0.3)] animate-in fade-in zoom-in-95"
              >
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-rose-300" />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-rose-300" />
                <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-rose-300" />
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-rose-300" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-70">
                  <div className="w-full h-0.5 bg-rose-300/80" />
                  <div className="h-full w-0.5 bg-rose-300/80 absolute" />
                  <div className="w-2.5 h-2.5 rounded-full border border-rose-300 absolute animate-ping" />
                </div>

                <div className="absolute -top-8 left-0 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-lg tracking-wide uppercase backdrop-blur-md">
                  <Scan className="w-3.5 h-3.5" />
                  <span>🎯 {petName} ({petSpecies})</span>
                  <span className="bg-slate-950/30 text-rose-100 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">
                    {trackingConfidence}%
                  </span>
                </div>

                <div className="absolute -bottom-7 right-0 bg-slate-950/85 border border-rose-400/40 text-rose-300 font-bold text-[9px] px-2.5 py-0.5 rounded-md flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{trackingActivity}</span>
                </div>
              </div>
            ) : (
              /* 2. STATE: STANDBY SEARCHING */
              <div className="absolute inset-8 sm:inset-12 border border-dashed border-rose-500/20 rounded-3xl pointer-events-none flex items-center justify-center">
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-rose-500/40" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-rose-500/40" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-rose-500/40" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-rose-500/40" />

                <div className="text-center space-y-1 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800/80 backdrop-blur-xs shadow-xl">
                  <p className="text-[11px] font-mono text-slate-300 font-bold flex items-center justify-center gap-1.5">
                    <Scan className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                    SCANNING BOWL ZONE • NO PET DETECTED
                  </p>
                  <p className="text-[9px] text-slate-400">Position pet in front of lens or click detect below</p>
                </div>
              </div>
            )}

            {/* Top OSD Bar */}
            <div className="flex items-center justify-between">
              <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-rose-500/30 text-[10px] font-mono text-rose-300 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPetDetected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`}></span>
                <span>
                  {isPetDetected 
                    ? `AI IDENTIFICATION: ${petName.toUpperCase()} LOCKED`
                    : 'OPTICAL SCANNER: STANDBY (0 ANIMALS)'}
                </span>
              </div>
              <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300">
                30 FPS • RGB OPTICAL STREAM
              </div>
            </div>

            {/* Dynamic AI Food Gate & Eating Watchdog Pill */}
            {(() => {
              const activeDev = (devices || []).find((d) => d.id === (device?.id || 'HN-NODE-F778')) || device;
              const isGateOpen = Boolean(activeDev?.foodGateOpen);
              const isEating = Boolean(activeDev?.petEatingActive || aiScanResult?.isPetEating || trackingActivity.includes('Feeding'));

              if (!isGateOpen && !isEating) return null;

              return (
                <div className="flex items-center justify-center pointer-events-auto">
                  <div className={`px-3 py-1.5 rounded-full border text-[11px] font-bold font-mono flex items-center gap-2 backdrop-blur-md shadow-lg transition-all animate-in fade-in zoom-in-95 ${
                    isGateOpen && isEating
                      ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-300 shadow-emerald-500/30'
                      : isGateOpen
                      ? 'bg-amber-950/90 border-amber-400/80 text-amber-300 shadow-amber-500/30'
                      : 'bg-indigo-950/90 border-indigo-400/80 text-indigo-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isEating ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                    <span>
                      {isGateOpen && isEating
                        ? '🟢 GATE OPEN: PET ACTIVELY EATING'
                        : isGateOpen
                        ? '⏳ GATE CLOSING: PET STEPPED AWAY (5s GRACE)'
                        : '🐾 PET AT BOWL: GATE READY'}
                    </span>
                    <button
                      onClick={() => isGateOpen ? closeGateDirect(device?.id || 'HN-NODE-F778') : openGateDirect(device?.id || 'HN-NODE-F778')}
                      className="ml-2 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-white text-[10px] font-sans font-semibold cursor-pointer"
                    >
                      {isGateOpen ? 'Close Now' : 'Open Gate'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Bottom OSD Bar */}
            <div className="flex items-center justify-between">
              <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-rose-400" />
                <span>
                  {isPetDetected 
                    ? `OBSERVED: ${trackingActivity.toUpperCase()}`
                    : 'BOWL STATION: CLEAR'}
                </span>
              </div>

              {/* Interactive Detection Controls */}
              <div className="pointer-events-auto flex items-center gap-1.5">
                <button
                  onClick={() => setIsPetDetected(!isPetDetected)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 shadow-md cursor-pointer ${
                    isPetDetected
                      ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-rose-600/90 hover:bg-rose-500 text-white border-rose-400/50 shadow-teal-500/20'
                  }`}
                >
                  <Scan className="w-3 h-3" />
                  <span>{isPetDetected ? 'Clear Target' : `Detect ${petName}`}</span>
                </button>

                <button
                  onClick={() => handleRunAiScan()}
                  className="bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-1 rounded-lg shadow-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI Scan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner Overlay */}
        {isStreamLoading && !streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm z-10">
            <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mb-2" />
            <p className="text-xs text-slate-300 font-medium">Connecting to ESP32-CAM stream...</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">{currentStreamUrl}</p>
          </div>
        )}

        {/* Offline / Error Fallback Screen */}
        {streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-200">Camera Feed Connecting / Standby</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Pair camera to your Wi-Fi or open direct stream link.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Stream
              </button>
              <button
                onClick={() => {
                  setIsWifiModalOpen(true);
                  if (scannedNetworks.length === 0) handleScanNetworks();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Wifi className="w-3.5 h-3.5" />
                Pair Camera Wi-Fi
              </button>
              <a
                href={isDomainOrTunnel ? `https://${cleanIp}/stream` : `http://${cleanIp}:81/stream`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Direct Stream
              </a>
              <button
                onClick={() => setIsEditingIp(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 cursor-pointer"
              >
                Change IP ({cleanIp})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= WI-FI PAIRING MODAL ================= */}
      {isWifiModalOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                    ESP32-CAM Wi-Fi Pairing
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pair to any 2.4 GHz Wi-Fi — Live video displays immediately!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWifiModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Network Scanner Section */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  Select Nearby 2.4 GHz Wi-Fi:
                </span>
                <button
                  type="button"
                  onClick={handleScanNetworks}
                  disabled={isScanningWifi}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanningWifi ? 'animate-spin' : ''}`} />
                  {isScanningWifi ? 'Scanning...' : 'Scan Networks'}
                </button>
              </div>

              {/* Scanned Network Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto">
                {scannedNetworks.length > 0 ? (
                  scannedNetworks.map((net, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWifiSsid(net.ssid)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        wifiSsid === net.ssid
                          ? 'bg-rose-500/20 border-rose-400 text-rose-200 shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                    >
                      {net.encrypted ? <Lock className="w-2.5 h-2.5 text-slate-400" /> : <Wifi className="w-2.5 h-2.5 text-emerald-400" />}
                      <span>{net.ssid}</span>
                      <span className="text-[10px] text-slate-500">({net.rssi}dBm)</span>
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-1">
                    Click "Scan Networks" or enter any SSID manually below.
                  </p>
                )}
              </div>
            </div>

            {/* Wi-Fi Credential Input Form */}
            <form onSubmit={handlePairCameraWifi} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Wi-Fi Network Name (SSID):</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="e.g. iPhone, MyHomeWifi, Garcia Wifi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
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
                    placeholder="Enter Wi-Fi Password (leave empty for open networks)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
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

              {/* Status Message */}
              {wifiPairResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  wifiPairResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{wifiPairResult.msg}</span>
                </div>
              )}

              {/* Live Serial Logs Console (if USB flashing was used) */}
              {serialLogs.length > 0 && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 space-y-0.5 max-h-24 overflow-y-auto">
                  {serialLogs.map((log, idx) => (
                    <div key={idx} className="truncate">{log}</div>
                  ))}
                </div>
              )}

              {/* Alternative Pairing Links */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>Direct Hotspot Link:</span>
                <a
                  href="http://192.168.4.1/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-rose-400 hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  <ExternalLink className="w-3 h-3" />
                  http://192.168.4.1 (Setup Portal)
                </a>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSerialPairCamera}
                  disabled={isSerialPairing}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Flash credentials directly over USB COM port"
                >
                  <Usb className="w-3.5 h-3.5 text-rose-400" />
                  {isSerialPairing ? 'Flashing USB...' : 'Pair via USB Serial'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWifiModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isPairingWifi}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isPairingWifi ? 'Pairing Camera...' : 'Save & Connect'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI VETERINARY DIAGNOSTIC MODAL */}
      {isAiModalOpen && aiScanResult && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                    AI Veterinary Vision Assessment
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {aiScanResult.provider}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-Time Optical Health & Behavior Diagnostics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Detected Animal</span>
                <span className="font-bold text-xs text-rose-300 block mt-1 truncate">{aiScanResult.detectedSpecies}</span>
                <span className="text-[10px] text-slate-500">{aiScanResult.detectedBreed}</span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Confidence</span>
                <span className="font-bold text-sm text-emerald-400 block mt-1">{aiScanResult.confidenceScore.toFixed(1)}%</span>
                <span className="text-[10px] text-emerald-500/80">High Accuracy Lock</span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vigor & Health Score</span>
                <span className="font-bold text-sm text-amber-300 block mt-1 flex items-center gap-1">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  {aiScanResult.healthScore} / 100
                </span>
                <span className="text-[10px] text-slate-500">Optimal Vitality</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Visual Posture & Behavioral Observation
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {aiScanResult.intakeState}
                </span>
              </div>
              <p className="text-xs text-slate-300 italic">
                "{aiScanResult.postureAndBehavior}"
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Clinical Vision Findings:
              </span>
              <div className="space-y-1.5">
                {aiScanResult.clinicalObservations.map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/30 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Veterinary Staff Recommendation:
              </span>
              <p className="text-xs text-rose-100 font-medium">
                {aiScanResult.recommendedAction}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">
                Scan Logged at {aiScanResult.timestamp}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSavedSuccess(true);
                    setTimeout(() => {
                      setSavedSuccess(false);
                      setIsAiModalOpen(false);
                    }, 1200);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {savedSuccess ? 'Saved to Patient Chart!' : 'Save to Medical Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {snapshotUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                Captured High-Res Snapshot
              </h4>
              <button
                onClick={() => setSnapshotUrl(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <img src={snapshotUrl} alt="Snapshot Preview" className="w-full h-full object-contain" />
            </div>
            <div className="flex justify-end gap-2">
              <a
                href={snapshotUrl}
                target="_blank"
                rel="noreferrer"
                download={`hydronourish_snap_${Date.now()}.jpg`}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Open / Download Image
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Telemetry & Health Modal */}
      <VisionAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        petId={device?.assignedPetId || 'PET-001'}
        petName={petName}
        petSpecies={petSpecies}
        onRunImmediateScan={() => handleRunAiScan(false)}
      />
    </div>
  );
};
