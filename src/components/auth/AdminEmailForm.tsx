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
import { checkOtpRateLimit } from '../../utils/rateLimiter';
import {
  useAdminLoginLockout,
  recordFailedAdminLogin,
  resetAdminLoginLockout,
} from '../../utils/loginLimiter';
import { EmailDiagnosticModal, DiagnosticData } from './EmailDiagnosticModal';

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

  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  // Subscribe to real-time 5-minute lockout state for this email
  const lockout = useAdminLoginLockout(email);

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

    // Check if this email is currently locked out (5 failed attempts -> 5 mins lock)
    if (lockout.isLocked) {
      setError(`Account temporarily locked due to 5 failed password attempts. Try again in ${lockout.formattedTime}.`);
      showToast(
        'error',
        'ADMIN ACCOUNT LOCKED',
        `Account locked for 5 minutes. Try again in ${lockout.formattedTime}.`
      );
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Anti-Spam Rate Limit Check
    const rateLimit = checkOtpRateLimit(trimmedEmail);
    if (!rateLimit.allowed) {
      setError(`Multiple request spam protection: Please wait ${rateLimit.waitSeconds} seconds before requesting a new 2FA code.`);
      showToast(
        'warning',
        'TOO MANY REQUESTS DETECTED',
        `Spam protection active. Please wait ${rateLimit.waitSeconds} seconds before requesting another code.`
      );
      return;
    }

    // Check password & track failed attempts
    let isPasswordValid = true;
    const matchedUser = (users || []).find((u) => u.email.toLowerCase() === trimmedEmail);

    if (matchedUser) {
      if (matchedUser.status === 'Inactive') {
        setError('This account has been deactivated by Super Admin.');
        return;
      }
      if (matchedUser.password && password !== matchedUser.password) {
        isPasswordValid = false;
      }
    } else if ((trimmedEmail === 'joecelgarcia1@gmail.com' || trimmedEmail === 'marcgermineganan03@gmail.com') && password !== 'Admin#123') {
      isPasswordValid = false;
    } else if (trimmedEmail === 'heritagelink45@gmail.com' && password !== 'admin-pass-2026') {
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      const lockResult = recordFailedAdminLogin(trimmedEmail);
      if (lockResult.isLocked) {
        setError(`Too many failed password attempts (5/5). Account locked for 5 minutes. Please try again in ${lockout.formattedTime || '5m 00s'}.`);
        showToast(
          'error',
          'ACCOUNT LOCKED FOR 5 MINUTES',
          'Entered incorrect password 5 times. Account has been locked for 5 minutes.'
        );
      } else {
        const remainingAttempts = 5 - lockResult.failedCount;
        setError(`Invalid password for Admin account. (${lockResult.failedCount}/5 failed attempts — ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} left before 5-min lockout).`);
      }
      return;
    }

    // Successful password match — reset failed attempts lockout counter
    resetAdminLoginLockout(trimmedEmail);

    setIsLoading(true);

    // Dispatch real email OTP via heritagelink45@gmail.com & Supabase Auth
    const emailResult = await sendLoginOtp(trimmedEmail);

    // Trigger Supabase OTP safely in background
    try {
      await requestOtp(trimmedEmail);
    } catch {
      // Ignore background Supabase auth notice
    }

    setIsLoading(false);

    if (emailResult.hasError) {
      setDiagnosticData({
        recipientEmail: trimmedEmail,
        supabaseStatus: emailResult.supabaseStatus !== undefined ? String(emailResult.supabaseStatus) : undefined,
        formSubmitStatus: emailResult.formSubmitStatus !== undefined ? String(emailResult.formSubmitStatus) : undefined,
        errorMessage: emailResult.errorMessage,
        generatedCode: emailResult.code,
      });
      setIsDiagnosticOpen(true);
    } else {
      showToast(
        'success',
        '2FA CODE DISPATCHED',
        `Sent 6-digit verification code to ${trimmedEmail}. Please check your email inbox.`
      );
    }

    // Advance to OTP step
    onSuccess(trimmedEmail, emailResult.code);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 w-fit mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">HydroNourish Administrator Login</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Enter your email and password. A 6-digit 2FA verification code titled{' '}
          <strong className="text-rose-700">Admin Login Verification Code - HydroNourish</strong> will be sent.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Lockout Notice Banner */}
        {lockout.isLocked && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-200 text-rose-900 text-xs font-semibold space-y-1.5 animate-pulse"
          >
            <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm uppercase">
              <Lock className="w-4 h-4 text-rose-600" />
              Admin Account Temporarily Locked
            </div>
            <p className="leading-relaxed text-slate-700 font-medium">
              You have exceeded 5 failed password attempts. For security reasons, authentication is paused for 5 minutes.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold shadow-sm mt-1">
              <span>Time Remaining:</span>
              <span className="font-mono text-sm tracking-wider">{lockout.formattedTime}</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !lockout.isLocked && (
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
              <Mail className="w-3.5 h-3.5 text-rose-600" />
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
            disabled={isLoading || lockout.isLocked}
            className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 disabled:bg-slate-50 transition-all"
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
              <Lock className="w-3.5 h-3.5 text-rose-600" />
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
              disabled={isLoading || lockout.isLocked}
              className="w-full px-4 py-3 pr-10 text-sm font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 disabled:bg-slate-50 transition-all"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={lockout.isLocked}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="send-otp-btn"
          type="submit"
          disabled={isLoading || lockout.isLocked}
          className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {lockout.isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              Locked ({lockout.formattedTime})
            </>
          ) : isLoading ? (
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

      {diagnosticData && (
        <EmailDiagnosticModal
          isOpen={isDiagnosticOpen}
          onClose={() => setIsDiagnosticOpen(false)}
          data={diagnosticData}
          onProceedWithCode={(code) => {
            setIsDiagnosticOpen(false);
            onSuccess(email.trim().toLowerCase(), code);
          }}
        />
      )}
    </div>
  );
};
