/**
 * HydroNourish — Pet Owner Registration Form
 * Heritage Animal Clinic Capstone Project
 *
 * Form for new pet owners / patients to register their account.
 */

import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, MapPin, UserPlus, LogIn } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useAppContext } from '../../hooks/useAppContext';

interface OwnerRegisterFormProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}

export const OwnerRegisterForm: React.FC<OwnerRegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { owners, addOwner } = useSession();
  const { showToast } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!trimmedPhone) {
      setError('Please enter your phone number.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    setIsLoading(true);

    // Check if email already registered
    const existing = (owners || []).find(
      (o) => o.email.trim().toLowerCase() === trimmedEmail
    );

    if (existing) {
      setIsLoading(false);
      setError('An account with this email address already exists. Please log in instead.');
      return;
    }

    // Register owner
    const newOwner = addOwner({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: address.trim(),
      password,
      petIds: [],
    });

    // Auto log in newly registered owner
    localStorage.setItem('hn_owner_email', trimmedEmail);

    setIsLoading(false);
    showToast(
      'success',
      'ACCOUNT REGISTERED',
      `Welcome to Heritage Animal Clinic, ${newOwner.name}! Account registered successfully.`
    );

    onSuccess(trimmedEmail);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900">Pet Owner Registration</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Create your owner account to connect with your pet's monitoring system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold"
          >
            {error}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label
            htmlFor="register-name"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Full Name *
            </span>
          </label>
          <input
            id="register-name"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all"
            placeholder="e.g. Maria Santos"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                Email Address *
              </span>
            </label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all"
              placeholder="owner@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="register-phone"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                Phone Number *
              </span>
            </label>
            <input
              id="register-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all"
              placeholder="+63 912 345 6789"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="register-address"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              Address / City (Optional)
            </span>
          </label>
          <input
            id="register-address"
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all"
            placeholder="Quezon City, Metro Manila"
          />
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                Password *
              </span>
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 pr-8 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="register-confirm"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                Confirm Password *
              </span>
            </label>
            <input
              id="register-confirm"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60 transition-all"
              placeholder="Re-enter password"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
        >
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Creating Account…' : 'Register Account'}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-3 border-t border-slate-100 text-center space-y-1">
        <p className="text-xs text-slate-500 font-medium">Already have an owner account?</p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Sign In to Pet Owner Portal
        </button>
      </div>
    </div>
  );
};
