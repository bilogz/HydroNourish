-- ============================================================
-- HYDRO NOURISH — CLINIC USERS RLS POLICIES
-- Heritage Animal Clinic Capstone Project
-- Run this in the Supabase SQL Editor to enable full CRUD access
-- for the clinic_users table via the anon key.
-- ============================================================

-- Enable RLS on clinic_users (idempotent)
ALTER TABLE public.clinic_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or anon) to SELECT clinic_users
-- (Your app uses anon key for all data operations)
DROP POLICY IF EXISTS "clinic_users_select_all" ON public.clinic_users;
CREATE POLICY "clinic_users_select_all"
  ON public.clinic_users
  FOR SELECT
  USING (true);

-- Allow INSERT of new clinic users
DROP POLICY IF EXISTS "clinic_users_insert" ON public.clinic_users;
CREATE POLICY "clinic_users_insert"
  ON public.clinic_users
  FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE of clinic users
DROP POLICY IF EXISTS "clinic_users_update" ON public.clinic_users;
CREATE POLICY "clinic_users_update"
  ON public.clinic_users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE of clinic users (for deprovisioning)
DROP POLICY IF EXISTS "clinic_users_delete" ON public.clinic_users;
CREATE POLICY "clinic_users_delete"
  ON public.clinic_users
  FOR DELETE
  USING (true);

-- ============================================================
-- NOTE: These policies grant open access via the anon key.
-- For production hardening, restrict INSERT/UPDATE/DELETE
-- to authenticated users with a super_admin role check.
-- ============================================================
