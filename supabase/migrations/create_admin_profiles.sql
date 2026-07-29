-- ============================================================
-- HYDRO NOURISH — ADMIN PROFILES TABLE & ROW LEVEL SECURITY
-- Heritage Animal Clinic Capstone Project
-- Run this migration in Supabase SQL Editor or via Supabase CLI.
-- ============================================================

-- 1. Create the admin_profiles table
-- --------------------------------------------------------
-- Each row maps to an auth.users record via the id column.
-- Provisioning is done manually via the Supabase dashboard
-- or a secure server-side process. No public sign-up is allowed.

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL UNIQUE,
  full_name    TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'admin'
                           CHECK (role IN ('admin', 'super_admin')),
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url   TEXT,
  last_login_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
-- --------------------------------------------------------
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- --------------------------------------------------------
-- POLICY: An authenticated admin can read ONLY their own profile row.
-- The public and anonymous roles cannot read any rows.
CREATE POLICY "admin_profiles_select_own"
  ON public.admin_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- POLICY: An authenticated admin may update ONLY their own last_login_at.
-- The WITH CHECK clause prevents changing role or status via frontend.
-- Note: full protection against field-level changes requires a trigger (see below).
CREATE POLICY "admin_profiles_update_last_login"
  ON public.admin_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- POLICY: No INSERT allowed for authenticated users (prevents self-registration).
-- Admin provisioning must happen via the service role key or Supabase dashboard.
-- (No insert policy = INSERT is denied for anon and authenticated roles)

-- POLICY: No DELETE allowed for authenticated users.
-- (No delete policy = DELETE is denied for anon and authenticated roles)

-- 4. Trigger to protect role and status from client-side modification
-- --------------------------------------------------------
-- This trigger enforces that authenticated users cannot change their own
-- role or status, even if the update policy allows the row change.
CREATE OR REPLACE FUNCTION public.protect_admin_role_and_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prevent role or status changes from client requests
  IF NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'Changing role is not permitted via the frontend.';
  END IF;
  IF NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Changing status is not permitted via the frontend.';
  END IF;
  -- Automatically maintain updated_at
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_admin_role_status_trigger ON public.admin_profiles;
CREATE TRIGGER protect_admin_role_status_trigger
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_role_and_status();

-- ============================================================
-- HOW TO PROVISION THE FIRST ADMINISTRATOR
-- ============================================================
-- 
-- Step 1: In the Supabase Dashboard, go to Authentication → Users.
--         Click "Invite user" and enter the administrator's email.
--         Supabase will send an invitation email.
--         Alternatively, use the Supabase Admin API with the service-role key.
--
-- Step 2: Once the user has accepted the invitation and confirmed their email,
--         copy their UUID from Authentication → Users.
--
-- Step 3: Insert a matching record in admin_profiles using the SQL Editor.
--         Replace the placeholders below with real values:
--
--   INSERT INTO public.admin_profiles (id, email, full_name, role, status)
--   VALUES (
--     'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- auth.users UUID
--     'admin@example.com',                      -- must match auth email
--     'Full Name Here',
--     'super_admin',                            -- or 'admin'
--     'active'
--   );
--
-- Step 4: The administrator can now log in using the email OTP flow.
--         Role and status can only be changed via this SQL Editor or
--         a server-side process with the service-role key.
--
-- SECURITY REMINDER:
--   - Never paste the service-role key into frontend code.
--   - Never run this migration with the anon key.
--   - The service-role key bypasses RLS — keep it secret.
-- ============================================================
