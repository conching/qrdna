-- ============================================================================
-- QR DNA: Initial Schema
-- Migration: 00001_initial_schema.sql
-- Description: Creates all core tables, indexes, and constraints
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url  text,
  tier        text not null default 'free'
                check (tier in ('free', 'pro', 'team')),
  stripe_customer_id text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table profiles is 'User profile extending Supabase auth.users';

-- ============================================================================
-- 2. PROJECTS
-- ============================================================================
create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  name        text not null,
  description text,
  color       text,
  icon        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table projects is 'Organizational folders for grouping QR codes';

-- ============================================================================
-- 3. QR CODES
-- ============================================================================
create table qr_codes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles (id) on delete cascade,
  project_id          uuid references projects (id) on delete set null,
  name                text not null,
  type                text not null
                        check (type in ('static', 'dynamic')),
  content_type        text not null,
  destination_url     text,
  static_data         jsonb,
  short_code          text unique,
  is_active           boolean not null default true,
  expires_at          timestamptz,
  password_hash       text,

  -- Analytics & tracking
  tracking_enabled    boolean not null default false,
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_term            text,
  utm_content         text,
  ga4_measurement_id  text,
  meta_pixel_id       text,
  webhook_url         text,

  -- Appearance
  style               jsonb not null default '{}',

  -- Organization
  tags                text[] not null default '{}',
  is_favorited        boolean not null default false,

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table qr_codes is 'Core QR code entity supporting both static and dynamic types';

-- ============================================================================
-- 4. SCAN EVENTS
-- ============================================================================
create table scan_events (
  id            bigint generated always as identity primary key,
  qr_code_id   uuid not null references qr_codes (id) on delete cascade,
  scanned_at    timestamptz not null default now(),
  ip_address    inet,
  country       text,
  city          text,
  region        text,
  user_agent    text,
  device_type   text,
  os            text,
  browser       text,
  referrer      text,
  is_unique     boolean not null default true
);

comment on table scan_events is 'Analytics events recorded each time a QR code is scanned';

-- ============================================================================
-- 5. BUSINESS CARDS
-- ============================================================================
create table business_cards (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles (id) on delete cascade,
  qr_code_id        uuid references qr_codes (id) on delete set null,
  slug              text unique not null,
  first_name        text not null,
  last_name         text not null,
  pronouns          text,
  title             text,
  company           text,
  department        text,
  bio               text,
  phones            jsonb not null default '[]',
  emails            jsonb not null default '[]',
  websites          jsonb not null default '[]',
  address           jsonb,
  social_links      jsonb not null default '[]',
  headshot_url      text,
  company_logo_url  text,
  theme             jsonb not null default '{}',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table business_cards is 'Digital business cards with vCard generation support';

-- ============================================================================
-- 6. CARD VIEW EVENTS
-- ============================================================================
create table card_view_events (
  id            bigint generated always as identity primary key,
  card_id       uuid not null references business_cards (id) on delete cascade,
  event_type    text not null,
  event_data    jsonb,
  viewed_at     timestamptz not null default now(),
  ip_address    inet,
  country       text,
  city          text,
  user_agent    text,
  device_type   text,
  is_unique     boolean not null default true
);

comment on table card_view_events is 'Analytics events for digital business card interactions';

-- ============================================================================
-- 7. STYLE TEMPLATES
-- ============================================================================
create table style_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles (id) on delete cascade,
  name        text not null,
  category    text,
  style       jsonb not null,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table style_templates is 'Reusable QR code styling templates (system-wide or per-user)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- QR codes
create index idx_qr_codes_user       on qr_codes (user_id);
create index idx_qr_codes_project    on qr_codes (project_id);
create index idx_qr_codes_short_code on qr_codes (short_code);

-- Scan events
create index idx_scan_events_qr_code    on scan_events (qr_code_id);
create index idx_scan_events_scanned_at on scan_events (scanned_at);

-- Business cards
create index idx_business_cards_slug on business_cards (slug);
create index idx_business_cards_user on business_cards (user_id);

-- Card view events
create index idx_card_view_events_card on card_view_events (card_id);
