/**
 * HydroNourish — Auth Loading Screen
 * Heritage Animal Clinic Capstone Project
 *
 * Full-page loading screen displayed while the Supabase session
 * is being checked on initial application load.
 * Prevents a flash redirect to /admin/login for users with valid sessions.
 */

import React from 'react';
import { Logo } from '../Logo';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex flex-col items-center justify-center gap-6">
      {/* Logo */}
      <div className="opacity-90">
        <Logo size="lg" />
      </div>

      {/* Spinner */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-rose-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase animate-pulse">
          Verifying session…
        </p>
      </div>
    </div>
  );
};
