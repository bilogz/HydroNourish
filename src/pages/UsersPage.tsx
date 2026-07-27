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
  UserCheck,
  Edit,
  Power
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { users, addUser, toggleUserStatus, showToast } = useAppContext();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Veterinarian' as UserRole,
    department: 'General Veterinary Care',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUser({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      status: 'Active',
      avatarUrl: formData.avatarUrl
    });
    setAddModalOpen(false);
  };

  return (
    <DashboardLayout pageTitle="Heritage Animal Clinic Staff Management" breadcrumbs={[{ label: 'Users' }]}>
      {/* ================= SUMMARY METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Staff Accounts"
          value={users.length}
          subtitle="Heritage Animal Clinic Personnel"
          icon={Users}
          iconBgColor="bg-teal-50"
          iconTextColor="text-teal-600"
          badgeText="Active Access"
          badgeType="success"
        />
        <StatCard
          title="Veterinarians"
          value={users.filter(u => u.role === 'Veterinarian').length}
          subtitle="Clinical Medical Staff"
          icon={Stethoscope}
          iconBgColor="bg-emerald-50"
          iconTextColor="text-emerald-600"
          badgeText="Licensed"
          badgeType="success"
        />
        <StatCard
          title="Administrators"
          value={users.filter(u => u.role === 'Administrator').length}
          subtitle="System & IT Controls"
          icon={ShieldCheck}
          iconBgColor="bg-indigo-50"
          iconTextColor="text-indigo-600"
          badgeText="Superuser"
          badgeType="info"
        />
      </div>

      {/* ================= USERS TABLE ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Registered Staff Directory</h2>
          <button
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                role: 'Veterinarian',
                department: 'General Care',
                avatarUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&q=80&w=200'
              });
              setAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>

        <div className="clinic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{user.name}</span>
                          <span className="block text-[10px] text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        user.role === 'Administrator'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-1.5 rounded-lg border font-semibold ${
                            user.status === 'Active'
                              ? 'border-slate-200 text-rose-600 hover:bg-rose-50'
                              : 'border-slate-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= ADD USER MODAL ================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Heritage Clinic Staff Member"
        subtitle="User Access Provisioning Form"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
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
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              placeholder="a.grant@heritageanimalclinic.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none font-semibold"
              >
                <option value="Veterinarian">Veterinarian</option>
                <option value="Clinic Staff">Clinic Staff</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                placeholder="e.g. Small Animal Care"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
            >
              Create Staff Account
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
