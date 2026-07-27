/**
 * HYDRO NOURISH — SUPABASE SERVICE PLACEHOLDER
 * Heritage Animal Clinic Automated Pet Feeding & Health System
 * 
 * This file serves as a ready-to-wire client interface for Supabase integration.
 * When you are ready to connect a real backend database:
 * 
 * 1. Create a Supabase project at https://supabase.com
 * 2. Add environment variables to `.env.local`:
 *    VITE_SUPABASE_URL=https://your-project-id.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key-here
 * 3. Install `@supabase/supabase-js` package (`npm install @supabase/supabase-js`)
 * 4. Uncomment the client initialization below.
 */

/*
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
*/

export const SUPABASE_CONFIG_HELP = {
  isConfigured: false,
  statusMessage: 'Currently using local mock data. Ready for Supabase connection.',
  instructions: [
    'Create tables for: pets, feeding_schedules, hydration_logs, vital_signs, ai_alerts, devices, users',
    'Set up Row Level Security (RLS) policies for Heritage Animal Clinic staff',
    'Connect real-time subscriptions for ESP32 telemetry events'
  ]
};
