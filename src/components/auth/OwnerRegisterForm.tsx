/**
 * HydroNourish — Pet Owner Registration Form & Email Verification
 * Heritage Animal Clinic Capstone Project
 *
 * Form for new pet owners / patients to register their account and initial pet details,
 * triggering email verification dispatch from heritagelink45@gmail.com.
 */

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  UserPlus,
  LogIn,
  Dog,
  Cat,
  CheckCircle2,
  Send,
  Copy,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useAppContext } from '../../hooks/useAppContext';
import { SYSTEM_OTP_SENDER_EMAIL, sendVerificationEmail } from '../../services/emailService';

interface OwnerRegisterFormProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}

export const OwnerRegisterForm: React.FC<OwnerRegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { owners, addOwner, updateOwner } = useSession();
  const { addPet, showToast } = useAppContext();

  // Owner Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Pet Details Fields
  const [hasPet, setHasPet] = useState(true);
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState<'Dog' | 'Cat' | 'Other'>('Dog');
  const [petBreed, setPetBreed] = useState('');
  const [petAge, setPetAge] = useState<number | string>(2);
  const [petWeight, setPetWeight] = useState<number | string>(8);
  const [petNotes, setPetNotes] = useState('');
  const [petAvatarUrl, setPetAvatarUrl] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    if (hasPet && !petName.trim()) {
      setError('Please enter your pet\'s name.');
      return;
    }

    setIsLoading(true);

    // Check if owner already exists
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

    // If pet details were provided, add the pet
    if (hasPet && petName.trim()) {
      const createdPet = await addPet({
        name: petName.trim(),
        species: petSpecies,
        breed: petBreed.trim() || (petSpecies === 'Cat' ? 'Domestic Shorthair' : 'Mixed Breed'),
        age: Number(petAge) || 1,
        weight: Number(petWeight) || 5,
        sex: 'Male',
        ownerName: trimmedName,
        ownerPhone: trimmedPhone,
        ownerEmail: trimmedEmail,
        ownerId: newOwner.id,
        clinicRef: 'REF-2026-' + Math.floor(100 + Math.random() * 800),
        assignedDeviceId: 'Cage 1',
        healthStatus: 'Healthy',
        avatarUrl: petSpecies === 'Cat'
          ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300'
          : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300',
        feedingPlan: {
          portionGrams: 100,
          timesPerDay: 2,
          foodType: 'Standard Clinical Diet',
        },
        hydrationTarget: 500,
        latestVitals: {
          temperature: 38.5,
          heartRate: 90,
          activityLevel: 'Normal',
          lastMeasured: 'Just registered',
        },
        notes: petNotes.trim() || 'Registered during owner portal signup.',
      });

      if (newOwner.id && createdPet) {
        updateOwner(newOwner.id, { petIds: [createdPet.id] });
      }
    }

    await sendVerificationEmail(trimmedEmail, trimmedName);
    setIsLoading(false);
    setVerificationPending(true);
    showToast(
      'success',
      'VERIFICATION EMAIL DISPATCHED',
      'A verification email was sent to ' + trimmedEmail + ' from ' + SYSTEM_OTP_SENDER_EMAIL + '.'
    );
  };

  const handleResendVerification = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    sendVerificationEmail(email, name);
    showToast(
      'info',
      'EMAIL RE-SENT',
      'New verification email dispatched from ' + SYSTEM_OTP_SENDER_EMAIL + ' to ' + email
    );
  };

  // ─── VERIFICATION PENDING SUCCESS SCREEN ────────────────────────────────
  if (verificationPending) {
    return (
      <div className="space-y-6 text-center animate-fade-in py-2">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-md ring-4 ring-teal-50">
          <Mail className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Verify Your Email Address</h3>
          <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            We have sent a secure verification link to:
          </p>
          <div className="p-3 bg-slate-100 rounded-xl font-mono font-bold text-xs text-slate-900 border border-slate-200 inline-block">
            {email}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 font-extrabold text-rose-900">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Sender: {SYSTEM_OTP_SENDER_EMAIL}</span>
          </div>
          <p className="text-[11px] text-rose-800 leading-relaxed">
            Please check your inbox (and Spam/Junk folder). Click the verification link inside the email to complete your Pet Owner registration.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('hn_owner_email', email);
              localStorage.setItem('hn_owner_verified_' + email, 'true');
              showToast('success', 'EMAIL VERIFIED', 'Welcome to the HydroNourish Pet Owner Portal!');
              onSuccess(email);
            }}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            ✓ I Have Verified My Email · Proceed to Portal
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendVerification}
              className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-rose-600" />
              {resendCooldown > 0 ? resendCooldown + 's cooldown' : 'Resend Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                const link = typeof window !== 'undefined' ? window.location.origin + '/owner/login?verified=true&email=' + encodeURIComponent(email) : 'https://hydro-nourish.vercel.app/owner/login?verified=true&email=' + encodeURIComponent(email);
                navigator.clipboard.writeText(link);
                showToast('success', 'LINK COPIED', 'Direct verification link copied to clipboard!');
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              Copy Direct Link
            </button>
          </div>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors pt-1"
          >
            <LogIn className="w-3.5 h-3.5" />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ─── REGISTRATION FORM ───────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900">Pet Owner Registration</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Create your owner profile and register your pet's medical details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label
            htmlFor="register-name"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-600" />
              Full Name *
            </span>
          </label>
          <input
            id="register-name"
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
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
                <Mail className="w-3.5 h-3.5 text-rose-600" />
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
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
              placeholder="owner@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="register-phone"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-600" />
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
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
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
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              Address / City
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
            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
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
                <Lock className="w-3.5 h-3.5 text-rose-600" />
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
                className="w-full px-3.5 py-2.5 pr-8 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
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
                <Lock className="w-3.5 h-3.5 text-rose-600" />
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
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 transition-all"
              placeholder="Re-enter password"
            />
          </div>
        </div>

        {/* ─── PET DETAILS SECTION (EDITABLE BY PET OWNER) ─── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 pt-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
              <Dog className="w-4 h-4 text-rose-600" />
              <span>Pet Profile & Clinical Details</span>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPet}
                onChange={(e) => setHasPet(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              Register pet now
            </label>
          </div>

          {hasPet && (
            <div className="space-y-3 text-xs pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">Pet Name *</label>
                  <input
                    type="text"
                    required={hasPet}
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none bg-white"
                    placeholder="e.g. Luna"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">Species *</label>
                  <select
                    value={petSpecies}
                    onChange={(e) => setPetSpecies(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none bg-white"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Other">Other Animal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">Breed</label>
                  <input
                    type="text"
                    value={petBreed}
                    onChange={(e) => setPetBreed(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none bg-white"
                    placeholder="e.g. Poodle"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={petAge}
                    onChange={(e) => setPetAge(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">Weight (kg)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={petWeight}
                    onChange={(e) => setPetWeight(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:border-rose-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">Animal Dietary & Medical Notes</label>
                <textarea
                  rows={2}
                  value={petNotes}
                  onChange={(e) => setPetNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-medium focus:border-rose-500 focus:outline-none bg-white"
                  placeholder="Allergies, food preferences, medical conditions..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
        >
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Creating Account…' : 'Register Account & Send Verification'}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-3 border-t border-slate-100 text-center space-y-1">
        <p className="text-xs text-slate-500 font-medium">Already have an owner account?</p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Sign In to Pet Owner Portal
        </button>
      </div>
    </div>
  );
};
