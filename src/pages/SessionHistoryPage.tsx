/**
 * HydroNourish — Session History Page (Full Interactive & Dynamic)
 * Heritage Animal Clinic Capstone Project
 *
 * Dedicated interface for clinical staff to view, start, complete, and review monitoring sessions.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useSession } from '../contexts/SessionContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { AssignPetOwnerModal } from '../components/session/AssignPetOwnerModal';
import { CompleteSessionModal } from '../components/session/CompleteSessionModal';
import { CancelSessionModal } from '../components/session/CancelSessionModal';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Utensils,
  Droplets,
  Activity,
  ShieldAlert,
  Plus,
  Check,
  X,
  Play,
  Dog,
  Sparkles,
  ExternalLink,
  Printer,
  FileText,
} from 'lucide-react';export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, activeSession, queuedSessions, hardware, admitNextFromQueue, admitSpecificFromQueue, removeFromQueue } = useSession();
  const { adminProfile } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'queued' | 'completed' | 'cancelled'>('all');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Session Action Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const adminName = adminProfile?.full_name || 'Clinic Administrator';

  const filteredSessions = useMemo(() => {
    return (sessions || []).filter((s) => {
      const matchesSearch =
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.petName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        s.deviceId.toLowerCase().includes(search.toLowerCase()) ||
        s.petSpecies.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, statusFilter]);

  const counts = useMemo(() => ({
    all: (sessions || []).length,
    active: (sessions || []).filter((s) => s.status === 'active').length,
    queued: (sessions || []).filter((s) => s.status === 'queued').length,
    completed: (sessions || []).filter((s) => s.status === 'completed').length,
    cancelled: (sessions || []).filter((s) => s.status === 'cancelled').length,
  }), [sessions]);

  const formatDuration = (start: string, end: string | null, status: string, queuePosition?: number) => {
    if (status === 'queued') {
      return `⏳ Queue #${queuePosition || 1}`;
    }
    if (!start) return 'Not Started';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffHrs = Math.max(0, (endTime - startTime) / (1000 * 60 * 60));
    if (diffHrs < 1) return Math.round(diffHrs * 60) + ' mins';
    if (diffHrs < 24) return diffHrs.toFixed(1) + ' hrs';
    return (diffHrs / 24).toFixed(1) + ' days';
  };

  const viewSession = (sessions || []).find((s) => s.id === selectedSession);

  return (
    <DashboardLayout pageTitle="Monitoring Sessions" breadcrumbs={[{ label: 'Sessions' }]}>
      <div className="space-y-6">
        {/* Banner with Direct Admit Button */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-rose-300" />
              <h2 className="text-xl font-black">Clinical Monitoring Sessions &amp; Queue</h2>
            </div>
            <p className="text-xs text-rose-100/80">
              Real-time patient tracking, telemetry logs, dietary sessions, and admission queueing · Heritage Animal Clinic
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {counts.active} Active
              </span>
              {counts.queued > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  {counts.queued} In Queue
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {counts.completed} Completed
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
                {counts.cancelled} Cancelled
              </span>
            </div>

            {queuedSessions.length > 0 && !activeSession && (
              <button
                onClick={() => admitNextFromQueue(adminName)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 animate-bounce"
                title="Admit first patient in queue into the available Smart Station"
              >
                <Check className="w-4 h-4 text-slate-950" />
                Admit Next: {queuedSessions[0].petName}
              </button>
            )}

            <button
              onClick={() => setAssignModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              {activeSession ? '+ Add to Queue' : '+ Start New Session'}
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by pet, owner, device, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:border-rose-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {(['all', 'active', 'queued', 'completed', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === f
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f === 'queued' ? '⏳ Queue' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Table */}
        <div className="clinic-card overflow-hidden bg-white border border-slate-200/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Session ID</th>
                  <th className="px-4 py-3.5">Patient Animal</th>
                  <th className="px-4 py-3.5">Pet Owner</th>
                  <th className="px-4 py-3.5">Hardware Node</th>
                  <th className="px-4 py-3.5">Admission / Start</th>
                  <th className="px-4 py-3.5">Duration / Queue</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Intake &amp; Telemetry</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-700">{session.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={session.petAvatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                          alt={session.petName}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-extrabold text-slate-900 block">{session.petName}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{session.petSpecies} • {session.petBreed}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 block">{session.ownerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{session.ownerEmail}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-600">{session.deviceId}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-600">
                      <div>{new Date(session.admissionDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(session.admissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900">
                      {formatDuration(session.startTime, session.releaseTime, session.status, session.queuePosition)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={session.status === 'queued' ? `Queue #${session.queuePosition || 1}` : (session.status.charAt(0).toUpperCase() + session.status.slice(1))} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {session.status === 'queued' ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Waiting for Station
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2.5 text-xs font-bold text-slate-600">
                          <span className="flex items-center gap-1 text-orange-600" title="Feeding Logs">
                            <Utensils className="w-3.5 h-3.5" />{session.feedingRecordCount}
                          </span>
                          <span className="flex items-center gap-1 text-sky-600" title="Hydration Logs">
                            <Droplets className="w-3.5 h-3.5" />{session.hydrationRecordCount}
                          </span>
                          <span className="flex items-center gap-1 text-amber-600" title="AI Alerts">
                            <ShieldAlert className="w-3.5 h-3.5" />{session.alertCount}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {session.status === 'queued' && (
                          <>
                            <button
                              onClick={() => admitSpecificFromQueue(session.id, adminName)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Admit this queued pet to the Smart Station"
                            >
                              <Play className="w-3 h-3" /> Admit
                            </button>
                            <button
                              onClick={() => removeFromQueue(session.id, adminName)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                              title="Remove from Queue"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setSelectedSession(session.id);
                            setDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>

                        {session.status === 'active' && (
                          <>
                            <button
                              onClick={() => setCompleteModalOpen(true)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Complete Session & Release Pet"
                            >
                              <Check className="w-3.5 h-3.5" /> Release
                            </button>
                            <button
                              onClick={() => setCancelModalOpen(true)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                              title="Cancel Session"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="max-w-sm mx-auto space-y-3">
                        <ClipboardList className="w-12 h-12 mx-auto text-slate-300" />
                        <p className="text-slate-800 font-bold text-sm">No monitoring sessions recorded yet</p>
                        <p className="text-slate-400 text-xs">
                          Start a new monitoring session to assign a pet to the HydroNourish station and begin live telemetry.
                        </p>
                        <button
                          onClick={() => setAssignModalOpen(true)}
                          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          + Start Monitoring Session Now
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: ASSIGN PET & START SESSION */}
      <AssignPetOwnerModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
      />

      {/* MODAL: COMPLETE SESSION */}
      <CompleteSessionModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
      />

      {/* MODAL: CANCEL SESSION */}
      <CancelSessionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
      />

      {/* MODAL: VIEW FULL SESSION DETAILS */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={viewSession ? 'Session ' + viewSession.id : 'Session Summary'}
        subtitle="Detailed Patient Telemetry & Discharge Records"
        maxWidth="lg"
      >
        {viewSession && (
          <div className="space-y-4 text-xs">
            {/* Session Status & Pet Info */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <img
                src={viewSession.petAvatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                alt={viewSession.petName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500/20 border border-slate-200 shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-black text-slate-900">{viewSession.petName}</h4>
                  <StatusBadge status={viewSession.status.charAt(0).toUpperCase() + viewSession.status.slice(1)} size="sm" />
                  {viewSession.releaseCondition && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      Condition: {viewSession.releaseCondition}
                    </span>
                  )}
                </div>
                <p className="text-slate-500">{viewSession.petSpecies} • {viewSession.petBreed}</p>
                <p className="text-slate-600 mt-0.5">Owner: <strong className="text-slate-800">{viewSession.ownerName}</strong> ({viewSession.ownerEmail})</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Session ID</span><span className="font-mono font-bold text-rose-800">{viewSession.id}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Device</span><span className="font-bold text-rose-700">{viewSession.deviceId}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Admission Date</span><span className="font-bold text-slate-800">{new Date(viewSession.admissionDate).toLocaleDateString()}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span><span className="font-black text-slate-900">{formatDuration(viewSession.startTime, viewSession.releaseTime)}</span></div>
            </div>

            {/* Pet Snapshot */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <p className="font-bold text-slate-800">Patient Snapshot at Admission</p>
              <div className="grid grid-cols-3 gap-2 text-slate-600">
                <div>Weight: <strong className="text-slate-900">{viewSession.petSnapshot?.weight || 8}kg</strong></div>
                <div>Age: <strong className="text-slate-900">{viewSession.petSnapshot?.age || 2} yrs</strong></div>
                <div>Diet Target: <strong className="text-slate-900">{viewSession.petSnapshot?.feedingPlan?.portionGrams || 100}g</strong></div>
              </div>
            </div>

            {/* Record Counts and Totals */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200">
                <Utensils className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                <p className="text-lg font-black text-slate-900">
                  {viewSession.totalFoodGrams || (viewSession.feedingRecordCount * 120)}g
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{viewSession.feedingRecordCount} Meals Served</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200">
                <Droplets className="w-4 h-4 mx-auto mb-1 text-sky-600" />
                <p className="text-lg font-black text-slate-900">
                  {viewSession.totalWaterMl || (viewSession.hydrationRecordCount * 250)}ml
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{viewSession.hydrationRecordCount} Hydrations</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <p className="text-lg font-black text-slate-900">{viewSession.alertCount}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Observations</p>
              </div>
            </div>

            {/* Discharge notes */}
            {viewSession.finalNotes && (
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-0.5 uppercase text-[10px]">Veterinary Discharge Notes:</span>
                <p className="text-emerald-950">{viewSession.finalNotes}</p>
                {viewSession.completedBy && (
                  <p className="text-[10px] text-emerald-800 mt-1 font-semibold">Signed by: {viewSession.completedBy}</p>
                )}
              </div>
            )}

            {viewSession.notes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-0.5 uppercase text-[10px]">Admission Notes:</span>
                <p className="text-slate-600">{viewSession.notes}</p>
              </div>
            )}

            {/* Action buttons inside detail modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  if (viewSession.petId) {
                    navigate(`/app/pets/${viewSession.petId}`);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Pet Health Profile &amp; History
              </button>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};
