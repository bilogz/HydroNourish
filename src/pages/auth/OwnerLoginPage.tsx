/**
 * HydroNourish — Pet Owner Login & Authentication Page
 * Heritage Animal Clinic Capstone Project
 *
 * Page for pet owners / patients to log in or register.
 * Route: /owner/login
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { OwnerLoginForm } from '../../components/auth/OwnerLoginForm';
import { OwnerRegisterForm } from '../../components/auth/OwnerRegisterForm';
import { ToastContainer } from '../../components/ToastContainer';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

interface OwnerLoginPageProps {
  defaultTab?: 'login' | 'register';
}

export const OwnerLoginPage: React.FC<OwnerLoginPageProps> = ({ defaultTab = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Redirect if already logged in as Owner
  const isOwnerLoggedIn = !!localStorage.getItem('hn_owner_email');
  if (isOwnerLoggedIn) {
    return <Navigate to="/owner" replace />;
  }

  // Check state or default tab
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    (location.state as { tab?: 'login' | 'register' } | null)?.tab || defaultTab
  );

  const handleSuccess = () => {
    navigate('/owner', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-50 to-rose-50/50 border-b border-slate-100 text-center space-y-2">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-rose-800 uppercase tracking-widest">
                Pet Owner Portal
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Heritage Animal Clinic · Health & Nutrition Telemetry
              </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-rose-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-rose-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8">
            {activeTab === 'login' ? (
              <OwnerLoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setActiveTab('register')}
              />
            ) : (
              <OwnerRegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setActiveTab('login')}
              />
            )}
          </div>
        </div>

        {/* Back Link & Security Notice */}
        <div className="mt-4 text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
          <p className="text-[10px] text-slate-500 font-medium">
            Protected by Heritage Animal Clinic HydroNourish Portal © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};
