import React, { useState, useMemo } from 'react';
import { StatusBadge } from '../StatusBadge';
import { ConfirmDialog } from '../ConfirmDialog';
import { EditUserModal } from './EditUserModal';
import { ClinicUser, UserRole } from '../../types';
import { Search, Filter, Crown, Power, UserX, Pencil } from 'lucide-react';

interface UserDirectoryTableProps {
  users: ClinicUser[];
  onToggleStatus: (user: ClinicUser) => void;
  onUpdateUser: (id: string, updated: Partial<ClinicUser>) => void;
  adminEmail: string;
}

export const UserDirectoryTable: React.FC<UserDirectoryTableProps> = ({
  users,
  onToggleStatus,
  onUpdateUser,
  adminEmail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedUserForToggle, setSelectedUserForToggle] = useState<ClinicUser | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ClinicUser | null>(null);

  // Dynamic search and role filter calculation
  const filteredUsers = useMemo(() => {
    return (users || []).filter((user) => {
      const nameMatch = (user.fullName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const deptMatch = (user.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || emailMatch || deptMatch;

      const matchesRole =
        selectedRoleFilter === 'All' ? true : user.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRoleFilter]);

  // Role Badge Styling Rules
  const getRoleBadgeStyle = (role: UserRole | string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-700 font-semibold px-3 py-1 rounded-full text-xs border border-purple-200/60 inline-flex items-center gap-1';
      case 'Administrator':
        return 'bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full text-xs border border-blue-200/60 inline-flex items-center gap-1';
      case 'Veterinarian':
        return 'bg-emerald-100 text-emerald-700 font-semibold px-3 py-1 rounded-full text-xs border border-emerald-200/60 inline-flex items-center gap-1';
      case 'Clinic Staff':
      default:
        return 'bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-full text-xs border border-slate-200/60 inline-flex items-center gap-1';
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            Registered User Accounts Directory
          </h2>
          <p className="text-xs font-medium text-slate-500">
            Only Super Admin can provision, edit details, change passwords, or deactivate accounts
          </p>
        </div>

        {/* Dynamic Search Bar */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or dept..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {['All', 'Super Admin', 'Administrator', 'Veterinarian', 'Clinic Staff'].map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRoleFilter(role)}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              selectedRoleFilter === role
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Table Component */}
      <div className="clinic-card overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 sm:px-5 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Role & Privilege</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Active</th>
                <th className="px-4 sm:px-5 py-3.5 text-right">Super Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <UserX className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-slate-600 font-bold text-sm">No matching user accounts found</p>
                      <p className="text-slate-400 text-xs">
                        Try clearing your search query or role filter.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedRoleFilter('All');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Reset Search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPrimarySuperAdmin =
                    user.isProtected ||
                    user.role === 'Super Admin' ||
                    user.email.toLowerCase().includes('joecelgarcia') ||
                    user.email.toLowerCase().includes('marcgermineganan');

                  const displayName = user.fullName || user.name;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/90 transition-colors">
                      {/* STAFF MEMBER */}
                      <td className="px-4 sm:px-5 py-3.5 font-medium">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl}
                            alt={displayName}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 flex items-center gap-1.5 truncate text-xs sm:text-sm">
                              {displayName}
                              {isPrimarySuperAdmin && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-label="Super Admin Master" />
                              )}
                            </span>
                            <span className="block text-[11px] text-slate-400 font-mono truncate">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* ROLE & PRIVILEGE */}
                      <td className="px-4 py-3.5">
                        <span className={getRoleBadgeStyle(user.role)}>
                          {user.role === 'Super Admin' && <Crown className="w-3 h-3 text-purple-600" />}
                          {user.role}
                        </span>
                      </td>

                      {/* DEPARTMENT */}
                      <td className="px-4 py-3.5 font-medium text-slate-600">{user.department}</td>

                      {/* STATUS */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={user.status} size="sm" />
                      </td>

                      {/* LAST ACTIVE */}
                      <td className="px-4 py-3.5 text-slate-500 font-medium">{user.lastActive}</td>

                      {/* SUPER ADMIN ACTION */}
                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Details & Password Button */}
                          <button
                            onClick={() => setSelectedUserForEdit(user)}
                            className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-600 hover:bg-indigo-100 font-bold transition-all shadow-2xs cursor-pointer"
                            title="Edit User Details & Password"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Protected or Deactivate Toggle Button */}
                          {isPrimarySuperAdmin ? (
                            <span className="text-[10px] text-purple-800 font-extrabold bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200 inline-flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-500" />
                              Protected Master Account
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedUserForToggle(user)}
                              className={`p-2 rounded-xl border font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                                user.status === 'Active'
                                  ? 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100'
                                  : 'border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                              title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Deactivation / Activation */}
      {selectedUserForToggle && (
        <ConfirmDialog
          isOpen={!!selectedUserForToggle}
          onClose={() => setSelectedUserForToggle(null)}
          onConfirm={() => {
            onToggleStatus(selectedUserForToggle);
            setSelectedUserForToggle(null);
          }}
          title={
            selectedUserForToggle.status === 'Active'
              ? `Deactivate ${selectedUserForToggle.fullName || selectedUserForToggle.name}?`
              : `Activate ${selectedUserForToggle.fullName || selectedUserForToggle.name}?`
          }
          message={
            selectedUserForToggle.status === 'Active'
              ? `Are you sure you want to deactivate account access for ${selectedUserForToggle.email}? They will no longer be able to log into the clinic portal.`
              : `Are you sure you want to restore active access for ${selectedUserForToggle.email}?`
          }
          confirmText={selectedUserForToggle.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
          cancelText="Cancel"
          variant={selectedUserForToggle.status === 'Active' ? 'danger' : 'info'}
        />
      )}

      {/* Edit User Account Details & Password Modal */}
      {selectedUserForEdit && (
        <EditUserModal
          isOpen={!!selectedUserForEdit}
          onClose={() => setSelectedUserForEdit(null)}
          user={selectedUserForEdit}
          onUpdateUser={onUpdateUser}
          adminEmail={adminEmail}
        />
      )}
    </div>
  );
};
