import React, { useState, useMemo } from 'react';
import { PetOwner } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { useSession } from '../../contexts/SessionContext';
import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Archive,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Dog,
  Clock,
} from 'lucide-react';

export const PetOwnerDirectoryTable: React.FC = () => {
  const {
    owners,
    activeSession,
    deactivateOwner,
    reactivateOwner,
    archiveOwner,
    deleteOwnerPermanent,
  } = useSession();
  const { showToast } = useAppContext();
  const { adminProfile } = useAuth();

  const adminName = adminProfile?.full_name ?? 'Administrator';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [deleteTarget, setDeleteTarget] = useState<PetOwner | null>(null);

  const filteredOwners = useMemo(() => {
    let list = [...owners];
    if (statusFilter !== 'all') {
      list = list.filter((o) => o.accessStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [owners, statusFilter, searchQuery]);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const res = deleteOwnerPermanent(deleteTarget.id, adminName);
    if (res.success) {
      showToast('success', 'Owner Deleted', `${deleteTarget.name} has been permanently deleted.`);
    } else {
      showToast('error', 'Deletion Blocked', res.error || 'Failed to delete owner.');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="clinic-card overflow-hidden space-y-4 p-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Pet Owner Access Directory</h3>
          <p className="text-xs text-slate-500">Temporary pet-monitoring access & account records</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by owner name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['all', 'active', 'inactive', 'archived'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f
                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Owner ID</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Name & Contact</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Access Status</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Current Monitoring Session</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Date Created</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Last Login</th>
              <th className="text-center px-4 py-3 font-bold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOwners.map((owner) => {
              const isCurrentSessionOwner = activeSession && activeSession.ownerId === owner.id;
              return (
                <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{owner.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{owner.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{owner.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{owner.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={owner.accessStatus.charAt(0).toUpperCase() + owner.accessStatus.slice(1)} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {isCurrentSessionOwner ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
                        <Dog className="w-3.5 h-3.5 text-indigo-500" />
                        Active ({activeSession.petName})
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No active session</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {new Date(owner.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {owner.lastLogin ? new Date(owner.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {owner.accessStatus === 'active' && (
                        <button
                          onClick={() => {
                            deactivateOwner(owner.id, adminName);
                            showToast('warning', 'Access Deactivated', `${owner.name}'s monitoring access was deactivated.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold transition-all text-[11px] flex items-center gap-1"
                          title="Deactivate Access"
                        >
                          <UserX className="w-3 h-3" /> Deactivate
                        </button>
                      )}
                      {owner.accessStatus === 'inactive' && (
                        <button
                          onClick={() => {
                            reactivateOwner(owner.id, adminName);
                            showToast('success', 'Access Granted', `${owner.name}'s monitoring access was updated.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-semibold transition-all text-[11px] flex items-center gap-1"
                          title="Set Inactive/Ready"
                        >
                          <UserCheck className="w-3 h-3" /> Reset Status
                        </button>
                      )}
                      {owner.accessStatus !== 'archived' && (
                        <button
                          onClick={() => {
                            archiveOwner(owner.id, adminName);
                            showToast('info', 'Account Archived', `${owner.name}'s record has been archived.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-semibold transition-all text-[11px] flex items-center gap-1"
                          title="Archive Account"
                        >
                          <Archive className="w-3 h-3" /> Archive
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(owner)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-semibold transition-all text-[11px] flex items-center gap-1"
                        title="Delete Permanent"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredOwners.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No pet owners found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Pet Owner Account"
        message={`Are you sure you want to permanently delete ${deleteTarget?.name}? All session history linked to this owner will remain in archives, but the owner account will be permanently removed.`}
        confirmText="Permanent Delete"
        variant="danger"
      />
    </div>
  );
};
