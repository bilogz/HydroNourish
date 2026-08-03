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
  const { activeSession, hardware, canAssignPet } = useSession();
  const [elapsed, setElapsed] = useState('');

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

  const isOnline = hardware.status === 'Online';

  // ─── Empty state: no active session ──────────────────────────────────

  if (!activeSession) {
    return (
      <div className="clinic-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-teal-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                <Cpu className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Current Hardware Assignment</h3>
                <p className="text-[11px] text-slate-300">{hardware.deviceName} • {hardware.id}</p>
              </div>
            </div>
            <StatusBadge status={hardware.hardwareStatus.charAt(0).toUpperCase() + hardware.hardwareStatus.slice(1)} size="sm" />
          </div>
        </div>

        {/* Empty State Body */}
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-1">The HydroNourish hardware is currently available.</h4>
          <p className="text-xs text-slate-500 mb-5 max-w-md mx-auto">
            No pet is currently assigned to the monitoring device. Assign a pet and owner to begin a monitoring session.
          </p>

          {canAssignPet() ? (
            <button
              onClick={onAssignClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Assign Pet and Owner
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Hardware is {hardware.hardwareStatus}. Assignment unavailable.
            </div>
          )}

          {/* Device quick info */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs max-w-sm mx-auto">
            <div className="text-center">
              <span className="text-slate-500 block">Connection</span>
              <span className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">Food Level</span>
              <span className="font-bold text-slate-800">{hardware.foodLevelPct}%</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">Water Level</span>
              <span className="font-bold text-slate-800">{hardware.waterLevelPct}%</span>
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
              <Cpu className="w-5 h-5 text-teal-300" />
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
                <Calendar className="w-3.5 h-3.5 text-teal-500" />
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
              {/* Latest Vitals */}
              <div className="pt-1 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500 mx-auto mb-0.5" />
                  <span className="text-[11px] text-slate-500 block">Temp</span>
                  <span className="text-xs font-bold text-slate-800">{activeSession.petSnapshot.weight > 10 ? '38.5' : '39.0'}°C</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Heart className="w-3.5 h-3.5 text-pink-500 mx-auto mb-0.5" />
                  <span className="text-[11px] text-slate-500 block">Heart</span>
                  <span className="text-xs font-bold text-slate-800">{activeSession.petSnapshot.weight > 10 ? '85' : '130'} bpm</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <Activity className="w-3.5 h-3.5 text-teal-500 mx-auto mb-0.5" />
                  <span className="text-[11px] text-slate-500 block">Activity</span>
                  <span className="text-xs font-bold text-slate-800">Normal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demonstration Data Notice */}
        <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 font-medium flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Hardware readings are demonstration data. Health alerts require veterinary review.
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          <button
            onClick={onViewSession}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-200"
          >
            <Eye className="w-3.5 h-3.5" /> View Active Session
          </button>
          <button
            onClick={() => onViewPet(activeSession.petId)}
            className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-teal-200"
          >
            <Dog className="w-3.5 h-3.5" /> View Pet Details
          </button>
          <div className="flex-1" />
          <button
            onClick={onCancelSession}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-all border border-rose-200"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancel Session
          </button>
          <button
            onClick={onCompleteSession}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Complete Session
          </button>
        </div>
      </div>
    </div>
  );
};
