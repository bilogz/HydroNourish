import React from 'react';
import { Crown, Sparkles, UserPlus } from 'lucide-react';

interface UserHeaderBannerProps {
  userEmail: string;
  onCreateClick: () => void;
}

export const UserHeaderBanner: React.FC<UserHeaderBannerProps> = ({
  userEmail,
  onCreateClick
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-indigo-900/40 relative overflow-hidden">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40 shadow-inner flex items-center justify-center">
          <Crown className="w-7 h-7 text-amber-400 animate-bounce-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
              Super Admin Management Portal
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              MASTER ACCESS ACTIVE
            </span>
          </div>
          <p className="text-xs text-purple-200/90 mt-1">
            Logged in as:{' '}
            <span className="font-mono font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-purple-500/30">
              {userEmail}
            </span>
          </p>
        </div>
      </div>

      <button
        onClick={onCreateClick}
        className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer relative z-10 shrink-0"
      >
        <UserPlus className="w-4 h-4" />
        + Create New User Account
      </button>
    </div>
  );
};
