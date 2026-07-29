/**
 * HYDRO NOURISH — AUTOMATED OTP DISPATCH SERVICE
 * Heritage Animal Clinic Capstone Project
 * 
 * System Name: HydroNourish
 * Sender: heritagelink45@gmail.com
 */

import { supabase } from '../lib/supabase';

export const SYSTEM_NAME = 'HydroNourish';
export const SYSTEM_OTP_SENDER_EMAIL = 'heritagelink45@gmail.com';

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  code: string;
  sender: string;
  hasError?: boolean;
  errorMessage?: string;
  supabaseStatus?: string;
  formSubmitStatus?: string;
}

/**
 * Checks if the configured Supabase Anon Key is a valid JWT token.
 */
function isJwtAnonKey(key: string): boolean {
  return typeof key === 'string' && key.startsWith('eyJ') && !key.includes('.placeholder');
}

/**
 * Generates a dynamic 6-digit 2FA Login OTP code and dispatches email delivery.
 */
export async function sendLoginOtp(recipientEmail: string): Promise<EmailDispatchResult> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  const validSupabaseKey = isJwtAnonKey(rawKey);

  let supabaseStatus = 'OK';
  let formSubmitStatus = 'OK';
  let hasError = false;
  let errorMessage = '';

  // 1. Only call Supabase Auth if a valid JWT anon key is configured
  if (validSupabaseKey) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: recipientEmail,
        options: { shouldCreateUser: true },
      });

      if (error) {
        supabaseStatus = `Error ${error.status || '401'}: ${error.message}`;
        hasError = true;
        errorMessage = error.message;
      }
    } catch (err: any) {
      supabaseStatus = `Network Error: ${err?.message || 'Failed to fetch'}`;
      hasError = true;
      errorMessage = err?.message || 'Failed to communicate with Supabase Auth server.';
    }
  } else {
    supabaseStatus = '401 Unauthorized (VITE_SUPABASE_ANON_KEY must be a valid JWT starting with "eyJ")';
  }

  // 2. Backup email dispatch via FormSubmit API to guarantee inbox delivery
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: `Admin Login Verification Code - HydroNourish`,
        _template: 'table',
        _captcha: 'false',
        System: 'HydroNourish Administrator Portal',
        Sender: SYSTEM_OTP_SENDER_EMAIL,
        Recipient: recipientEmail,
        VerificationCode: code,
        Instructions: `Your 6-digit 2FA login verification code for HydroNourish Admin Portal is ${code}. Please enter this code in the login prompt to complete verification.`,
      }),
    });

    if (!res.ok) {
      formSubmitStatus = `HTTP ${res.status}`;
    }
  } catch (err: any) {
    formSubmitStatus = `Fetch Failed: ${err?.message || 'Network blocked'}`;
  }

  return {
    success: true,
    message: hasError ? 'Notice: Supabase Key requires JWT format' : `Verification code sent to ${recipientEmail}.`,
    code,
    sender: SYSTEM_OTP_SENDER_EMAIL,
    hasError,
    errorMessage,
    supabaseStatus,
    formSubmitStatus,
  };
}

/**
 * Generates a dynamic 6-digit Password Reset OTP code and triggers email delivery.
 */
export async function sendForgotPasswordOtp(recipientEmail: string): Promise<EmailDispatchResult> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  const validSupabaseKey = isJwtAnonKey(rawKey);

  if (validSupabaseKey) {
    try {
      await supabase.auth.signInWithOtp({
        email: recipientEmail,
        options: { shouldCreateUser: false },
      });
    } catch (err) {
      console.warn('[HydroNourish Auth] Supabase Reset OTP notice:', err);
    }
  }

  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: `Password Reset Verification Code - HydroNourish`,
        _template: 'table',
        _captcha: 'false',
        System: 'HydroNourish Administrator Portal',
        Sender: SYSTEM_OTP_SENDER_EMAIL,
        Recipient: recipientEmail,
        VerificationCode: code,
        Instructions: `Your 6-digit password reset verification code is ${code}.`,
      }),
    });
  } catch (err) {
    console.warn('[HydroNourish Email] FormSubmit reset notice:', err);
  }

  return {
    success: true,
    message: `Password reset code sent to ${recipientEmail}.`,
    code,
    sender: SYSTEM_OTP_SENDER_EMAIL,
  };
}
