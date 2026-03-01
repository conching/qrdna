-- ============================================================================
-- QR DNA: Row Level Security Policies
-- Migration: 00002_rls_policies.sql
-- Description: Enables RLS on all tables and defines access policies
-- ============================================================================

-- ============================================================================
-- Enable RLS on every table
-- ============================================================================
alter table profiles          enable row level security;
alter table projects          enable row level security;
alter table qr_codes          enable row level security;
alter table scan_events       enable row level security;
alter table business_cards    enable row level security;
alter table card_view_events  enable row level security;
alter table style_templates   enable row level security;

-- ============================================================================
-- PROFILES
-- Users can read and update only their own profile
-- ============================================================================
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- PROJECTS
-- Full CRUD on own projects
-- ============================================================================
create policy "projects_select_own"
  on projects for select
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_delete_own"
  on projects for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- QR CODES
-- Full CRUD on own QR codes
-- ============================================================================
create policy "qr_codes_select_own"
  on qr_codes for select
  using (auth.uid() = user_id);

create policy "qr_codes_insert_own"
  on qr_codes for insert
  with check (auth.uid() = user_id);

create policy "qr_codes_update_own"
  on qr_codes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "qr_codes_delete_own"
  on qr_codes for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- SCAN EVENTS
-- Owners can read scan events for their QR codes (via join)
-- Anonymous / service role can insert (for scan logging from edge function)
-- ============================================================================
create policy "scan_events_select_own"
  on scan_events for select
  using (
    exists (
      select 1 from qr_codes
      where qr_codes.id = scan_events.qr_code_id
        and qr_codes.user_id = auth.uid()
    )
  );

create policy "scan_events_insert_anon"
  on scan_events for insert
  with check (true);

-- ============================================================================
-- BUSINESS CARDS
-- Full CRUD on own cards
-- ============================================================================
create policy "business_cards_select_own"
  on business_cards for select
  using (auth.uid() = user_id);

create policy "business_cards_insert_own"
  on business_cards for insert
  with check (auth.uid() = user_id);

create policy "business_cards_update_own"
  on business_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "business_cards_delete_own"
  on business_cards for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- CARD VIEW EVENTS
-- Owners can read view events for their cards (via join)
-- Anonymous can insert (public card page tracking)
-- ============================================================================
create policy "card_view_events_select_own"
  on card_view_events for select
  using (
    exists (
      select 1 from business_cards
      where business_cards.id = card_view_events.card_id
        and business_cards.user_id = auth.uid()
    )
  );

create policy "card_view_events_insert_anon"
  on card_view_events for insert
  with check (true);

-- ============================================================================
-- STYLE TEMPLATES
-- Everyone can read system templates (is_system = true)
-- Authenticated users: full CRUD on their own templates
-- ============================================================================
create policy "style_templates_select_system"
  on style_templates for select
  using (is_system = true);

create policy "style_templates_select_own"
  on style_templates for select
  using (auth.uid() = user_id);

create policy "style_templates_insert_own"
  on style_templates for insert
  with check (auth.uid() = user_id and is_system = false);

create policy "style_templates_update_own"
  on style_templates for update
  using (auth.uid() = user_id and is_system = false)
  with check (auth.uid() = user_id and is_system = false);

create policy "style_templates_delete_own"
  on style_templates for delete
  using (auth.uid() = user_id and is_system = false);
