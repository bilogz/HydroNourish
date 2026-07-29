/**
 * HydroNourish — Admin Email & Password Form (OTP Step 1)
 * Heritage Animal Clinic Capstone Project
 *
 * Step 1 of the two-step admin login flow.
 * Collects administrator email & password, dispatches dynamic OTP via heritagelink45@gmail.com.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Send, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../hooks/useAppContext';
import { sendLoginOtp, SYSTEM_OTP_SENDER_EMAIL } from '../../services/emailService';

interface AdminEmailFormProps {
  onSuccess: (email: string, generatedCode?: string) => void;
}

export const AdminEmailForm: React.FC<AdminEmailFormProps> = ({ onSuccess }) => {
  const { requestOtp } = useAuth();
  const { users, showToast } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Check against provisioned user accounts in state
    const matchedUser = (users || []).find((u) => u.email.toLowerCase() === trimmedEmail);

    if (matchedUser) {
      if (matchedUser.status === 'Inactive') {
        setError('This account has been deactivated by Super Admin.');
        return;
      }
      if (matchedUser.password && password !== matchedUser.password) {
        setError('Invalid password for this user account.');
        return;
      }
    } else if (trimmedEmail === 'joecelgarcia1@gmail.com' && password !== 'Admin#123') {
      setError('Invalid password for Super Admin account.');
      return;
    } else if (trimmedEmail === 'heritagelink45@gmail.com' && password !== 'admin-pass-2026') {
      setError('Invalid password for Administrator account.');
      return;
    }

    setIsLoading(true);

    // Dispatch real email OTP via heritagelink45@gmail.com
    const emailResult = await sendLoginOtp(trimmedEmail);

    // Trigger Supabase OTP safely in background
    try {
      await requestOtp(trimmedEmail);
    } catch {
      // Ignore background Supabase auth notice
    }

    setIsLoading(false);

    showToast(
      'success',
      '2FA CODE DISPATCHED',
      `Sent 6-digit verification code [${emailResult.code}] from ${SYSTEM_OTP_SENDER_EMAIL} to ${trimmedEmail}.`
    );

    // Advance to OTP step with generated code
    onSuccess(trimmedEmail, emailResult.code);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 w-fit mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">HydroNourish Administrator Login</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Enter your email and password. A 6-digit 2FA verification code titled{' '}
          <strong className="text-teal-700">Admin Login Verification Code - HydroNourish</strong> will be sent.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold"
          >
            {error}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label
            htmlFor="admin-email"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              Email Address *
            </span>
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 disabled:bg-slate-50 transition-all"
            placeholder="admin@heritageanimalclinic.com"
          />
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="admin-password"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              Password *
            </span>
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-10 text-sm font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 disabled:bg-slate-50 transition-all"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="send-otp-btn"
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Dispatching 2FA Code…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send OTP Code
            </>
          )}
        </button>
      </form>

      {/* Back link */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};
