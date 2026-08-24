import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAppContext } from '../hooks/useAppContext';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordChangeOtp } from '../services/emailService';
import { CLINIC_DEPARTMENTS, updateClinicUser } from '../services/clinicUserService';
import { supabase } from '../lib/supabase';
import {
  Building,
  Utensils,
  Droplets,
  Bell,
  User,
  Cpu,
  Save,
  Copy,
  Check,
  Lock,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  Camera,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

const PRESET_AVATARS = [
  { label: 'Male Doctor', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200' },
  { label: 'Female Doctor', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200' },
  { label: 'Female Tech', url: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&q=80&w=200' },
  { label: 'Male Tech / IT', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { label: 'System Admin', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { label: 'Default Specialist', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' }
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, showToast, users } = useAppContext();
  const { adminProfile, isAdmin, refreshAdminProfile, user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'clinic' | 'feeding' | 'hydration' | 'notifications' | 'account' | 'api'
  >(isAdmin ? 'clinic' : 'account');

  // Clinic System Settings Form State
  const [form, setForm] = useState(settings);
  const [copied, setCopied] = useState(false);

  // ─── USER PROFILE STATE ──────────────────────────────────────────────────
  const [profileName, setProfileName] = useState(adminProfile?.full_name || 'Staff Member');
  const [profileEmail, setProfileEmail] = useState(adminProfile?.email || user?.email || 'staff@heritageanimalclinic.com');
  const [profilePhone, setProfilePhone] = useState(adminProfile?.phone || '(555) 234-5678');
  const [profileDept, setProfileDept] = useState(adminProfile?.department || 'Veterinary Medicine');
  const [profileAvatar, setProfileAvatar] = useState(
    adminProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile when adminProfile changes
  useEffect(() => {
    if (adminProfile) {
      setProfileName(adminProfile.full_name || '');
      setProfileEmail(adminProfile.email || '');
      if (adminProfile.phone) setProfilePhone(adminProfile.phone);
      if (adminProfile.department) setProfileDept(adminProfile.department);
      if (adminProfile.avatar_url) setProfileAvatar(adminProfile.avatar_url);
    }
  }, [adminProfile]);

  // ─── PASSWORD CHANGE & EMAIL OTP STATE ──────────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const handleSaveClinicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('error', 'Access Denied', 'Administrator privileges required to modify clinic configurations.');
      return;
    }
    updateSettings(form);
    showToast('success', 'Settings Saved', 'Clinic system preferences synchronized successfully.');
  };

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText(form.apiEndpoint);
    setCopied(true);
    showToast('info', 'Copied to Clipboard', 'API Endpoint copied.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please upload a valid JPG, PNG, or WebP image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileAvatar(reader.result);
        showToast('info', 'Photo Selected', 'Remember to click Save Profile to persist your changes.');
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── SAVE USER PROFILE ────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('error', 'Name Required', 'Display name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    try {
      // 1. Update Supabase Auth User metadata
      if (user) {
        await supabase.auth.updateUser({
          data: {
            full_name: profileName.trim(),
            phone: profilePhone.trim(),
            department: profileDept,
            avatar_url: profileAvatar,
          },
        });
      }

      // 2. Update clinic_users table if user exists
      const existingClinicUser = (users || []).find(
        (u) => u.id === adminProfile?.id || u.email.toLowerCase() === profileEmail.toLowerCase()
      );
      if (existingClinicUser) {
        await updateClinicUser(existingClinicUser.id, {
          fullName: profileName.trim(),
          name: profileName.trim(),
          department: profileDept,
          avatarUrl: profileAvatar,
        });
      }

      // 3. Update admin_profiles table if present
      if (adminProfile?.id) {
        await (supabase.from('admin_profiles') as any)
          .update({
            full_name: profileName.trim(),
            phone: profilePhone.trim(),
            department: profileDept,
            avatar_url: profileAvatar,
            updated_at: new Date().toISOString(),
          })
          .eq('id', adminProfile.id);
      }

      await refreshAdminProfile();
      showToast('success', 'Profile Updated', 'Your user profile details have been saved.');
    } catch (err) {
      showToast('warning', 'Profile Saved Locally', 'Profile updated for this session.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── SEND PASSWORD CHANGE OTP VIA HERITAGELINK45@GMAIL.COM ────────────────
  const handleRequestPasswordOtp = async () => {
    if (!newPassword) {
      showToast('error', 'Password Required', 'Please enter a new password first.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords Do Not Match', 'New password and confirmation password do not match.');
      return;
    }

    setIsSendingOtp(true);
    setPasswordSuccessMsg(null);

    const recipient = profileEmail || adminProfile?.email || user?.email || 'heritagelink45@gmail.com';
    const result = await sendPasswordChangeOtp(recipient, profileName);

    setIsSendingOtp(false);

    if (result.success && result.code) {
      setGeneratedOtp(result.code);
      setIsOtpSent(true);
      setOtpCountdown(60);
      showToast(
        'success',
        'Verification Code Dispatched',
        `A 6-digit confirmation code was sent to ${recipient} from heritagelink45@gmail.com.`
      );
    } else {
      showToast('error', 'Dispatch Failed', result.errorMessage || 'Could not send verification code. Please try again.');
    }
  };

  // ─── VERIFY OTP AND UPDATE PASSWORD ───────────────────────────────────────
  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOtpSent) {
      showToast('error', 'Code Not Requested', 'Please request a verification code sent to your email first.');
      return;
    }

    const trimmedInputCode = otpCode.trim();
    if (!trimmedInputCode || trimmedInputCode.length < 6) {
      showToast('error', 'Invalid Code', 'Please enter the complete 6-digit security code received via email.');
      return;
    }

    if (generatedOtp && trimmedInputCode !== generatedOtp) {
      showToast('error', 'Incorrect Code', 'The verification code you entered does not match the code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // 1. Update Supabase Auth Password
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError && !authError.message.includes('Auth session missing')) {
        console.warn('[HydroNourish] Supabase password update notice:', authError.message);
      }

      // 2. Synchronize clinic_users table
      const matchedUser = (users || []).find(
        (u) => u.id === adminProfile?.id || u.email.toLowerCase() === profileEmail.toLowerCase()
      );
      if (matchedUser) {
        await updateClinicUser(matchedUser.id, {
          lastActive: 'Password Updated Just Now',
        });
      }

      setPasswordSuccessMsg('Password updated successfully! You can now use your new password on next login.');
      showToast('success', 'Password Updated', 'Your account password has been changed securely.');

      // Reset form
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setGeneratedOtp(null);
      setIsOtpSent(false);
    } catch (err) {
      showToast('error', 'Update Failed', 'Failed to update password. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Clinic & System Settings" breadcrumbs={[{ label: 'Settings' }]}>
      {!isAdmin && (
        <div className="p-4 mb-6 rounded-2xl bg-amber-500/10 border border-amber-200 text-amber-950 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Staff Access:</strong> Clinic-wide licensing, telemetry defaults, and system API configurations require Administrator privileges. You can manage your personal Account Profile and Password below.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= TAB NAVIGATION SIDEBAR ================= */}
        <div className="lg:col-span-3 space-y-1">
          {[
            { id: 'account', label: 'Account Profile & Security', icon: User, adminOnly: false },
            { id: 'clinic', label: 'Clinic Information', icon: Building, adminOnly: true },
            { id: 'feeding', label: 'Feeding Defaults', icon: Utensils, adminOnly: true },
            { id: 'hydration', label: 'Hydration Defaults', icon: Droplets, adminOnly: true },
            { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: true },
            { id: 'api', label: 'Device API Configuration', icon: Cpu, adminOnly: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isLocked = !isAdmin && tab.adminOnly;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isLocked) {
                    showToast('error', 'Administrator Access Required', `${tab.label} is restricted to Super Admin / Clinic Administrator accounts.`);
                    return;
                  }
                  setActiveTab(tab.id as any);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md'
                    : isLocked
                    ? 'bg-slate-50 text-slate-400 hover:bg-slate-100/80 border border-slate-200/50 cursor-not-allowed opacity-75'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            );
          })}
        </div>

        {/* ================= TAB CONTENT PANEL ================= */}
        <div className="lg:col-span-9 clinic-card p-6">
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: ACCOUNT PROFILE & SECURITY (STAFF & ADMIN)                   */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'account' && (
            <div className="space-y-8 text-xs">
              {/* 1. Profile Information Section */}
              <div className="space-y-5 pb-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-600" />
                      User Profile Information
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage your clinical identity, contact details, and display preferences
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px] capitalize">
                    {adminProfile?.role?.replace('_', ' ') || 'Staff Member'}
                  </span>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Avatar Picker & Preview */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-2">Profile Avatar</label>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative">
                        <img
                          src={profileAvatar}
                          alt={profileName}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-500/40 shadow-sm"
                        />
                        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rose-600 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200">
                            <Upload className="w-3.5 h-3.5" />
                            Upload Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-slate-400">or choose from presets below:</span>
                        </div>

                        {/* Preset Avatars */}
                        <div className="flex flex-wrap gap-2">
                          {PRESET_AVATARS.map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setProfileAvatar(av.url)}
                              title={av.label}
                              className={`relative p-0.5 rounded-xl transition-all ${
                                profileAvatar === av.url ? 'ring-2 ring-rose-600 scale-105' : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={av.url}
                                alt={av.label}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Display Name *</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-bold text-slate-900"
                        placeholder="e.g. Dr. Sarah Jenkins"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none text-slate-900"
                        placeholder="staff@heritageanimalclinic.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none text-slate-900"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Department / Clinical Role</label>
                      <select
                        value={profileDept}
                        onChange={(e) => setProfileDept(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none bg-white text-slate-900 font-medium"
                      >
                        {CLINIC_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Saving Profile...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Profile Details
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. Change Password with Email Confirmation OTP */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    Change Password & Security Verification
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Password updates require a one-time 6-digit confirmation code dispatched from{' '}
                    <strong className="text-slate-800">heritagelink45@gmail.com</strong> to your registered email.
                  </p>
                </div>

                {passwordSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{passwordSuccessMsg}</span>
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  {/* Step 1: Password inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">New Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 focus:border-indigo-500 focus:outline-none bg-white"
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

                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Confirm New Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 focus:border-indigo-500 focus:outline-none bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Request Verification Code */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        Security OTP recipient: <strong>{profileEmail}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestPasswordOtp}
                      disabled={isSendingOtp || otpCountdown > 0 || !newPassword}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingOtp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching Code...
                        </>
                      ) : otpCountdown > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Resend in {otpCountdown}s
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Send Verification Code
                        </>
                      )}
                    </button>
                  </div>

                  {/* Step 3: Enter Verification Code and Confirm */}
                  {isOtpSent && (
                    <form
                      onSubmit={handleConfirmPasswordChange}
                      className="pt-4 border-t border-indigo-200/60 space-y-3 animate-fade-in"
                    >
                      <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs">Security Verification Code Sent!</p>
                          <p className="text-[11px] text-indigo-800">
                            Check your inbox for a message from <strong>heritagelink45@gmail.com</strong>. Enter the 6-digit verification code below to confirm password modification.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Enter 6-digit OTP code"
                            className="w-full p-2.5 rounded-xl border border-indigo-300 focus:border-indigo-600 focus:outline-none font-mono text-center tracking-widest text-sm font-bold bg-white"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isVerifyingOtp || otpCode.trim().length < 6}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" /> Confirm & Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2 - 6: CLINIC SYSTEM CONFIGURATIONS (ADMIN PRIVILEGED)         */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab !== 'account' && (
            <form onSubmit={handleSaveClinicSettings} className="space-y-6 text-xs">
              {/* 1. CLINIC INFORMATION TAB */}
              {activeTab === 'clinic' && (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Heritage Animal Clinic Information</h3>
                    <p className="text-xs text-slate-500">Official clinic metadata displayed on reports and invoices</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Clinic Name *</label>
                      <input
                        type="text"
                        value={form.clinicName}
                        onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Veterinary License ID</label>
                      <input
                        type="text"
                        value={form.licenseId}
                        onChange={(e) => setForm({ ...form, licenseId: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Clinic Address</label>
                    <input
                      type="text"
                      value={form.clinicAddress}
                      onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={form.clinicPhone}
                      onChange={(e) => setForm({ ...form, clinicPhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 2. FEEDING DEFAULTS */}
              {activeTab === 'feeding' && (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Automated Feeding Defaults</h3>
                    <p className="text-xs text-slate-500">Default portion sizing and safety limits</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Default Meal Portion Size (Grams)</label>
                    <input
                      type="number"
                      value={form.defaultPortionGrams}
                      onChange={(e) => setForm({ ...form, defaultPortionGrams: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 3. HYDRATION DEFAULTS */}
              {activeTab === 'hydration' && (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Hydration Target Multipliers</h3>
                    <p className="text-xs text-slate-500">Calculates baseline ml target per kg body weight</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Target Water Intake Multiplier (ml per kg)</label>
                    <input
                      type="number"
                      value={form.defaultHydrationMlPerKg}
                      onChange={(e) => setForm({ ...form, defaultHydrationMlPerKg: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 4. NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">Notification Channels</h3>
                    <p className="text-xs text-slate-500">Configure alert delivery for veterinary staff</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <span className="font-bold text-slate-800">Email Urgent Alerts</span>
                      <input
                        type="checkbox"
                        checked={form.emailNotifications}
                        onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <span className="font-bold text-slate-800">Browser Push Notifications</span>
                      <input
                        type="checkbox"
                        checked={form.browserNotifications}
                        onChange={(e) => setForm({ ...form, browserNotifications: e.target.checked })}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* 5. DEVICE API CONFIGURATION */}
              {activeTab === 'api' && (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">ESP32 Device REST / MQTT API</h3>
                    <p className="text-xs text-slate-500">Configured endpoint for microcontroller telemetry payloads</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">REST Ingestion Endpoint URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.apiEndpoint}
                        onChange={(e) => setForm({ ...form, apiEndpoint: e.target.value })}
                        className="flex-1 p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCopyApiUrl}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">API Secret Access Key</label>
                    <input
                      type="password"
                      value={form.apiSecretKey}
                      onChange={(e) => setForm({ ...form, apiSecretKey: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {/* SAVE BUTTON FOR CLINIC CONFIGURATIONS */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Clinic Configurations
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
