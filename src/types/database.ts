/**
 * HydroNourish — Supabase Database Type Definitions
 * Heritage Animal Clinic Capstone Project
 *
 * This file provides TypeScript types for the Supabase Database,
 * which enables full type inference when using the Supabase client.
 */

export interface Database {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'super_admin';
          status: 'active' | 'inactive' | 'suspended';
          avatar_url: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'admin' | 'super_admin';
          status?: 'active' | 'inactive' | 'suspended';
          avatar_url?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'admin' | 'super_admin';
          status?: 'active' | 'inactive' | 'suspended';
          avatar_url?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          name: string;
          species: string;
          breed: string;
          age: number;
          weight: number;
          owner_name: string;
          owner_phone: string;
          clinic_ref: string;
          assigned_device_id: string | null;
          health_status: string | null;
          avatar_url: string | null;
          portion_grams: number | null;
          times_per_day: number | null;
          food_type: string | null;
          hydration_target: number | null;
          latest_temp: number | null;
          latest_heart_rate: number | null;
          latest_activity: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          species: string;
          breed: string;
          age: number;
          weight: number;
          owner_name: string;
          owner_phone: string;
          clinic_ref: string;
          assigned_device_id?: string | null;
          health_status?: string | null;
          avatar_url?: string | null;
          portion_grams?: number | null;
          times_per_day?: number | null;
          food_type?: string | null;
          hydration_target?: number | null;
          latest_temp?: number | null;
          latest_heart_rate?: number | null;
          latest_activity?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          species?: string;
          breed?: string;
          age?: number;
          weight?: number;
          owner_name?: string;
          owner_phone?: string;
          clinic_ref?: string;
          assigned_device_id?: string | null;
          health_status?: string | null;
          avatar_url?: string | null;
          portion_grams?: number | null;
          times_per_day?: number | null;
          food_type?: string | null;
          hydration_target?: number | null;
          latest_temp?: number | null;
          latest_heart_rate?: number | null;
          latest_activity?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
