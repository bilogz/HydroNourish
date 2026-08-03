import React from 'react';
import { Crown, Sparkles, UserPlus, ShieldCheck, Mail } from 'lucide-react';
import { AdminProfile } from '../../types/auth';
import { ClinicUser } from '../../types';

interface UserHeaderBannerProps {
  userEmail: string;
  adminProfile: AdminProfile | null;
  currentUserObj?: ClinicUser;
  onCreateClick: () => void;
}

export const UserHeaderBanner: React.FC<UserHeaderBannerProps> = ({
  userEmail,
  adminProfile,
  currentUserObj,
  onCreateClick
}) => {
  const name = adminProfile?.full_name || currentUserObj?.fullName || currentUserObj?.name || 'Joecel Garcia';
  const email = adminProfile?.email || userEmail || 'joecelgarcia1@gmail.com';
  const roleLabel = adminProfile?.role === 'super_admin' ? 'Super Admin' : (currentUserObj?.role || 'Super Admin');
  const department = currentUserObj?.department || 'Chief Executive & Master System Controller';
  const avatarUrl = adminProfile?.avatar_url || currentUserObj?.avatarUrl;

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl border border-indigo-900/50 relative overflow-hidden">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logged in User Profile Info */}
      <div className="flex items-center gap-4 relative z-10">
        {/* User Avatar */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400/60 shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md ring-2 ring-amber-400/60">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center" title="Active Logged In Session">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </span>
        </div>

        {/* Profile Details & Status Badges */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
              {name}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              {roleLabel}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Active Profile
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-indigo-200/90">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="font-mono font-bold text-slate-200">{email}</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="text-slate-300 text-[11px] font-medium truncate max-w-xs">
              {department}
            </span>
          </div>
        </div>
      </div>

      {/* Create User Button */}
      <button
        onClick={onCreateClick}
        className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer relative z-10 shrink-0 self-stretch sm:self-auto justify-center"
      >
        <UserPlus className="w-4 h-4" />
        + Create New User Account
      </button>
    </div>
  );
};
