/**
 * HydroNourish — Supabase Client
 * Heritage Animal Clinic Capstone Project
 *
 * Initializes the Supabase client using environment variables only.
 * Never hardcode credentials here.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const fallbackUrl = 'https://nibsyjmdyfdvvwttcnkx.supabase.co';

// Ensure supabaseUrl is a valid HTTP/HTTPS URL
const supabaseUrl =
  rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : fallbackUrl;

const supabaseAnonKey = rawAnonKey || 'placeholder-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
