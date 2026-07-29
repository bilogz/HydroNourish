/**
 * HydroNourish — Supabase Client
 * Heritage Animal Clinic Capstone Project
 *
 * Initializes the Supabase client using environment variables with production fallbacks.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const fallbackUrl = 'https://nibsyjmdyfdvvwttcnkx.supabase.co';
const fallbackAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYnN5am1keWZkdnZ3dHRjbmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTU4MDEsImV4cCI6MjEwMDczMTgwMX0.ORgBNgtGVS3ygIXIenLxUXjdeLeMdZOOEDdR9-O4YtM';

// Ensure supabaseUrl is a valid HTTP/HTTPS URL
const supabaseUrl =
  rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : fallbackUrl;

const supabaseAnonKey =
  rawAnonKey && !rawAnonKey.includes('.placeholder')
    ? rawAnonKey
    : fallbackAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
