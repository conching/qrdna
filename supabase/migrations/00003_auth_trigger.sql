-- ============================================================================
-- QR DNA: Auth Trigger & Utility Functions
-- Migration: 00003_auth_trigger.sql
-- Description: Auto-create profile on signup, auto-update updated_at columns
-- ============================================================================

-- ============================================================================
-- 1. Handle new user signup -> create profile row
-- ============================================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- 2. Generic updated_at trigger function
-- ============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables that have the column
create trigger set_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on projects
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on qr_codes
  for each row execute function update_updated_at_column();

create trigger set_updated_at
  before update on business_cards
  for each row execute function update_updated_at_column();
