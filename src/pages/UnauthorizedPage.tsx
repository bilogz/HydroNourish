/**
 * HydroNourish — Unauthorized Page
 * Heritage Animal Clinic Capstone Project
 *
 * Displayed when an authenticated Supabase user attempts to access
 * the admin dashboard but does not have a valid admin profile,
 * or their account is inactive or suspended.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Home } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-rose-50 border-b border-rose-100 text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            Access Denied
          </p>
        </div>

        {/* Body */}
        <div className="p-8 text-center space-y-5">
          <div className="p-4 rounded-2xl bg-rose-50 w-fit mx-auto">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900">
              Unauthorized Access
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              This account is not authorized to access the administrator portal.
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>

          {user?.email && (
            <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 text-center">
              {user.email}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              id="unauthorized-signout-btn"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
