import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { ClinicUser, UserRole } from '../../types';
import { Crown, CheckCircle2, Eye, EyeOff, Lock, UserCheck } from 'lucide-react';
import { CLINIC_DEPARTMENTS } from '../../services/clinicUserService';

const PRESET_AVATARS = [
  { label: 'Male Doctor', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200' },
  { label: 'Female Doctor', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200' },
  { label: 'Female Tech', url: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&q=80&w=200' },
  { label: 'Male Tech / IT', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { label: 'System Admin', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' }
];

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ClinicUser | null;
  onUpdateUser: (id: string, updated: Partial<ClinicUser>) => void;
  adminEmail: string;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  adminEmail
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Administrator' as UserRole,
    department: 'General Operations',
    avatarUrl: PRESET_AVATARS[0].url
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        password: user.password || '',
        role: user.role || 'Administrator',
        department: user.department || '',
        avatarUrl: user.avatarUrl || PRESET_AVATARS[0].url
      });
    }
  }, [user]);

  if (!user) return null;

  const isProtectedUser = user.isProtected || user.email === 'joecelgarcia1@gmail.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    onUpdateUser(user.id, {
      name: formData.fullName.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password || undefined,
      role: isProtectedUser ? 'Super Admin' : formData.role,
      department: formData.department.trim() || 'General Operations',
      avatarUrl: formData.avatarUrl
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Clinic User Account"
      subtitle={`Super Admin Management — Editing ${user.fullName || user.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-extrabold">Modifying User ID: {user.id}</span>
              <p className="text-[11px] text-indigo-700 font-mono">By Super Admin {adminEmail}</p>
            </div>
          </div>
          {isProtectedUser && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-extrabold flex items-center gap-1 border border-purple-300">
              <Crown className="w-3 h-3 text-amber-500" />
              Super Admin Role Locked
            </span>
          )}
        </div>

        <div>
          <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-medium text-xs"
            placeholder="Full Name"
          />
        </div>

        <div>
          <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono text-xs"
            placeholder="Email Address"
          />
        </div>

        {/* Change / Reset Password Field */}
        <div>
          <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
            Change / Reset Account Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono text-xs"
              placeholder="Enter new password to update"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            Updating this field resets the login credential for this staff account.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Role & Privilege *
            </label>
            <select
              value={formData.role}
              disabled={isProtectedUser}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className={`w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-bold text-slate-800 text-xs ${
                isProtectedUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
              }`}
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Administrator">Administrator</option>
              <option value="Veterinarian">Veterinarian</option>
              <option value="Clinic Staff">Clinic Staff</option>
            </select>
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-medium text-xs bg-white"
            >
              {CLINIC_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Avatar Preset Selector */}
        <div>
          <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
            Staff Avatar Preset
          </label>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {PRESET_AVATARS.map((avatar, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFormData({ ...formData, avatarUrl: avatar.url })}
                className={`p-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                  formData.avatarUrl === avatar.url
                    ? 'ring-2 ring-indigo-600 bg-indigo-50 scale-105'
                    : 'hover:bg-slate-100 opacity-75'
                }`}
              >
                <img
                  src={avatar.url}
                  alt={avatar.label}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
