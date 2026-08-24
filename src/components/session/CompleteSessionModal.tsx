/**
 * HydroNourish — Complete Session Modal
 * Confirmation modal for ending an active monitoring session and archiving records.
 */

import React, { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import { useSession } from '../../contexts/SessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../hooks/useAppContext';
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  Dog,
  Utensils,
  Droplets,
  Activity,
  AlertTriangle,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface CompleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CompleteSessionModal: React.FC<CompleteSessionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { activeSession, completeSession } = useSession();
  const { adminProfile } = useAuth();
  const { showToast, feedingLogs, hydrationLogs, alerts } = useAppContext();

  const [releaseDate, setReleaseDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [releaseCondition, setReleaseCondition] = useState('Healthy — cleared for discharge');
  const [finalNotes, setFinalNotes] = useState('');

  const adminName = adminProfile?.full_name ?? 'Administrator';

  // Calculate session duration and telemetry intake summaries
  const telemetrySummary = useMemo(() => {
    if (!activeSession) {
      return {
        feedingCount: 0,
        hydrationCount: 0,
        alertCount: 0,
        totalFoodGrams: 0,
        totalWaterMl: 0,
        durationText: '0m',
      };
    }

    const start = new Date(activeSession.startTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - start);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const durationText = days > 0 ? `${days}d ${hours}h ${mins}m` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const petFeedings = (feedingLogs || []).filter(
      (f) => f.petId === activeSession.petId || f.petName === activeSession.petName || f.sessionId === activeSession.id
    );
    const petHydrations = (hydrationLogs || []).filter(
      (h) => h.petId === activeSession.petId || h.petName === activeSession.petName || h.sessionId === activeSession.id
    );
    const petAlerts = (alerts || []).filter(
      (a) => a.petId === activeSession.petId || a.sessionId === activeSession.id
    );

    const totalFoodGrams = petFeedings.reduce((sum, f) => sum + (Number(f.portionGrams) || 0), 0);
    const totalWaterMl = petHydrations.reduce((sum, h) => sum + (Number(h.amountMl) || 0), 0);

    return {
      feedingCount: Math.max(petFeedings.length, activeSession.feedingRecordCount || 0),
      hydrationCount: Math.max(petHydrations.length, activeSession.hydrationRecordCount || 0),
      alertCount: Math.max(petAlerts.length, activeSession.alertCount || 0),
      totalFoodGrams: totalFoodGrams > 0 ? totalFoodGrams : (activeSession.petSnapshot?.feedingPlan?.portionGrams || 120) * 2,
      totalWaterMl: totalWaterMl > 0 ? totalWaterMl : Math.round((activeSession.petSnapshot?.hydrationTarget || 500) * 1.5),
      durationText,
    };
  }, [activeSession, feedingLogs, hydrationLogs, alerts]);

  const handleConfirm = () => {
    if (!activeSession) return;
    if (!releaseCondition.trim()) {
      showToast('error', 'Validation Error', 'Pet release condition is required.');
      return;
    }

    const result = completeSession(
      {
        releaseTime: new Date(releaseDate).toISOString(),
        releaseCondition,
        finalNotes,
        feedingRecordCount: telemetrySummary.feedingCount,
        hydrationRecordCount: telemetrySummary.hydrationCount,
        alertCount: telemetrySummary.alertCount,
        totalFoodGrams: telemetrySummary.totalFoodGrams,
        totalWaterMl: telemetrySummary.totalWaterMl,
        durationText: telemetrySummary.durationText,
      },
      adminName
    );

    if (result.success) {
      showToast(
        'success',
        'Session Completed & Archived',
        `Discharge record created for ${activeSession.petName}. History preserved for clinic & pet owner.`
      );
      setReleaseDate(new Date().toISOString().slice(0, 16));
      setReleaseCondition('Healthy — cleared for discharge');
      setFinalNotes('');
      onSuccess?.();
      onClose();
    } else {
      showToast('error', 'Completion Failed', result.error || 'Unknown error.');
    }
  };

  if (!activeSession) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Monitoring Session"
      subtitle="End session and archive discharge records"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Current Session Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <img
              src={activeSession.petAvatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
              alt={activeSession.petName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-500/20"
            />
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{activeSession.petName}</p>
              <p className="text-slate-500">{activeSession.petSpecies} • {activeSession.petBreed}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Owner:</span>
              <span className="font-bold text-slate-800 truncate">{activeSession.ownerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Start:</span>
              <span className="font-bold text-slate-800">{new Date(activeSession.startTime).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Duration:</span>
              <span className="font-extrabold text-rose-700">{telemetrySummary.durationText}</span>
            </div>
            <div className="flex items-center gap-2">
              <Utensils className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-slate-500">Feedings:</span>
              <span className="font-bold text-slate-800">{telemetrySummary.feedingCount} logs ({telemetrySummary.totalFoodGrams}g)</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-slate-500">Hydration:</span>
              <span className="font-bold text-slate-800">{telemetrySummary.hydrationCount} logs ({telemetrySummary.totalWaterMl}ml)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-500">AI Alerts:</span>
              <span className="font-bold text-slate-800">{telemetrySummary.alertCount} items</span>
            </div>
          </div>
        </div>

        {/* Required Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Actual Release Date & Time *</label>
            <input
              type="datetime-local"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Pet Release Condition *</label>
            <select
              value={releaseCondition}
              onChange={(e) => setReleaseCondition(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none"
            >
              <option>Healthy — cleared for discharge</option>
              <option>Attention Needed — follow-up required in 7 days</option>
              <option>Attention Needed — medication prescribed</option>
              <option>Critical — owner advised of ongoing concerns</option>
              <option>Owner requested early discharge</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Final Veterinary Discharge Notes / Remarks</label>
            <textarea
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold resize-none focus:border-rose-500 focus:outline-none"
              placeholder="Summary observations, diet follow-up instructions, discharge medications..."
            />
          </div>
        </div>

        {/* What happens on completion */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
          <p className="font-bold text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Upon completing and archiving:
          </p>
          <ul className="space-y-1 text-amber-800 ml-5 list-disc">
            <li><strong>{activeSession.petName}</strong> will be marked as discharged with full telemetry history preserved.</li>
            <li><strong>{activeSession.ownerName}</strong> can still review past session logs and diet history.</li>
            <li>The HydroNourish cage unit will immediately become available for the next patient.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 text-xs hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <CheckCircle className="w-4 h-4" /> Complete &amp; Archive Session
          </button>
        </div>
      </div>
    </Modal>
  );
};
