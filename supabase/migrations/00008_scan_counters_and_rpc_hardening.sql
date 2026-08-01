-- ============================================================================
-- QR DNA: Add the missing scan counters, and lock down the counter RPCs
-- Migration: 00008_scan_counters_and_rpc_hardening.sql
--
-- Two problems, both only visible against a live database.
--
-- 1. MISSING COLUMNS
--    `qr_codes.total_scans`, `unique_scans` and `last_scan_at` were never
--    created by 00001. Migration 00004 defined increment_scan_counters()
--    against them, and the app reads them in the dashboard, the account
--    analytics endpoint, the `most-scans` sort and the scan logger. So scan
--    counting never worked, and GET /api/v1/analytics failed on its first
--    query with `column "total_scans" does not exist`.
--
-- 2. PUBLICLY CALLABLE COUNTER RPCS
--    increment_scan_counters() and increment_version_count() are SECURITY
--    DEFINER and were callable over /rest/v1/rpc/ by anyone holding the public
--    anon key, letting them inflate any code's scan count by uuid.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. The counters the app has always expected
-- ----------------------------------------------------------------------------
alter table public.qr_codes
  add column if not exists total_scans  integer     not null default 0,
  add column if not exists unique_scans integer     not null default 0,
  add column if not exists last_scan_at timestamptz;

comment on column public.qr_codes.total_scans  is 'Denormalised count of scan_events for this code';
comment on column public.qr_codes.unique_scans is 'Denormalised count of scan_events where is_unique';

-- Backfill from any scan events recorded before the columns existed.
update public.qr_codes q
set total_scans  = s.total,
    unique_scans = s.uniq,
    last_scan_at = s.last_at
from (
  select qr_code_id,
         count(*)                          as total,
         count(*) filter (where is_unique) as uniq,
         max(scanned_at)                   as last_at
  from public.scan_events
  group by qr_code_id
) s
where s.qr_code_id = q.id;

-- Sorting the dashboard by scan count without this is a full table scan.
create index if not exists idx_qr_codes_total_scans
  on public.qr_codes (user_id, total_scans desc);

-- The scan logger's uniqueness probe filters on all four of these columns.
create index if not exists idx_scan_events_unique_probe
  on public.scan_events (qr_code_id, ip_address, user_agent, scanned_at desc);

-- ----------------------------------------------------------------------------
-- 2. Pin search_path and restrict EXECUTE
-- ----------------------------------------------------------------------------
alter function public.increment_scan_counters(uuid, boolean) set search_path = public;
alter function public.increment_version_count(uuid)          set search_path = public;
alter function public.update_updated_at_column()             set search_path = public;
alter function public.handle_new_user()                      set search_path = public;

-- IMPORTANT: revoke from PUBLIC, not from anon/authenticated.
--
-- PostgreSQL grants EXECUTE on every new function to PUBLIC by default, and
-- anon/authenticated inherit it as members of PUBLIC. Revoking from those two
-- roles individually leaves the PUBLIC grant in place and changes nothing —
-- verified the hard way by an anon call that still incremented a counter.
revoke execute on function public.increment_scan_counters(uuid, boolean) from public;
revoke execute on function public.increment_version_count(uuid)          from public;
revoke execute on function public.handle_new_user()                      from public;
revoke execute on function public.update_updated_at_column()             from public;

-- The scan route and version tracking run through the service client.
grant execute on function public.increment_scan_counters(uuid, boolean) to service_role;
grant execute on function public.increment_version_count(uuid)          to service_role;

-- handle_new_user and update_updated_at_column are trigger-only: PostgreSQL
-- does not check EXECUTE on a trigger function for the user running the DML,
-- so they need no grants at all.
