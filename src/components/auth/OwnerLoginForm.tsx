/**
 * HydroNourish — Pet Owner Login Form
 * Heritage Animal Clinic Capstone Project
 *
 * Allows registered pet owners / patients to log in to access their live pet monitoring portal.
 */

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useAppContext } from '../../hooks/useAppContext';

import { fetchOwnersFromSupabase } from '../../services/supabase';

interface OwnerLoginFormProps {
  onSuccess: (email: string) => void;
  onSwitchToRegister: () => void;
}

export const OwnerLoginForm: React.FC<OwnerLoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const { owners, updateOwner } = useSession();
  const { showToast } = useAppContext();

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

    setIsLoading(true);

    // 1. Check local session owners
    let matchedOwner = (owners || []).find(
      (o) => o.email.trim().toLowerCase() === trimmedEmail
    );

    // 2. Fallback check against live Supabase PostgreSQL database
    if (!matchedOwner) {
      try {
        const dbOwners = await fetchOwnersFromSupabase();
        if (dbOwners) {
          matchedOwner = dbOwners.find(
            (o) => o.email.trim().toLowerCase() === trimmedEmail
          );
        }
      } catch {
        // Ignore network fallback error
      }
    }

    if (!matchedOwner) {
      setIsLoading(false);
      setError('No pet owner account found with this email address. Please register first.');
      return;
    }

    // Check account status
    if (matchedOwner.accessStatus === 'archived') {
      setIsLoading(false);
      setError('This owner account has been archived. Please contact Heritage Animal Clinic.');
      return;
    }

    // Check password if set
    if (matchedOwner.password && matchedOwner.password !== password) {
      setIsLoading(false);
      setError('Incorrect password. Please check your password and try again.');
      return;
    }

    // If owner exists without a password yet, save this password for them in Supabase & state
    if (!matchedOwner.password) {
      updateOwner(matchedOwner.id, { password });
    }

    // Update last login timestamp in Supabase & state
    updateOwner(matchedOwner.id, { lastLogin: new Date().toISOString() });

    // Store in localStorage for session persistence
    localStorage.setItem('hn_owner_email', trimmedEmail);

    setIsLoading(false);
    showToast(
      'success',
      'WELCOME TO OWNER PORTAL',
      `Logged in successfully as ${matchedOwner.name || trimmedEmail}.`
    );

    onSuccess(trimmedEmail);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-extrabold text-slate-900">Pet Owner Portal</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Sign in to view your pet's real-time nutrition, hydration telemetry, and clinical updates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold"
          >
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label
            htmlFor="owner-email"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-600" />
              Email Address *
            </span>
          </label>
          <input
            id="owner-email"
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
            className="w-full px-4 py-3 text-sm font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
            placeholder="owner@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="owner-password"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              Password *
            </span>
          </label>
          <div className="relative">
            <input
              id="owner-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-10 text-sm font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
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

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          {isLoading ? 'Signing In…' : 'Access Owner Dashboard'}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-4 border-t border-slate-100 text-center space-y-2">
        <p className="text-xs text-slate-500 font-medium">Don't have a pet owner account yet?</p>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Register New Pet Owner Account
        </button>
      </div>
    </div>
  );
};
