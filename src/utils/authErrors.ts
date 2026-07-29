/**
 * HydroNourish — Auth Error Utilities
 * Heritage Animal Clinic Capstone Project
 *
 * Maps Supabase error codes/messages to user-friendly strings.
 * Never exposes raw DB errors, table names, SQL queries, or stack traces.
 */

import type { AuthError } from '@supabase/supabase-js';

/**
 * Maps a Supabase AuthError or a generic Error to a human-readable message.
 * Development-only details are logged separately without credentials.
 */
export function getAuthErrorMessage(error: AuthError | Error | unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // OTP-specific errors
  if (message.includes('otp') && message.includes('expired')) {
    return 'Your verification code has expired. Please request a new one.';
  }
  if (message.includes('token has expired') || message.includes('expired')) {
    return 'Your verification code has expired. Please request a new one.';
  }
  if (
    message.includes('invalid otp') ||
    message.includes('invalid token') ||
    message.includes('token is invalid') ||
    message.includes('otp_disabled') ||
    message.includes('bad otp')
  ) {
    return 'The verification code you entered is incorrect. Please check and try again.';
  }

  // Rate limiting
  if (
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('email rate limit exceeded')
  ) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }

  // Network / connectivity
  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  ) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Supabase configuration
  if (
    message.includes('supabase') && message.includes('config') ||
    message.includes('missing') && message.includes('env')
  ) {
    return 'Authentication service is not configured correctly. Please contact support.';
  }

  // Email-related
  if (message.includes('email') && message.includes('not confirmed')) {
    return 'Email address is not confirmed. Please check your inbox.';
  }
  if (message.includes('user not found') || message.includes('no user')) {
    // Deliberately vague to avoid user enumeration
    return 'If this email is authorized, a verification code will be sent.';
  }
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  // Session
  if (message.includes('session') && message.includes('expired')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (message.includes('not authenticated') || message.includes('unauthorized')) {
    return 'You are not authorized to access this resource.';
  }

  // Fallback — generic, never shows raw DB details
  return 'An error occurred. Please try again or contact support.';
}

/**
 * Safe development logger — strips any value that looks like a token or OTP.
 * Never call this with actual token/OTP values.
 */
export function logAuthError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    // Only log the context + sanitized message, never credentials or tokens
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Redact anything that looks like a token (long alphanumeric strings)
    const sanitized = message.replace(/[A-Za-z0-9+/=]{20,}/g, '[REDACTED]');
    console.warn(`[HydroNourish Auth] ${context}:`, sanitized);
  }
}
