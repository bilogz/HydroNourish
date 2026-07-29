import React, { useState } from 'react';
import { Modal } from '../Modal';
import { ClinicUser, UserRole } from '../../types';
import { Crown, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { CLINIC_DEPARTMENTS } from '../../services/clinicUserService';

const PRESET_AVATARS = [
  { label: 'Male Doctor', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200' },
  { label: 'Female Doctor', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200' },
  { label: 'Female Tech', url: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&q=80&w=200' },
  { label: 'Male Tech / IT', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { label: 'System Admin', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' }
];

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (userData: Omit<ClinicUser, 'id' | 'lastActive'>) => void;
  adminEmail: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    onAddUser({
      name: formData.fullName.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password || undefined,
      role: formData.role,
      department: formData.department.trim() || 'General Operations',
      status: 'Active',
      avatarUrl: formData.avatarUrl
    });

    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'Administrator',
      department: 'General Operations',
      avatarUrl: PRESET_AVATARS[0].url
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Clinic User Account"
      subtitle="Super Admin User Access Provisioning"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2.5">
          <Crown className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <span className="font-extrabold">Authorized Provisioning by Super Admin</span>
            <p className="text-[11px] text-purple-700 font-mono">{adminEmail}</p>
          </div>
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
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-medium text-xs"
            placeholder="e.g. Dr. Alan Grant"
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
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-mono text-xs"
            placeholder="staff.name@heritageanimalclinic.com"
          />
        </div>

        {/* Account Password Field */}
        <div>
          <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
            Account Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-mono text-xs"
              placeholder="Enter secure initial password"
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
            Super Admin can set or change passwords for accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Role & Privilege *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-bold text-slate-800 bg-white text-xs"
            >
              <option value="Administrator">Administrator</option>
              <option value="Veterinarian">Veterinarian</option>
              <option value="Clinic Staff">Clinic Staff</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Super Admin provisions Administrator, Veterinarian, or Staff roles.
            </p>
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-medium text-xs bg-white"
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
            Select Staff Avatar Preset
          </label>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {PRESET_AVATARS.map((avatar, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFormData({ ...formData, avatarUrl: avatar.url })}
                className={`p-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                  formData.avatarUrl === avatar.url
                    ? 'ring-2 ring-emerald-500 bg-emerald-50 scale-105'
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
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Provision Account
          </button>
        </div>
      </form>
    </Modal>
  );
};
