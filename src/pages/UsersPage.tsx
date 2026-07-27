import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAppContext } from '../hooks/useAppContext';
import { ClinicUser, UserRole } from '../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Power,
  Lock,
  Crown,
  Key,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { users, addUser, toggleUserStatus, currentUser, showToast } = useAppContext();

  // Access Control: Only Super Admin (joecelgarcia1@gmail.com or role 'Super Admin') can manage & create user accounts
  const isSuperAdmin =
    currentUser?.role === 'Super Admin' ||
    currentUser?.email.toLowerCase() === 'joecelgarcia1@gmail.com';

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Veterinarian' as UserRole,
    department: 'General Veterinary Care',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('error', 'Permission Denied', 'Only Super Admin can create user accounts.');
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      showToast('warning', 'Incomplete Form', 'Please enter Full Name, Email, and Password.');
      return;
    }

    addUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      department: formData.department,
      status: 'Active',
      avatarUrl: formData.avatarUrl
    });

    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Veterinarian',
      department: 'General Veterinary Care',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    });

    setAddModalOpen(false);
    showToast('success', 'User Account Created', `New account for ${formData.name} (${formData.role}) has been created with secure password.`);
  };

  return (
    <DashboardLayout pageTitle="Heritage Animal Clinic User Management" breadcrumbs={[{ label: 'Users' }]}>
      {/* ================= SUPER ADMIN RESTRICTION LOCK BANNER ================= */}
      {!isSuperAdmin ? (
        <div className="clinic-card p-12 text-center space-y-5 max-w-2xl mx-auto my-8 border-2 border-dashed border-amber-200 bg-amber-50/40">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">Super Admin Access Required</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              User account management and creation are strictly restricted to the Super Admin (
              <strong className="text-purple-700 font-mono">joecelgarcia1@gmail.com</strong>).
              Standard staff accounts cannot view or modify clinic user permissions.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-100 text-purple-900 text-xs font-extrabold">
              <Crown className="w-4 h-4 text-purple-600" />
              Logged in as: {currentUser?.email || 'Standard User'} ({currentUser?.role || 'Staff'})
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Super Admin Status Header Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30">
                <Crown className="w-6 h-6 text-amber-400 animate-bounce-subtle" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  Super Admin Management Portal
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-400/30">
                    Master Access Active
                  </span>
                </h3>
                <p className="text-xs text-purple-200/80">
                  Authorized as Super Admin: <span className="font-mono font-bold text-white">joecelgarcia1@gmail.com</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  role: 'Veterinarian',
                  department: 'General Veterinary Care',
                  avatarUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&q=80&w=200'
                });
                setAddModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Create New User Account
            </button>
          </div>

          {/* ================= SUMMARY METRICS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              title="Total Staff Accounts"
              value={(users || []).length}
              subtitle="Heritage Animal Clinic Personnel"
              icon={Users}
              iconBgColor="bg-teal-50"
              iconTextColor="text-teal-600"
              badgeText="Active Access"
              badgeType="success"
            />
            <StatCard
              title="Veterinarians"
              value={(users || []).filter(u => u.role === 'Veterinarian').length}
              subtitle="Clinical Medical Staff"
              icon={Stethoscope}
              iconBgColor="bg-emerald-50"
              iconTextColor="text-emerald-600"
              badgeText="Licensed"
              badgeType="success"
            />
            <StatCard
              title="Super Admin Accounts"
              value={(users || []).filter(u => u.role === 'Super Admin').length}
              subtitle="Master System Controllers"
              icon={ShieldCheck}
              iconBgColor="bg-purple-50"
              iconTextColor="text-purple-600"
              badgeText="Master Privilege"
              badgeType="info"
            />
          </div>

          {/* ================= USERS TABLE ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">Registered User Accounts Directory</h2>
              <span className="text-xs font-semibold text-slate-500">
                Only Super Admin can provision or deactivate accounts
              </span>
            </div>

            <div className="clinic-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3">Role & Privilege</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3 text-right">Super Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map(user => {
                      const isUserSuperAdmin = user.role === 'Super Admin' || user.email === 'joecelgarcia1@gmail.com';
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {user.name}
                                  {isUserSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-500" title="Super Admin" />}
                                </span>
                                <span className="block text-[10px] text-slate-400 font-mono">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                              isUserSuperAdmin
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : user.role === 'Administrator'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : user.role === 'Veterinarian'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-600">{user.department}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={user.status} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-slate-500">{user.lastActive}</td>
                          <td className="px-4 py-3 text-right">
                            {!isUserSuperAdmin ? (
                              <button
                                onClick={() => toggleUserStatus(user.id)}
                                className={`p-1.5 rounded-lg border font-semibold ${
                                  user.status === 'Active'
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-purple-700 font-extrabold bg-purple-50 px-2 py-1 rounded">
                                Protected Master Account
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= SUPER ADMIN ONLY: CREATE USER ACCOUNT MODAL ================= */}
      <Modal
        isOpen={addModalOpen && isSuperAdmin}
        onClose={() => setAddModalOpen(false)}
        title="Create New Clinic User Account"
        subtitle="Super Admin User Access Provisioning"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Authorized Provisioning by Super Admin <strong>joecelgarcia1@gmail.com</strong></span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              placeholder="e.g. Dr. Alan Grant"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-mono"
              placeholder="staff.name@heritageanimalclinic.com"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Account Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-mono"
              placeholder="••••••••"
            />
            <p className="text-[10px] text-slate-400 mt-1">Set the initial password for this newly provisioned staff account (min 6 characters).</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Role & Privilege *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-bold"
              >
                <option value="Veterinarian">Veterinarian</option>
                <option value="Clinic Staff">Clinic Staff</option>
                <option value="Administrator">Administrator</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                placeholder="e.g. Surgical & Clinical Care"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Provision Account
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
