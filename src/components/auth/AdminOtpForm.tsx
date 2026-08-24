/**
 * HydroNourish — Admin OTP Form (OTP Step 2)
 * Heritage Animal Clinic Capstone Project
 *
 * Step 2 of the two-step admin login flow.
 * Displays sender info (heritagelink45@gmail.com) and verifies OTP code.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Clock,
  Mail,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../hooks/useAppContext';
import { sendLoginOtp, SYSTEM_OTP_SENDER_EMAIL } from '../../services/emailService';
import { checkOtpRateLimit } from '../../utils/rateLimiter';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

interface AdminOtpFormProps {
  email: string;
  expectedCode?: string;
  onSuccess: () => void;
  onChangeEmail: () => void;
}

export const AdminOtpForm: React.FC<AdminOtpFormProps> = ({
  email,
  expectedCode: initialExpectedCode,
  onSuccess,
  onChangeEmail,
}) => {
  const { verifyOtp, requestOtp } = useAuth();
  const { showToast } = useAppContext();

  const [expectedCode, setExpectedCode] = useState<string | undefined>(initialExpectedCode);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(RESEND_COOLDOWN_SECONDS);
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (!isCooldownActive) return;

    if (cooldown <= 0) {
      setIsCooldownActive(false);
      return;
    }

    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCooldownActive, cooldown]);

  const getOtpValue = () => digits.join('');

  // Handle single digit input
  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newDigits = [...digits];
      newDigits[index] = value.slice(-1);
      setDigits(newDigits);
      setError(null);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (value && index === OTP_LENGTH - 1) {
        const completed = [...newDigits.slice(0, OTP_LENGTH - 1), value.slice(-1)].join('');
        if (completed.length === OTP_LENGTH) {
          handleVerify(completed);
        }
      }
    },
    [digits]
  );

  // Handle backspace navigation
  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newDigits = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    setError(null);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === OTP_LENGTH) {
      handleVerify(pasted);
    }
  }, []);

  // Verify OTP
  const handleVerify = async (otpValue?: string) => {
    const code = otpValue ?? getOtpValue();

    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // If expectedCode was dispatched via emailService, check it
    if (expectedCode && code === expectedCode) {
      setIsVerifying(false);
      onSuccess();
      return;
    }

    // Try Supabase Auth verification
    try {
      const result = await verifyOtp(email, code);
      if (result.success) {
        setIsVerifying(false);
        onSuccess();
        return;
      }
    } catch {
      // Fall through to code check
    }

    setIsVerifying(false);

    if (expectedCode && code === expectedCode) {
      onSuccess();
      return;
    }

    setError('Verification failed. Please check the code and try again.');
    setDigits(Array(OTP_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleVerify();
  };

  // Resend OTP
  const handleResend = async () => {
    if (isCooldownActive) return;

    // Anti-Spam Rate Limit Check
    const rateLimit = checkOtpRateLimit(email);
    if (!rateLimit.allowed) {
      setError(`Spam protection active: Please wait ${rateLimit.waitSeconds} seconds before requesting another code.`);
      showToast(
        'warning',
        'TOO MANY REQUESTS DETECTED',
        `Spam protection active. Please wait ${rateLimit.waitSeconds} seconds before requesting another code.`
      );
      return;
    }

    setIsResending(true);
    setError(null);
    setDigits(Array(OTP_LENGTH).fill(''));

    const result = await sendLoginOtp(email);
    setExpectedCode(result.code);
    try {
      await requestOtp(email);
    } catch {}

    setIsResending(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setIsCooldownActive(true);

    showToast(
      'info',
      'NEW OTP CODE DISPATCHED',
      `Sent new 6-digit verification code to ${email}. Please check your email inbox.`
    );

    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 w-fit mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Enter Verification Code</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          We sent a 6-digit verification code to:
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
          <Mail className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800 font-mono">{email}</span>
        </div>
      </div>

      {/* Cooldown Timer */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-500" />
          Code expires in:
        </span>
        <span
          className={`font-mono font-bold px-2 py-0.5 rounded-md ${
            cooldown > 15
              ? 'bg-emerald-100 text-emerald-800'
              : cooldown > 0
              ? 'bg-amber-100 text-amber-800 animate-pulse'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {cooldown > 0 ? `${String(Math.floor(cooldown / 60)).padStart(2, '0')}:${String(cooldown % 60).padStart(2, '0')}` : 'Expired'}
        </span>
      </div>

      {/* OTP Form */}
      <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
        {/* Error */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center"
          >
            {error}
          </div>
        )}

        {/* 6 Digit Inputs */}
        <fieldset aria-label="6-digit verification code">
          <div className="flex items-center justify-between gap-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                id={`otp-digit-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                aria-label={`Digit ${idx + 1} of 6`}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={isVerifying}
                className={`w-11 h-14 text-center font-extrabold text-lg rounded-xl border-2 transition-all focus:outline-none disabled:opacity-60 ${
                  digit
                    ? 'bg-rose-50 border-rose-500 text-rose-900'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-rose-500'
                }`}
              />
            ))}
          </div>
        </fieldset>

        {/* Verify Button */}
        <button
          id="verify-otp-btn"
          type="submit"
          disabled={isVerifying || getOtpValue().length < OTP_LENGTH}
          className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Verify Code & Sign In
            </>
          )}
        </button>
      </form>

      {/* Secondary Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={onChangeEmail}
          disabled={isVerifying}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Change email
        </button>

        <button
          id="resend-otp-btn"
          type="button"
          onClick={handleResend}
          disabled={isCooldownActive || isResending || isVerifying}
          className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isResending ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Sending…
            </>
          ) : isCooldownActive ? (
            `Resend in ${cooldown}s`
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Resend code
            </>
          )}
        </button>
      </div>
    </div>
  );
};
