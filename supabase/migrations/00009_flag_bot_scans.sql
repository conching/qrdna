-- ============================================================================
-- QR DNA: Separate link-preview crawlers from real scans
-- Migration: 00009_flag_bot_scans.sql
--
-- Pasting a short link into Slack, iMessage, WhatsApp, Facebook or X makes that
-- platform fetch the URL to build a preview. Every one of those fetches was
-- landing in scan_events indistinguishable from a person with a camera, and the
-- noise grows with how widely a code is shared — which is exactly the codes
-- whose numbers matter most.
--
-- Events are flagged rather than dropped. "12 scans, 3 link previews" is more
-- useful than silently discarding rows, and keeping them means the decision can
-- be revisited without having lost the data.
-- ============================================================================

alter table public.scan_events
  add column if not exists is_bot boolean not null default false;

comment on column public.scan_events.is_bot is
  'Request came from a link-preview crawler or scripted client, not a scanner';

alter table public.card_view_events
  add column if not exists is_bot boolean not null default false;

comment on column public.card_view_events.is_bot is
  'Request came from a link-preview crawler or scripted client, not a visitor';

-- Analytics reads always filter on this, so it belongs in the index rather than
-- as a post-filter over the whole partition.
create index if not exists idx_scan_events_human
  on public.scan_events (qr_code_id, scanned_at desc)
  where not is_bot;

create index if not exists idx_card_view_events_human
  on public.card_view_events (card_id, viewed_at desc)
  where not is_bot;

-- ----------------------------------------------------------------------------
-- Backfill
-- ----------------------------------------------------------------------------
-- Conservative on purpose: only agents that name themselves. A missing agent is
-- treated as a bot going forward, but historic nulls are left alone rather than
-- retroactively reclassified on a guess.
--
-- `bot` is matched with a leading boundary because CUBOT and Elephone are real
-- handsets; `crawler`/`spider` with a trailing one because SPIDERMAN-A1 is a
-- real phone. Getting that backwards discards genuine scans.
update public.scan_events
set is_bot = true
where user_agent is not null
  and (
    user_agent ~* '(facebookexternalhit|facebot|twitterbot|slackbot|whatsapp|linkedinbot|discordbot|telegrambot|skypeuripreview|redditbot|pinterest|embedly|iframely|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|applebot|ahrefsbot|semrushbot)'
    or user_agent ~* '(^|[^a-z])(curl|wget)/'
    or user_agent ~* '(python-requests|python-urllib|go-http-client|node-fetch|okhttp|libwww-perl|headlesschrome|phantomjs|postmanruntime)'
    or user_agent ~* '(^|[^a-z])bot([^a-z]|$)'
    or user_agent ~* 'crawler([^a-z]|$)'
    or user_agent ~* 'spider([^a-z]|$)'
  );

update public.card_view_events
set is_bot = true
where user_agent is not null
  and (
    user_agent ~* '(facebookexternalhit|facebot|twitterbot|slackbot|whatsapp|linkedinbot|discordbot|telegrambot|skypeuripreview|redditbot|pinterest|embedly|iframely|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|applebot|ahrefsbot|semrushbot)'
    or user_agent ~* '(^|[^a-z])(curl|wget)/'
    or user_agent ~* '(python-requests|python-urllib|go-http-client|node-fetch|okhttp|libwww-perl|headlesschrome|phantomjs|postmanruntime)'
    or user_agent ~* '(^|[^a-z])bot([^a-z]|$)'
    or user_agent ~* 'crawler([^a-z]|$)'
    or user_agent ~* 'spider([^a-z]|$)'
  );

-- ----------------------------------------------------------------------------
-- Re-derive the denormalised counters from human traffic only
-- ----------------------------------------------------------------------------
update public.qr_codes q
set total_scans  = coalesce(s.total, 0),
    unique_scans = coalesce(s.uniq, 0),
    last_scan_at = s.last_at
from (select id from public.qr_codes) all_q
left join (
  select qr_code_id,
         count(*)                          as total,
         count(*) filter (where is_unique) as uniq,
         max(scanned_at)                   as last_at
  from public.scan_events
  where not is_bot
  group by qr_code_id
) s on s.qr_code_id = all_q.id
where q.id = all_q.id;

-- ----------------------------------------------------------------------------
-- Stop the counter RPC counting crawlers
-- ----------------------------------------------------------------------------
-- The scan route decides whether to call this at all, but the guard belongs
-- here too: the RPC is the only thing that can move these numbers, so the rule
-- should not depend on every caller remembering it.
create or replace function public.increment_scan_counters(
  qr_id uuid,
  is_unique_scan boolean,
  is_bot_scan boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_bot_scan then
    return;
  end if;

  update qr_codes
  set total_scans  = total_scans + 1,
      unique_scans = unique_scans + (case when is_unique_scan then 1 else 0 end),
      last_scan_at = now()
  where id = qr_id;
end;
$$;

revoke execute on function public.increment_scan_counters(uuid, boolean, boolean) from public;
grant execute on function public.increment_scan_counters(uuid, boolean, boolean) to service_role;

-- `create or replace function` matches on the full signature, so adding the
-- is_bot_scan parameter above created a second overload rather than replacing
-- the original. The two-argument version has no bot guard, so anything still
-- calling it would count link previews as scans.
drop function if exists public.increment_scan_counters(uuid, boolean);
