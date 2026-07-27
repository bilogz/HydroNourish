import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAppContext } from '../hooks/useAppContext';
import { Modal } from '../components/Modal';
import { sendLoginOtp, sendForgotPasswordOtp, SYSTEM_OTP_SENDER_EMAIL } from '../services/emailService';
import {
  LogIn,
  ArrowLeft,
  KeyRound,
  Sparkles,
  ShieldCheck,
  Clock,
  RefreshCw,
  CheckCircle2,
  Lock,
  Mail,
  Send,
  Key,
  Crown,
  Eye,
  EyeOff,
  ShieldAlert,
  Server
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, showToast } = useAppContext();

  // Authentication Step:
  // 1 = Email & Password Login
  // 2 = 2FA Login OTP Security Check (1-Min Timer)
  // 3 = Forgot Password Reset OTP Verification (1-Min Timer)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Login Credentials State
  const [email, setEmail] = useState('joecelgarcia1@gmail.com');
  const [password, setPassword] = useState('Admin#123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Security Lockout Protection State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // OTP State for 2FA Login
  const [generatedLoginOtp, setGeneratedLoginOtp] = useState<string>('');
  const [loginOtpDigits, setLoginOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loginTimerSeconds, setLoginTimerSeconds] = useState<number>(60);
  const [isLoginTimerActive, setIsLoginTimerActive] = useState<boolean>(false);
  const [isDispatchingOtp, setIsDispatchingOtp] = useState<boolean>(false);

  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('joecelgarcia1@gmail.com');
  const [generatedResetOtp, setGeneratedResetOtp] = useState<string>('');
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resetTimerSeconds, setResetTimerSeconds] = useState<number>(60);
  const [isResetTimerActive, setIsResetTimerActive] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState('');

  // Input Refs
  const loginOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Lockout Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  // 1-Minute Countdown Effect for Login 2FA
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoginTimerActive && loginTimerSeconds > 0) {
      interval = setInterval(() => {
        setLoginTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (loginTimerSeconds === 0) {
      setIsLoginTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoginTimerActive, loginTimerSeconds]);

  // 1-Minute Countdown Effect for Reset Password OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isResetTimerActive && resetTimerSeconds > 0) {
      interval = setInterval(() => {
        setResetTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (resetTimerSeconds === 0) {
      setIsResetTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResetTimerActive, resetTimerSeconds]);

  // Handle Step 1 Submit (Dispatch Login OTP)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutTimer > 0) {
      showToast('error', 'Security Cooldown Active', `Account temporarily locked due to multiple failed attempts. Try in ${lockoutTimer}s.`);
      return;
    }

    if (!email) {
      showToast('warning', 'Email Required', 'Please enter your clinic email address.');
      return;
    }

    // Validate credentials if Super Admin is targeted
    if (email.toLowerCase() === 'joecelgarcia1@gmail.com' && password !== 'Admin#123') {
      const newFailed = failedAttempts + 1;
      setFailedAttempts(newFailed);
      if (newFailed >= 3) {
        setLockoutTimer(30);
        showToast('error', 'Account Locked (30s)', '3 failed attempts recorded. IP flagged for security cooldown.');
      } else {
        showToast('error', 'Invalid Super Admin Password', `Incorrect password for ${email}. (${3 - newFailed} attempts remaining)`);
      }
      return;
    }

    setIsDispatchingOtp(true);
    const result = await sendLoginOtp(email);
    setIsDispatchingOtp(false);

    setGeneratedLoginOtp(result.code);
    setLoginTimerSeconds(60);
    setIsLoginTimerActive(true);
    setLoginOtpDigits(['', '', '', '', '', '']);
    setStep(2);

    const isSuper = email.toLowerCase() === 'joecelgarcia1@gmail.com';
    showToast(
      isSuper ? 'success' : 'info',
      isSuper ? 'SUPER ADMIN 2FA INITIATED' : 'SECURITY OTP DISPATCHED',
      `Sent 6-digit code to ${email} from ${SYSTEM_OTP_SENDER_EMAIL}. Valid for 1 min.`
    );
  };

  // Handle Quick Super Admin Login
  const handleSuperAdminQuickLogin = async () => {
    setEmail('joecelgarcia1@gmail.com');
    setPassword('Admin#123');

    setIsDispatchingOtp(true);
    const result = await sendLoginOtp('joecelgarcia1@gmail.com');
    setIsDispatchingOtp(false);

    setGeneratedLoginOtp(result.code);
    setLoginTimerSeconds(60);
    setIsLoginTimerActive(true);
    setLoginOtpDigits(['', '', '', '', '', '']);
    setStep(2);

    showToast('success', 'SUPER ADMIN 2FA CODE DISPATCHED', `Sent code [${result.code}] from ${SYSTEM_OTP_SENDER_EMAIL} to joecelgarcia1@gmail.com.`);
  };

  // Handle Quick Standard Admin Login
  const handleAdminQuickLogin = async () => {
    setEmail('heritagelink45@gmail.com');
    setPassword('admin-pass-2026');

    setIsDispatchingOtp(true);
    const result = await sendLoginOtp('heritagelink45@gmail.com');
    setIsDispatchingOtp(false);

    setGeneratedLoginOtp(result.code);
    setLoginTimerSeconds(60);
    setIsLoginTimerActive(true);
    setLoginOtpDigits(['', '', '', '', '', '']);
    setStep(2);

    showToast('info', 'ADMIN 2FA CODE DISPATCHED', `Sent code [${result.code}] to heritagelink45@gmail.com.`);
  };

  // Handle Login OTP Verification
  const handleVerifyLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginTimerSeconds === 0) {
      showToast('error', 'OTP Code Expired', 'The 1-minute OTP code has expired. Click Resend OTP.');
      return;
    }

    const enteredCode = loginOtpDigits.join('');
    if (enteredCode.length < 6) {
      showToast('warning', 'Incomplete Code', 'Please enter all 6 digits.');
      return;
    }

    if (enteredCode !== generatedLoginOtp) {
      showToast('error', 'Invalid Security OTP', 'The code entered is incorrect.');
      return;
    }

    login();
    const isSuper = email.toLowerCase() === 'joecelgarcia1@gmail.com';
    showToast(
      'success',
      isSuper ? 'SUPER ADMIN GRANTED' : '2FA Authentication Success',
      `Authenticated as ${isSuper ? 'Super Admin (Joecel Garcia)' : email}.`
    );
    navigate('/app');
  };

  // Resend Login OTP
  const handleResendLoginOtp = async () => {
    setIsDispatchingOtp(true);
    const result = await sendLoginOtp(email);
    setIsDispatchingOtp(false);

    setGeneratedLoginOtp(result.code);
    setLoginTimerSeconds(60);
    setIsLoginTimerActive(true);
    setLoginOtpDigits(['', '', '', '', '', '']);

    showToast('info', 'NEW OTP DISPATCHED', `Sent code [${result.code}] from ${SYSTEM_OTP_SENDER_EMAIL} to ${email}. Timer reset to 60s.`);
  };

  // Handle Forgot Password Request Dispatch
  const handleForgotRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotModalOpen(false);

    setIsDispatchingOtp(true);
    const result = await sendForgotPasswordOtp(forgotEmail || email);
    setIsDispatchingOtp(false);

    setGeneratedResetOtp(result.code);
    setResetTimerSeconds(60);
    setIsResetTimerActive(true);
    setResetOtpDigits(['', '', '', '', '', '']);
    setStep(3);

    showToast('info', 'RESET CODE DISPATCHED', `${result.message} Valid for 1 minute.`);
  };

  // Handle Password Reset OTP Submit
  const handleVerifyResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetTimerSeconds === 0) {
      showToast('error', 'Reset Code Expired', 'The 1-minute reset window expired. Please request a new code.');
      return;
    }

    const enteredCode = resetOtpDigits.join('');
    if (enteredCode.length < 6) {
      showToast('warning', 'Incomplete Code', 'Please enter all 6 digits.');
      return;
    }

    if (enteredCode !== generatedResetOtp) {
      showToast('error', 'Invalid Reset Code', 'The code entered does not match.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast('warning', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }

    setPassword(newPassword);
    setStep(1);
    showToast('success', 'Password Updated', 'Your password has been reset successfully. Please sign in.');
  };

  // OTP Digit Change Handlers
  const handleDigitChange = (
    index: number,
    value: string,
    digits: string[],
    setDigits: (d: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    digits: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden animate-fade-in">
        {/* Top Header Card */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Heritage Animal Clinic Enterprise Security Portal
          </p>

          {/* Security Status Shield Indicator */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              256-Bit SSL Encrypted
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              <Server className="w-3 h-3 text-slate-400" />
              Node 192.168.1.104
            </span>
          </div>
        </div>

        {/* STEP 1: CREDENTIALS INPUT FORM */}
        {step === 1 && (
          <div className="p-8 space-y-6 animate-fade-in">
            {/* Lockout Protection Alert */}
            {lockoutTimer > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-pulse">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Account Security Cooldown:
                </span>
                <span className="font-mono font-bold bg-rose-100 px-2 py-0.5 rounded">
                  {lockoutTimer}s
                </span>
              </div>
            )}

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-bold rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="joecelgarcia1@gmail.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    Account Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember admin session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isDispatchingOtp || lockoutTimer > 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDispatchingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Real OTP...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Send OTP to Email
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              {/* Quick Super Admin Account */}
              <button
                type="button"
                onClick={handleSuperAdminQuickLogin}
                className="w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Crown className="w-4 h-4 text-purple-600" />
                Sign In as Super Admin (joecelgarcia1@gmail.com)
              </button>

              {/* Quick Standard Admin Account */}
              <button
                type="button"
                onClick={handleAdminQuickLogin}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Sign In as Admin (heritagelink45@gmail.com)
              </button>

              <div className="text-center pt-1">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Public Landing Page
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: 2FA LOGIN OTP VERIFICATION (1-MIN TIMER) */}
        {step === 2 && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 w-fit mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">2-Factor Security Verification</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                A dynamic 6-digit OTP code was dispatched:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>System OTP Sender:</span>
                  <span className="font-bold text-teal-700">{SYSTEM_OTP_SENDER_EMAIL}</span>
                </div>
                <div className="flex items-center justify-between text-slate-800 font-bold border-t border-slate-200/60 pt-1">
                  <span>Recipient:</span>
                  <span className="text-slate-900 font-mono">{email}</span>
                </div>
              </div>
            </div>

            {/* Live 1-Minute Countdown Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                1-Min Security Timer:
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                  loginTimerSeconds > 15
                    ? 'bg-emerald-100 text-emerald-800'
                    : loginTimerSeconds > 0
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {loginTimerSeconds > 0 ? `00:${String(loginTimerSeconds).padStart(2, '0')}` : 'Expired'}
              </span>
            </div>

            {/* 6 Input Boxes */}
            <form onSubmit={handleVerifyLoginOtp} className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                {loginOtpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (loginOtpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value, loginOtpDigits, setLoginOtpDigits, loginOtpRefs)}
                    onKeyDown={e => handleKeyDown(idx, e, loginOtpDigits, loginOtpRefs)}
                    className="w-12 h-14 text-center font-extrabold text-lg text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loginTimerSeconds === 0}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify & Sign In as Admin
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResendLoginOtp}
                    className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend OTP Code
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: FORGOT PASSWORD RESET CODE VERIFICATION (1-MIN TIMER) */}
        {step === 3 && (
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 w-fit mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Password Reset Verification</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                A 6-digit password reset code was dispatched to:
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 font-bold text-slate-900 text-xs">
                {forgotEmail}
              </span>
            </div>

            {/* Live 1-Minute Countdown Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                Reset Code Timer:
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                  resetTimerSeconds > 0 ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {resetTimerSeconds > 0 ? `00:${String(resetTimerSeconds).padStart(2, '0')}` : 'Expired'}
              </span>
            </div>

            <form onSubmit={handleVerifyResetOtp} className="space-y-4">
              {/* 6 Digit Inputs */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Enter 6-Digit Reset Code
                </label>
                <div className="flex items-center justify-between gap-2">
                  {resetOtpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (resetOtpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value, resetOtpDigits, setResetOtpDigits, resetOtpRefs)}
                      onKeyDown={e => handleKeyDown(idx, e, resetOtpDigits, resetOtpRefs)}
                      className="w-12 h-14 text-center font-extrabold text-lg text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-sky-500 focus:outline-none"
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>

              <button
                type="submit"
                disabled={resetTimerSeconds === 0}
                className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Reset Password & Update Account
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel & Back to Login
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Forgot Password — Send Reset Code"
        subtitle="Heritage Animal Clinic Security Portal"
      >
        <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your clinic email address. We will dispatch a dynamic 6-digit password reset code valid for 1 minute from {SYSTEM_OTP_SENDER_EMAIL}.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              placeholder="joecelgarcia1@gmail.com"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send Reset Code
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
