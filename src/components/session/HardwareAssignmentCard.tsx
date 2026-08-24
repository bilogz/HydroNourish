/**
 * HydroNourish — Hardware Assignment Card
 * Prominent admin dashboard card showing current device/pet/session state.
 */

import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../StatusBadge';
import { useSession } from '../../contexts/SessionContext';
import {
  Cpu,
  Dog,
  User,
  Calendar,
  Clock,
  Utensils,
  Droplets,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Wifi,
  WifiOff,
  Thermometer,
  Heart,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface HardwareAssignmentCardProps {
  onAssignClick: () => void;
  onViewSession: () => void;
  onViewPet: (petId: string) => void;
  onCompleteSession: () => void;
  onCancelSession: () => void;
}

export const HardwareAssignmentCard: React.FC<HardwareAssignmentCardProps> = ({
  onAssignClick,
  onViewSession,
  onViewPet,
  onCompleteSession,
  onCancelSession,
}) => {
  const { activeSession, queuedSessions, hardware, canAssignPet, admitNextFromQueue } = useSession();
  const [elapsed, setElapsed] = useState('');
  const isOnline = hardware.status === 'Online';

  // Live session duration timer
  useEffect(() => {
    if (!activeSession) {
      setElapsed('');
      return;
    }

    const calcElapsed = () => {
      const start = new Date(activeSession.startTime).getTime();
      const now = Date.now();
      const diff = now - start;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `${days}d ${hours}h ${mins}m`;
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins}m`;
    };

    setElapsed(calcElapsed());
    const timer = setInterval(() => setElapsed(calcElapsed()), 60000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const isConnected = Boolean(hardware && hardware.id !== 'No Device Connected' && hardware.status === 'Online');

  // ─── Empty state: no active session ──────────────────────────────────

  if (!activeSession) {
    return (
      <div className="clinic-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-teal-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                <Cpu className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Current Hardware Assignment</h3>
                <p className="text-[11px] text-slate-300">
                  {isConnected ? `${hardware.deviceName} • ${hardware.id}` : 'No Device Connected'}
                </p>
              </div>
            </div>
            <StatusBadge status={isConnected ? (hardware.hardwareStatus.charAt(0).toUpperCase() + hardware.hardwareStatus.slice(1)) : 'Vacant'} size="sm" />
          </div>
        </div>

        {/* Empty State Body */}
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Cpu className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {isConnected ? 'The HydroNourish hardware is currently available.' : 'No Hardware Device Connected'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isConnected
                ? 'No pet is currently active in the feeder station. You can assign a new pet or admit from the queue.'
                : 'Pair or connect an ESP32 hardware cage node to begin monitoring patient food and water telemetry.'}
            </p>
          </div>

          {queuedSessions.length > 0 && isConnected && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 max-w-md mx-auto text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Next in Admission Queue (1 of {queuedSessions.length})
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                  {queuedSessions[0].id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={queuedSessions[0].petAvatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                  alt={queuedSessions[0].petName}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-amber-300"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="font-extrabold text-slate-900 text-xs truncate">{queuedSessions[0].petName}</h5>
                  <p className="text-[11px] text-slate-500 truncate">Owner: {queuedSessions[0].ownerName} • {queuedSessions[0].petSpecies}</p>
                </div>
                <button
                  onClick={() => admitNextFromQueue('Clinic Staff')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all shrink-0 cursor-pointer"
                >
                  Admit Now
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            {canAssignPet() && isConnected ? (
              <button
                onClick={onAssignClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Assign Pet &amp; Owner
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                {isConnected ? `Hardware is ${hardware.hardwareStatus}. Assignment unavailable.` : 'Hardware Offline. Pair a device node first.'}
              </div>
            )}
          </div>

          {/* Device quick info */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs max-w-sm mx-auto">
            <div className="text-center">
              <span className="text-slate-500 block">Connection</span>
              <span className={`font-bold ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">Food Level</span>
              <span className="font-bold text-slate-800">
                {isConnected ? `${hardware.foodLevelPct}%` : 'N/A'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">Water Level</span>
              <span className="font-bold text-slate-800">
                {isConnected ? `${hardware.waterLevelPct}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active session display ──────────────────────────────────────────

  return (
    <div className="clinic-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-teal-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <Cpu className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Current Hardware Assignment</h3>
              <p className="text-[11px] text-indigo-200">{hardware.deviceName} • {hardware.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status="Occupied" size="sm" />
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pet Info Column */}
          <div className="lg:col-span-4">
            <div className="flex items-start gap-4">
              <img
                src={activeSession.petAvatarUrl}
                alt={activeSession.petName}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-100 shadow-md"
              />
              <div className="min-w-0">
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">{activeSession.petName}</h4>
                <p className="text-xs text-slate-500 font-medium">{activeSession.petSpecies} • {activeSession.petBreed}</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{activeSession.ownerName}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admitted {new Date(activeSession.admissionDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details Column */}
          <div className="lg:col-span-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-500">Session Start:</span>
                <span className="font-bold text-slate-800">{new Date(activeSession.startTime).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-500">Duration:</span>
                <span className="font-extrabold text-indigo-700">{elapsed || 'Just started'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-slate-500">Expected Release:</span>
                <span className="font-bold text-slate-800">{new Date(activeSession.expectedReleaseDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-rose-500" />}
                <span className="text-slate-500">Device:</span>
                <span className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>{hardware.status}</span>
                <span className="text-slate-400">• {hardware.lastTransmission}</span>
              </div>
            </div>
          </div>

          {/* Device Levels + Vitals Column */}
          <div className="lg:col-span-4">
            <div className="space-y-3">
              {/* Food Level */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Utensils className="w-3.5 h-3.5 text-orange-500" /> Food Container
                  </span>
                  <span className="font-bold text-slate-800">{hardware.foodLevelPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${hardware.foodLevelPct > 30 ? 'bg-orange-400' : 'bg-rose-500'}`}
                    style={{ width: `${hardware.foodLevelPct}%` }}
                  />
                </div>
              </div>
              {/* Water Level */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" /> Water Container
                  </span>
                  <span className="font-bold text-slate-800">{hardware.waterLevelPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${hardware.waterLevelPct > 30 ? 'bg-sky-400' : 'bg-rose-500'}`}
                    style={{ width: `${hardware.waterLevelPct}%` }}
                  />
                </div>
              </div>
              {/* Feeding and Hydration Telemetry Stats */}
              <div className="pt-1 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Utensils className="w-3.5 h-3.5 text-orange-500 mx-auto mb-0.5" />
                  <span className="text-[11px] text-slate-500 block">Portion</span>
                  <span className="text-xs font-bold text-slate-800">{activeSession.petSnapshot?.feedingPlan?.portionGrams || 100}g</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Droplets className="w-3.5 h-3.5 text-sky-500 mx-auto mb-0.5" />
                  <span className="text-[11px] text-slate-500 block">Target</span>
                  <span className="text-xs font-bold text-slate-800">{activeSession.petSnapshot?.hydrationTarget || 500}ml</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Activity className="w-3.5 h-3.5 text-rose-500 mx-auto mb-0.5" />
                  <span className="text-[11px] text-slate-500 block">Telemetry</span>
                  <span className="text-xs font-bold text-slate-800">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Notice if any pets are waiting */}
        {queuedSessions.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span>
                <strong>{queuedSessions.length} pet{queuedSessions.length > 1 ? 's' : ''}</strong> currently waiting in Admission Queue.
                Next in line: <strong>{queuedSessions[0].petName}</strong>
              </span>
            </div>
            <button
              onClick={onAssignClick}
              className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
            >
              + Queue Another
            </button>
          </div>
        )}

        {/* Demonstration Data Notice */}
        <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 font-medium flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Hardware readings are demonstration data. Health alerts require veterinary review.
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          <button
            onClick={onViewSession}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-200 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> View Active Session
          </button>
          <button
            onClick={() => onViewPet(activeSession.petId)}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-rose-200 cursor-pointer"
          >
            <Dog className="w-3.5 h-3.5" /> View Pet Details
          </button>
          <button
            onClick={onAssignClick}
            className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all border border-amber-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" /> + Add to Queue
          </button>
          <div className="flex-1" />
          <button
            onClick={onCancelSession}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-all border border-rose-200 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancel Session
          </button>
          <button
            onClick={onCompleteSession}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Complete Session
          </button>
        </div>
      </div>
    </div>
  );
};
