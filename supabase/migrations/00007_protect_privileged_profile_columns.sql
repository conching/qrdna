-- ============================================================================
-- QR DNA: Protect privileged profile columns
-- Migration: 00007_protect_privileged_profile_columns.sql
--
-- Problem
-- -------
-- The `profiles_update_own` policy (00002) permits an authenticated user to
-- update their own row with no column restriction:
--
--     using (auth.uid() = id) with check (auth.uid() = id)
--
-- Because the anon key ships to the browser, any signed-in user could open the
-- console and run:
--
--     supabase.from('profiles')
--             .update({ tier: 'pro', is_admin: true })
--             .eq('id', <their own id>)
--
-- granting themselves a paid plan and admin rights, bypassing Stripe entirely.
--
-- Fix
-- ---
-- Two independent layers:
--   1. Column-level GRANTs, so `authenticated` can only write display fields.
--   2. A BEFORE UPDATE trigger that rejects changes to the privileged columns
--      from any non-service role, so the hole stays closed even if the grants
--      are widened later.
--
-- Server-side writes (the Stripe webhook, admin activation) use the service
-- role key and are unaffected.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Column-level privileges
-- ----------------------------------------------------------------------------
-- A table-level UPDATE grant covers every column, so it must be revoked before
-- column-level grants have any effect.
revoke update on public.profiles from authenticated;
revoke update on public.profiles from anon;

grant update (display_name, avatar_url) on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Defence in depth: trigger guard
-- ----------------------------------------------------------------------------
-- MUST be SECURITY INVOKER. Under SECURITY DEFINER, `current_user` inside the
-- function is the function *owner* (postgres), not the caller — the bypass
-- check below then matches on every call and the guard silently passes
-- everything through. This was caught by testing the trigger against a live
-- escalation attempt; it looked correct on the page.
--
-- `session_user` is not an alternative: PostgREST connects as `authenticator`
-- and then SET ROLEs, so session_user is `authenticator` for every request
-- regardless of which key was used.
create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Trusted server-side roles may write anything. PostgREST issues
  -- `set role service_role` for service-key requests, so current_user is the
  -- reliable signal here.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if new.tier              is distinct from old.tier
  or new.is_admin          is distinct from old.is_admin
  or new.stripe_customer_id is distinct from old.stripe_customer_id then
    raise exception
      'tier, is_admin and stripe_customer_id can only be changed server-side'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function public.guard_privileged_profile_columns() is
  'Rejects client-side writes to billing/authorization columns on profiles.';

drop trigger if exists guard_privileged_profile_columns on public.profiles;

create trigger guard_privileged_profile_columns
  before update on public.profiles
  for each row execute function public.guard_privileged_profile_columns();
