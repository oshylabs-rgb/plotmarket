-- Plotmarket migration 0001  (RECONSTRUCTION, not the original)
--
-- The original 0001 was never committed to this repository. This file was
-- rebuilt from src/types/database.ts plus the query patterns in the app, so it
-- reflects what the code REQUIRES, not necessarily what the live database
-- actually contains.
--
-- Use it for one of two things only:
--   a) standing up a fresh Plotmarket database, or
--   b) reading it as the reference for what should exist, when checking the
--      live project for a missing table, policy, trigger or bucket.
--
-- Every statement is guarded, so running it against the live database will
-- skip anything that already exists. That also means it will NOT correct an
-- object that exists but differs. It cannot reconcile drift. Check first.
--
-- Known uncertainty: the original may have used text columns with check
-- constraints where this file uses enum types. If the live database disagrees,
-- the live database is right and this file is wrong.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- 1. Enum types
-- ---------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type public.account_type as enum
      ('basic', 'starter', 'professional', 'business', 'enterprise');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_type') then
    create type public.user_type as enum ('individual', 'agent', 'developer');
  end if;
  if not exists (select 1 from pg_type where typname = 'property_type') then
    create type public.property_type as enum
      ('house', 'apartment', 'land', 'commercial', 'development');
  end if;
  if not exists (select 1 from pg_type where typname = 'listing_type') then
    create type public.listing_type as enum ('sale', 'rent', 'lease');
  end if;
  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type public.property_status as enum
      ('pending', 'approved', 'rejected', 'sold');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum
      ('active', 'expired', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'inquiry_status') then
    create type public.inquiry_status as enum ('unread', 'read', 'replied');
  end if;
end $$;

-- ---------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  phone         text,
  role          public.user_role       not null default 'user',
  account_type  public.account_type    not null default 'basic',
  user_type     public.user_type       not null default 'individual',
  is_verified   boolean                not null default false,
  avatar_url    text,
  company_name  text,
  cac_number    text,
  created_at    timestamptz            not null default now()
);

create table if not exists public.properties (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  title         text not null,
  description   text,
  type          public.property_type   not null,
  listing_type  public.listing_type    not null,
  price         numeric                not null,
  location      text,
  state         text                   not null,
  city          text,
  bedrooms      integer,
  bathrooms     integer,
  area          numeric,
  images        text[]                 not null default '{}',
  videos        text[]                 not null default '{}',
  features      text[]                 not null default '{}',
  status        public.property_status not null default 'pending',
  is_featured   boolean                not null default false,
  is_verified   boolean                not null default false,
  created_at    timestamptz            not null default now()
);
-- images_360, videos_360 and title_document are added by migration 0002.

create table if not exists public.subscriptions (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references public.profiles (id) on delete cascade,
  plan                       public.account_type not null,
  amount                     numeric             not null,
  start_date                 timestamptz         not null default now(),
  end_date                   timestamptz         not null,
  status                     public.subscription_status not null default 'active',
  paystack_reference         text,
  paystack_subscription_code text,
  paystack_customer_code     text,
  paystack_plan_code         text,
  created_at                 timestamptz         not null default now()
);

create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  message     text not null,
  status      public.inquiry_status not null default 'unread',
  created_at  timestamptz not null default now()
);

create index if not exists properties_user_idx    on public.properties (user_id);
create index if not exists properties_state_idx   on public.properties (state);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id, status);
create index if not exists inquiries_receiver_idx on public.inquiries (receiver_id, created_at desc);
create index if not exists inquiries_sender_idx   on public.inquiries (sender_id);
create unique index if not exists subscriptions_reference_idx
  on public.subscriptions (paystack_reference) where paystack_reference is not null;

-- ---------------------------------------------------------------
-- 3. Profile creation on sign up
--
--    The register page passes full_name, phone, user_type, company_name and
--    cac_number as signUp metadata and never inserts a profile row itself, so
--    this trigger is the ONLY thing that creates a profile. If it is missing
--    or out of date on the live database, agent and developer registrations
--    silently lose their company name and CAC number.
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id, email, full_name, phone, user_type, company_name, cac_number)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'user_type', '')::public.user_type,
      'individual'
    ),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'cac_number', '')
  )
  on conflict (id) do nothing;
  return new;
end $fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- 4. Row level security
-- ---------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.properties    enable row level security;
alter table public.subscriptions enable row level security;
alter table public.inquiries     enable row level security;

-- profiles: anyone may read, because the property detail page shows the
-- lister name, phone and email. Only the owner may write.
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
  on public.profiles for select using (true);

drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- properties: approved listings are public, owners see and manage their own.
drop policy if exists "properties_public_read_approved" on public.properties;
create policy "properties_public_read_approved"
  on public.properties for select using (status = 'approved');

drop policy if exists "properties_owner_read" on public.properties;
create policy "properties_owner_read"
  on public.properties for select to authenticated using (auth.uid() = user_id);

drop policy if exists "properties_owner_insert" on public.properties;
create policy "properties_owner_insert"
  on public.properties for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "properties_owner_update" on public.properties;
create policy "properties_owner_update"
  on public.properties for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "properties_owner_delete" on public.properties;
create policy "properties_owner_delete"
  on public.properties for delete to authenticated using (auth.uid() = user_id);

-- subscriptions: private to the owner. Paystack writes arrive through the
-- webhook using the service role key, which bypasses RLS.
drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read"
  on public.subscriptions for select to authenticated using (auth.uid() = user_id);

drop policy if exists "subscriptions_owner_insert" on public.subscriptions;
create policy "subscriptions_owner_insert"
  on public.subscriptions for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "subscriptions_owner_update" on public.subscriptions;
create policy "subscriptions_owner_update"
  on public.subscriptions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- inquiries: visible to both sides of the conversation.
drop policy if exists "inquiries_party_read" on public.inquiries;
create policy "inquiries_party_read"
  on public.inquiries for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "inquiries_sender_insert" on public.inquiries;
create policy "inquiries_sender_insert"
  on public.inquiries for insert to authenticated with check (auth.uid() = sender_id);

drop policy if exists "inquiries_receiver_update" on public.inquiries;
create policy "inquiries_receiver_update"
  on public.inquiries for update to authenticated
  using (auth.uid() = receiver_id) with check (auth.uid() = receiver_id);

-- ---------------------------------------------------------------
-- 5. Storage bucket for listing media
--    Policies for this bucket are created in migration 0002.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do nothing;
