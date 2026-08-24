/**
 * HydroNourish — Admin Login Page
 * Heritage Animal Clinic Capstone Project
 *
 * Two-step login flow:
 *   Step 1 (AdminEmailForm): Enter email & password → dispatch OTP via heritagelink45@gmail.com
 *   Step 2 (AdminOtpForm): Enter 6-digit OTP → verify → load admin profile → redirect to /app
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { AdminEmailForm } from '../../components/auth/AdminEmailForm';
import { AdminOtpForm } from '../../components/auth/AdminOtpForm';
import { AuthLoadingScreen } from '../../components/auth/AuthLoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer } from '../../components/ToastContainer';

type LoginStep = 'email' | 'otp';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAdmin } = useAuth();

  const [step, setStep] = useState<LoginStep>('email');
  const [adminEmail, setAdminEmail] = useState('');
  const [expectedCode, setExpectedCode] = useState<string | undefined>(undefined);

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/app';

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Prevent logged-in pet owners from accessing Admin Login
  const isOwnerLoggedIn = !!localStorage.getItem('hn_owner_email');
  if (isOwnerLoggedIn) {
    return <Navigate to="/owner" replace />;
  }

  if (isAdmin) {
    return <Navigate to={from} replace />;
  }

  const handleEmailSuccess = (email: string, code?: string) => {
    setAdminEmail(email);
    setExpectedCode(code);
    setStep('otp');
  };

  const handleOtpSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleChangeEmail = () => {
    setAdminEmail('');
    setExpectedCode(undefined);
    setStep('email');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-r from-slate-50 to-rose-50/50 border-b border-slate-100 text-center space-y-2">
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-rose-800 uppercase tracking-widest">
                Administrator Portal
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Heritage Animal Clinic · Secure 2FA Access
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-8">
            {step === 'email' ? (
              <AdminEmailForm onSuccess={handleEmailSuccess} />
            ) : (
              <AdminOtpForm
                email={adminEmail}
                expectedCode={expectedCode}
                onSuccess={handleOtpSuccess}
                onChangeEmail={handleChangeEmail}
              />
            )}
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-[10px] text-slate-500 font-medium">
          Protected by Heritage Animal Clinic 2FA Security © {new Date().getFullYear()}
        </p>
      </div>

      <ToastContainer />
    </div>
  );
};
