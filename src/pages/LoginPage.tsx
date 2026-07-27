import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAppContext } from '../hooks/useAppContext';
import { Modal } from '../components/Modal';
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
  Mail
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, showToast } = useAppContext();

  // Authentication Flow Step: 1 = Email & Password, 2 = 2FA OTP Security Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [email, setEmail] = useState('heritagelink45@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  // 2FA OTP & 1-Minute (60s) Timer State
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Modals
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Input Refs for 6-digit OTP fields
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds]);

  // Generate random 6-digit OTP
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setTimerSeconds(60);
    setIsTimerActive(true);
    setOtpDigits(['', '', '', '', '', '']);
    return code;
  };

  // Step 1 Submit: Trigger 2FA OTP Dispatch
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('warning', 'Email Required', 'Please enter a valid email address.');
      return;
    }

    const code = generateNewOtp();
    setStep(2);

    showToast(
      'info',
      'SECURITY OTP DISPATCHED',
      `Dynamic 6-Digit Verification Code [${code}] sent to ${email}. Valid for 1 minute.`
    );
  };

  // Quick Demo Admin Login
  const handleAdminQuickLogin = () => {
    setEmail('heritagelink45@gmail.com');
    setPassword('admin-secure-pass-2026');
    const code = generateNewOtp();
    setStep(2);
    showToast(
      'success',
      'ADMIN 2FA CODE GENERATED',
      `Security OTP [${code}] dispatched to heritagelink45@gmail.com (1 Minute Timer).`
    );
  };

  // Step 2 Submit: Validate OTP
  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (timerSeconds === 0) {
      showToast('error', 'OTP Code Expired', 'The 1-minute verification window has expired. Please click Resend OTP.');
      return;
    }

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      showToast('warning', 'Incomplete Code', 'Please enter all 6 digits of the OTP security code.');
      return;
    }

    if (enteredOtp !== generatedOtp) {
      showToast('error', 'Invalid Security OTP', 'The 6-digit code entered does not match.');
      return;
    }

    // Success: Authenticate user & navigate to SaaS dashboard
    login();
    showToast('success', '2FA Authentication Success', `Signed in as Primary Administrator (${email}).`);
    navigate('/app');
  };

  // Resend OTP Action
  const handleResendOtp = () => {
    const code = generateNewOtp();
    showToast(
      'info',
      'NEW OTP DISPATCHED',
      `Fresh 6-Digit Security Code [${code}] sent to ${email}. Timer reset to 60s.`
    );
  };

  // OTP Input Digit Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotModalOpen(false);
    showToast('info', 'Password Reset Link', `Reset instructions dispatched to ${forgotEmail || email}.`);
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
            Heritage Animal Clinic Security Portal
          </p>
        </div>

        {/* STEP 1: CREDENTIALS FORM */}
        {step === 1 ? (
          <div className="p-8 space-y-6 animate-fade-in">
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  Clinic Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-bold rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="heritagelink45@gmail.com"
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
                    className="text-xs font-semibold text-teal-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Enter password"
                />
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
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Continue to 2FA Security Check
              </button>
            </form>

            {/* Quick Primary Admin Button */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <button
                type="button"
                onClick={handleAdminQuickLogin}
                className="w-full py-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Sign In as Admin (heritagelink45@gmail.com)
              </button>

              <div className="text-center">
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
        ) : (
          /* STEP 2: 2-FACTOR SECURITY OTP VERIFICATION */
          <div className="p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 w-fit mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">2-Factor Security Verification</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                An authentication OTP code was dispatched to:
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 font-bold text-slate-900 text-xs">
                {email}
              </span>
            </div>

            {/* Live 60-Second (1 Min) Timer Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                1-Min Security Timer:
              </span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                  timerSeconds > 15
                    ? 'bg-emerald-100 text-emerald-800'
                    : timerSeconds > 0
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {timerSeconds > 0 ? `00:${String(timerSeconds).padStart(2, '0')}` : 'Expired'}
              </span>
            </div>

            {/* Dynamic Demo OTP Notification Banner */}
            {generatedOtp && (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Security OTP Code:
                  </span>
                  <span className="font-mono text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-teal-300 text-teal-950 font-extrabold">
                    {generatedOtp}
                  </span>
                </div>
                <p className="text-[11px] text-teal-700">Enter the 6-digit code above or click to auto-verify.</p>
              </div>
            )}

            {/* 6-Digit OTP Inputs */}
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
              <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center font-extrabold text-lg text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={timerSeconds === 0}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify & Sign In as Admin
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
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
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Heritage Animal Clinic Security Portal"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your clinic email address below. We will send a secure password reset link to verify your identity.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
              placeholder="heritagelink45@gmail.com"
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
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
