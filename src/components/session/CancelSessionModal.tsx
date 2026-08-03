/**
 * HydroNourish — Cancel Session Modal
 * Requires a cancellation reason and explicit confirmation.
 */

import React, { useState } from 'react';
import { Modal } from '../Modal';
import { useSession } from '../../contexts/SessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../hooks/useAppContext';
import { XCircle, AlertTriangle } from 'lucide-react';

interface CancelSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelSessionModal: React.FC<CancelSessionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { activeSession, cancelSession } = useSession();
  const { adminProfile } = useAuth();
  const { showToast } = useAppContext();

  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const adminName = adminProfile?.full_name ?? 'Administrator';

  const handleCancel = () => {
    if (!activeSession) return;
    if (!reason.trim()) {
      showToast('error', 'Validation Error', 'A cancellation reason is required.');
      return;
    }
    if (!confirmed) {
      showToast('error', 'Confirmation Required', 'Please check the confirmation checkbox.');
      return;
    }

    const result = cancelSession(reason, adminName);

    if (result.success) {
      showToast('warning', 'Session Cancelled', `${activeSession.petName}'s session has been cancelled. The hardware is now available.`);
      setReason('');
      setConfirmed(false);
      onSuccess();
    } else {
      showToast('error', 'Cancellation Failed', result.error || 'Unknown error.');
    }
  };

  if (!activeSession) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Monitoring Session" subtitle="This action cannot be undone" maxWidth="md">
      <div className="space-y-5 text-xs">
        {/* Warning Banner */}
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800 mb-1">You are about to cancel the active session for:</p>
            <p className="text-rose-700"><strong>{activeSession.petName}</strong> ({activeSession.petSpecies} • {activeSession.petBreed})</p>
            <p className="text-rose-700">Owner: <strong>{activeSession.ownerName}</strong></p>
          </div>
        </div>

        {/* Cancellation Reason */}
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Cancellation Reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold resize-none"
            placeholder="Explain why this session is being cancelled..."
          />
        </div>

        {/* What happens */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-amber-700">
          <p className="font-bold text-amber-800">Upon cancellation:</p>
          <ul className="space-y-1 ml-5 list-disc">
            <li>Session status will be changed to <strong>cancelled</strong>.</li>
            <li>{activeSession.ownerName}'s temporary access will be deactivated.</li>
            <li>The hardware will be released and made available.</li>
            <li>The cancelled session will remain in the activity history.</li>
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          <span className="text-slate-700 font-medium">
            I confirm that I want to cancel this monitoring session. I understand this will deactivate the owner's access and release the hardware.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex justify-between pt-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 text-xs">
            Go Back
          </button>
          <button
            onClick={handleCancel}
            disabled={!reason.trim() || !confirmed}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md ${
              reason.trim() && confirmed
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <XCircle className="w-4 h-4" /> Cancel Session
          </button>
        </div>
      </div>
    </Modal>
  );
};
