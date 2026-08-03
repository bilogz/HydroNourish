/**
 * HydroNourish — Session History Page
 * Admin page displaying all monitoring sessions with filters and actions.
 */

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useSession } from '../contexts/SessionContext';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Dog,
  Utensils,
  Droplets,
  Activity,
  ShieldAlert,
  Eye,
  Printer,
  Archive,
  ChevronDown,
  FileText,
} from 'lucide-react';

export const SessionHistoryPage: React.FC = () => {
  const { sessions } = useSession();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.petName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [sessions, statusFilter, searchQuery]);

  const viewSession = sessions.find(s => s.id === selectedSession);

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const activeCount = sessions.filter(s => s.status === 'active').length;
  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const cancelledCount = sessions.filter(s => s.status === 'cancelled').length;

  return (
    <DashboardLayout pageTitle="Session History" breadcrumbs={[{ label: 'Sessions' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-800 to-teal-900 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <ClipboardList className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Monitoring Session History</h2>
              <p className="text-xs text-violet-200">All pet monitoring sessions • Heritage Animal Clinic</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold">{activeCount} Active</span>
            <span className="px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold">{completedCount} Completed</span>
            <span className="px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 font-bold">{cancelledCount} Cancelled</span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by pet, owner, or session ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', 'active', 'completed', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Table */}
        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Session ID</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Pet</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Owner</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Start Date</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Release Date</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Records</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Completed By</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map(session => (
                  <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{session.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={session.petAvatarUrl} alt={session.petName} className="w-7 h-7 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-slate-900">{session.petName}</p>
                          <p className="text-slate-500">{session.petSpecies}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{session.ownerName}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(session.startTime).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{session.releaseTime ? new Date(session.releaseTime).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{formatDuration(session.startTime, session.releaseTime)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={session.status.charAt(0).toUpperCase() + session.status.slice(1)} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="flex items-center gap-1 text-slate-500" title="Feeding records"><Utensils className="w-3 h-3" />{session.feedingRecordCount}</span>
                        <span className="flex items-center gap-1 text-slate-500" title="Hydration records"><Droplets className="w-3 h-3" />{session.hydrationRecordCount}</span>
                        <span className="flex items-center gap-1 text-slate-500" title="Vital signs"><Activity className="w-3 h-3" />{session.vitalSignRecordCount}</span>
                        <span className="flex items-center gap-1 text-slate-500" title="Alerts"><ShieldAlert className="w-3 h-3" />{session.alertCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{session.completedBy || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => { setSelectedSession(session.id); setDetailModalOpen(true); }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">No sessions found matching your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Session ${viewSession?.id || ''}`}
        subtitle="Monitoring Session Summary"
        maxWidth="lg"
      >
        {viewSession && (
          <div className="space-y-4 text-xs">
            {/* Session Status & Pet Info */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <img src={viewSession.petAvatarUrl} alt={viewSession.petName} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-extrabold text-slate-900">{viewSession.petName}</h4>
                  <StatusBadge status={viewSession.status.charAt(0).toUpperCase() + viewSession.status.slice(1)} size="sm" />
                </div>
                <p className="text-slate-500">{viewSession.petSpecies} • {viewSession.petBreed}</p>
                <p className="text-slate-600 mt-0.5">Owner: <span className="font-bold">{viewSession.ownerName}</span> ({viewSession.ownerEmail})</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Session ID:</span> <span className="font-mono font-bold text-slate-800">{viewSession.id}</span></div>
              <div><span className="text-slate-500">Device:</span> <span className="font-bold text-slate-800">{viewSession.deviceId}</span></div>
              <div><span className="text-slate-500">Admission:</span> <span className="font-bold text-slate-800">{new Date(viewSession.admissionDate).toLocaleString()}</span></div>
              <div><span className="text-slate-500">Expected Release:</span> <span className="font-bold text-slate-800">{new Date(viewSession.expectedReleaseDate).toLocaleString()}</span></div>
              <div><span className="text-slate-500">Session Start:</span> <span className="font-bold text-slate-800">{new Date(viewSession.startTime).toLocaleString()}</span></div>
              <div><span className="text-slate-500">Actual Release:</span> <span className="font-bold text-slate-800">{viewSession.releaseTime ? new Date(viewSession.releaseTime).toLocaleString() : 'In progress'}</span></div>
              <div><span className="text-slate-500">Duration:</span> <span className="font-extrabold text-indigo-700">{formatDuration(viewSession.startTime, viewSession.releaseTime)}</span></div>
              <div><span className="text-slate-500">Completed By:</span> <span className="font-bold text-slate-800">{viewSession.completedBy || '—'}</span></div>
            </div>

            {/* Pet Snapshot */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-800 mb-2">Pet Snapshot at Admission</p>
              <div className="grid grid-cols-3 gap-2">
                <div><span className="text-slate-500">Weight:</span> <span className="font-bold">{viewSession.petSnapshot.weight}kg</span></div>
                <div><span className="text-slate-500">Age:</span> <span className="font-bold">{viewSession.petSnapshot.age}yr</span></div>
                <div><span className="text-slate-500">Health:</span> <StatusBadge status={viewSession.petSnapshot.healthStatus} size="sm" /></div>
                <div><span className="text-slate-500">Food:</span> <span className="font-bold">{viewSession.petSnapshot.feedingPlan.portionGrams}g × {viewSession.petSnapshot.feedingPlan.timesPerDay}/day</span></div>
                <div><span className="text-slate-500">Hydration:</span> <span className="font-bold">{viewSession.petSnapshot.hydrationTarget} ml/day</span></div>
              </div>
            </div>

            {/* Record Counts */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Utensils, label: 'Feeding', count: viewSession.feedingRecordCount, color: 'text-orange-500' },
                { icon: Droplets, label: 'Hydration', count: viewSession.hydrationRecordCount, color: 'text-sky-500' },
                { icon: Activity, label: 'Vitals', count: viewSession.vitalSignRecordCount, color: 'text-rose-500' },
                { icon: ShieldAlert, label: 'Alerts', count: viewSession.alertCount, color: 'text-amber-500' },
              ].map(r => (
                <div key={r.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <r.icon className={`w-4 h-4 mx-auto mb-1 ${r.color}`} />
                  <p className="text-lg font-extrabold text-slate-900">{r.count}</p>
                  <p className="text-slate-500">{r.label}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            {viewSession.notes && (
              <div><span className="text-slate-500 font-bold">Admission Notes:</span> <span className="text-slate-700">{viewSession.notes}</span></div>
            )}
            {viewSession.releaseCondition && (
              <div><span className="text-slate-500 font-bold">Release Condition:</span> <span className="text-slate-700">{viewSession.releaseCondition}</span></div>
            )}
            {viewSession.finalNotes && (
              <div><span className="text-slate-500 font-bold">Final Notes:</span> <span className="text-slate-700">{viewSession.finalNotes}</span></div>
            )}
            {viewSession.cancelledReason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-700 font-bold">Cancellation Reason:</span> <span className="text-rose-600">{viewSession.cancelledReason}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};
