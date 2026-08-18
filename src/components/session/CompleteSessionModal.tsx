/**
 * HydroNourish — Complete Session Modal
 * Confirmation modal for ending an active monitoring session.
 */

import React, { useState } from 'react';
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
  const { showToast } = useAppContext();

  const [releaseDate, setReleaseDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [releaseCondition, setReleaseCondition] = useState('Healthy — cleared for discharge');
  const [finalNotes, setFinalNotes] = useState('');

  const adminName = adminProfile?.full_name ?? 'Administrator';

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
      },
      adminName
    );

    if (result.success) {
      showToast('success', 'Session Completed', 'Session completed successfully. The pet\'s records were archived, the owner\'s temporary access was deactivated, and the HydroNourish hardware is now available.');
      setReleaseDate(new Date().toISOString().slice(0, 16));
      setReleaseCondition('Healthy — cleared for discharge');
      setFinalNotes('');
      onSuccess?.();
    } else {
      showToast('error', 'Completion Failed', result.error || 'Unknown error.');
    }
  };

  if (!activeSession) return null;

  // Calculate session duration
  const start = new Date(activeSession.startTime).getTime();
  const now = Date.now();
  const diff = now - start;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const durationText = days > 0 ? `${days}d ${hours}h ${mins}m` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Monitoring Session" subtitle="End session and archive records" maxWidth="lg">
      <div className="space-y-5 text-xs">
        {/* Current Session Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <img src={activeSession.petAvatarUrl} alt={activeSession.petName} className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <p className="font-extrabold text-slate-900">{activeSession.petName}</p>
              <p className="text-slate-500">{activeSession.petSpecies} • {activeSession.petBreed}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">Owner:</span><span className="font-bold text-slate-800">{activeSession.ownerName}</span></div>
            <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">Start:</span><span className="font-bold text-slate-800">{new Date(activeSession.startTime).toLocaleString()}</span></div>
            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">Duration:</span><span className="font-extrabold text-indigo-700">{durationText}</span></div>
            <div className="flex items-center gap-2"><Utensils className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">Feedings:</span><span className="font-bold text-slate-800">{activeSession.feedingRecordCount} records</span></div>
            <div className="flex items-center gap-2"><Droplets className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">Hydration:</span><span className="font-bold text-slate-800">{activeSession.hydrationRecordCount} records</span></div>
            <div className="flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-500">Alerts:</span><span className="font-bold text-slate-800">{activeSession.alertCount} observations</span></div>
          </div>
        </div>

        {/* Required Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Actual Release Date & Time *</label>
            <input type="datetime-local" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Pet Release Condition *</label>
            <select value={releaseCondition} onChange={e => setReleaseCondition(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold">
              <option>Healthy — cleared for discharge</option>
              <option>Attention Needed — follow-up required in 7 days</option>
              <option>Attention Needed — medication prescribed</option>
              <option>Critical — owner advised of ongoing concerns</option>
              <option>Owner requested early discharge</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Final Notes / Remarks</label>
            <textarea value={finalNotes} onChange={e => setFinalNotes(e.target.value)} rows={3} className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold resize-none" placeholder="Summary observations, discharge instructions, follow-up notes..." />
          </div>
        </div>

        {/* What happens on completion */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
          <p className="font-bold text-amber-800 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Upon completion:</p>
          <ul className="space-y-1 text-amber-700 ml-5 list-disc">
            <li><strong>{activeSession.ownerName}</strong> will lose access to live monitoring.</li>
            <li>All monitoring records will be archived and remain accessible.</li>
            <li>The HydroNourish device will become available for another pet.</li>
            <li>This action does <strong>not</strong> permanently delete any historical records.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 text-xs">
            Cancel
          </button>
          <button onClick={handleConfirm} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md">
            <CheckCircle className="w-4 h-4" /> Complete Session
          </button>
        </div>
      </div>
    </Modal>
  );
};
