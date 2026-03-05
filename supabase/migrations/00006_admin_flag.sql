-- 00006_admin_flag.sql
-- Adds an admin bypass flag to profiles so owners/testers can unlock
-- all Pro features without a Stripe subscription.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_admin IS 'When true the user receives Pro-level access regardless of their tier';
