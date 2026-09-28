-- Plotmarket migration 0007: seller plans, enforced in the database.
--
-- Plans (owner approved 27 Sep 2026, docs/PLAN_AUDIT_2026-09-27.md section F):
--
--   Free Starter      account_type 'basic'         3 active listings
--   Founding Developer Pilot  (pilots table)       20 active listings, one
--                     estate, 30 days from admin activation, invitation only
--   Business          account_type 'professional'  100 active listings while a
--                     paid subscription is in date (₦35,000 per 30 days,
--                     one-off Paystack charge, never renewed automatically)
--   Legacy Starter / Business (20 / 500) are honoured until their end date.
--   Enterprise / admin: no limit, set by hand.
--
-- "Active" means status pending or approved. Rejected, sold and paused
-- listings do not count.
--
-- Entitlements are computed from facts (in-date subscription rows, active
-- pilot rows), never from profiles.account_type alone, which is only a display
-- cache. Every write path (dashboard, API, duplicate, import, bulk upload)
-- goes through the properties table, so the limit trigger here covers all of
-- them; client-side checks are for messages only.
--
-- When an allowance shrinks (pilot or subscription ends) nothing is deleted:
-- the earliest published listings up to the new allowance stay live and the
-- rest become 'paused' (hidden, enquiries blocked, data kept). Owners can swap
-- which ones are live; upgrading restores them.
--
-- Requires 0005 and 0006. Safe to re-run. Rollback block at the end.

do $$
begin
  if to_regprocedure('public.guard_property_privileged_columns()') is null then
    raise exception 'Apply migration 0005 before 0007';
  end if;
end $$;

-- ---------------------------------------------------------------
-- 1. Listing columns
-- ---------------------------------------------------------------
alter table public.properties
  add column if not exists is_demo       boolean not null default false,
  add column if not exists published_at  timestamptz,
  add column if not exists paused_from   public.property_status,
  add column if not exists paused_reason text,
  add column if not exists estate_name   text,
  add column if not exists pilot_id      uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_paused_reason_check') then
    alter table public.properties add constraint properties_paused_reason_check
      check (paused_reason is null or paused_reason in ('plan_limit', 'owner'));
  end if;
end $$;

comment on column public.properties.is_demo is
  'Sample listing created by Plotmarket. Labelled "Demo listing, not for sale", kept out of the home page, sitemap and area pages, and cannot receive enquiries.';
comment on column public.properties.published_at is
  'First time the listing was approved. Decides which listings stay live when an allowance shrinks (earliest published first).';
comment on column public.properties.paused_from is
  'Status to restore when a paused listing is brought back.';
comment on column public.properties.estate_name is
  'Estate or project the listing belongs to. Fixed to the nominated estate for Founding Developer Pilot listings.';

-- Backfill. Demo rows are identified by the "(Demo)" suffix the seed gives
-- every demo title. Published date is approximated by the creation date for
-- listings that are already live, because the approval time was never stored.
update public.properties set is_demo = true
  where title ilike '%(demo)%' and not is_demo;
update public.properties set published_at = created_at
  where status in ('approved', 'sold') and published_at is null;

create index if not exists properties_user_active_idx
  on public.properties (user_id, status);

-- ---------------------------------------------------------------
-- 2. Founding Developer Pilot
-- ---------------------------------------------------------------
create table if not exists public.pilots (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles (id) on delete cascade,
  status                 text not null default 'requested',
  company_name           text not null,
  cac_number             text not null,
  project_name           text not null,
  project_state          text not null,
  project_area           text,
  terms_accepted_at      timestamptz not null default now(),
  requested_at           timestamptz not null default now(),
  decided_at             timestamptz,
  decided_by             uuid references public.profiles (id) on delete set null,
  activated_at           timestamptz,
  ends_at                timestamptz,
  setup_session_at       timestamptz,
  expiry_warning_sent_at timestamptz,
  admin_notes            text,
  created_at             timestamptz not null default now(),
  constraint pilots_status_check
    check (status in ('requested', 'active', 'expired', 'rejected', 'revoked')),
  constraint pilots_fields_present
    check (btrim(company_name) <> '' and btrim(cac_number) <> ''
           and btrim(project_name) <> '' and btrim(project_state) <> ''),
  constraint pilots_active_has_dates
    check (status <> 'active' or (activated_at is not null and ends_at is not null))
);

comment on table public.pilots is
  'Founding Developer Pilot requests and grants. One per account and one per CAC number, ever, unless rejected. Only admins activate.';

-- One pilot per account and per company, whatever its state, unless the
-- request was rejected. A new sign up cannot restart the clock because the
-- CAC number is the same.
create unique index if not exists pilots_one_per_account
  on public.pilots (user_id) where status <> 'rejected';
create unique index if not exists pilots_one_per_company
  on public.pilots (upper(regexp_replace(cac_number, '[^A-Za-z0-9]', '', 'g')))
  where status <> 'rejected';
create index if not exists pilots_active_ends_idx
  on public.pilots (ends_at) where status = 'active';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_pilot_id_fkey') then
    alter table public.properties add constraint properties_pilot_id_fkey
      foreign key (pilot_id) references public.pilots (id) on delete set null;
  end if;
end $$;

alter table public.pilots enable row level security;
grant select, insert, update, delete on public.pilots to authenticated, service_role;

drop policy if exists "pilots_owner_read" on public.pilots;
create policy "pilots_owner_read"
  on public.pilots for select to authenticated using (auth.uid() = user_id);

drop policy if exists "pilots_owner_request" on public.pilots;
create policy "pilots_owner_request"
  on public.pilots for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "admin_full_access_pilots" on public.pilots;
create policy "admin_full_access_pilots"
  on public.pilots for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.guard_pilot()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    -- A seller can only ask. Every decision field is reset.
    new.status                 := 'requested';
    new.requested_at           := now();
    new.terms_accepted_at      := now();
    new.decided_at             := null;
    new.decided_by             := null;
    new.activated_at           := null;
    new.ends_at                := null;
    new.setup_session_at       := null;
    new.expiry_warning_sent_at := null;
    new.admin_notes            := null;
    return new;
  end if;

  -- Activation starts the 30 day clock, unless an admin set an end date
  -- explicitly (for example honouring an earlier written offer).
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    new.activated_at := coalesce(new.activated_at, now());
    new.ends_at      := coalesce(new.ends_at, new.activated_at + interval '30 days');
  end if;

  if (tg_op = 'INSERT' and new.status <> 'requested')
     or (tg_op = 'UPDATE' and new.status is distinct from old.status
         and new.status in ('active', 'rejected', 'revoked')) then
    new.decided_at := now();
    new.decided_by := coalesce(auth.uid(), new.decided_by);
  end if;

  return new;
end
$fn$;

drop trigger if exists guard_pilot on public.pilots;
create trigger guard_pilot
  before insert or update on public.pilots
  for each row execute function public.guard_pilot();

-- ---------------------------------------------------------------
-- 3. Plan limits and plan status (the single source of truth)
-- ---------------------------------------------------------------
-- Keep in step with src/constants/plans.ts. A unit test compares the two.
create or replace function public.plan_listing_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'basic'        then 3
    when 'pilot'        then 20
    when 'professional' then 100
    when 'starter'      then 20   -- legacy, honoured to end date
    when 'business'     then 500  -- legacy, honoured to end date
    else 3
  end
$$;

-- Plan status at a given instant. p_at exists so tests can check exact
-- boundaries; everything else calls plan_status().
create or replace function public.plan_status_at(p_user uuid, p_at timestamptz)
returns table (
  plan                text,
  max_active          int,     -- null means no limit
  active_count        int,
  paused_count        int,
  paid_plan           text,
  paid_until          timestamptz,
  pilot_id            uuid,
  pilot_status        text,
  pilot_ends_at       timestamptz,
  pilot_project_name  text,
  pilot_project_state text
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_profile public.profiles%rowtype;
  v_sub     record;
  v_pilot   record;
  v_latest  record;
begin
  -- API callers may only read their own status. Admins, the service role
  -- and the database itself may read anyone's.
  if coalesce(current_setting('role', true), 'none') in ('anon', 'authenticated')
     and p_user is distinct from auth.uid() and not public.is_admin() then
    raise exception 'You can only read your own plan' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = p_user;
  if not found then
    return;
  end if;

  select count(*) filter (where p.status in ('pending', 'approved')),
         count(*) filter (where p.status = 'paused')
    into active_count, paused_count
    from public.properties p where p.user_id = p_user;

  select s.plan::text as plan, s.end_date into v_sub
    from public.subscriptions s
   where s.user_id = p_user and s.status = 'active'
     and s.start_date <= p_at and s.end_date > p_at
   order by public.plan_listing_limit(s.plan::text) desc, s.end_date desc
   limit 1;

  select pl.* into v_pilot
    from public.pilots pl
   where pl.user_id = p_user and pl.status = 'active'
     and pl.activated_at <= p_at and pl.ends_at > p_at
   limit 1;

  -- Most recent pilot of any state, for display.
  select pl.id, pl.status, pl.ends_at, pl.project_name, pl.project_state into v_latest
    from public.pilots pl where pl.user_id = p_user
   order by pl.created_at desc limit 1;

  if v_sub.plan is not null then
    paid_plan  := v_sub.plan;
    paid_until := v_sub.end_date;
  end if;

  if v_latest.id is not null then
    pilot_id            := v_latest.id;
    pilot_status        := case when v_latest.status = 'active' and v_pilot.id is null
                                then 'expired' else v_latest.status end;
    pilot_ends_at       := v_latest.ends_at;
    pilot_project_name  := v_latest.project_name;
    pilot_project_state := v_latest.project_state;
  end if;

  if v_profile.role = 'admin' or v_profile.account_type = 'enterprise' then
    plan := 'enterprise';
    max_active := null;
  elsif v_pilot.id is not null
        and (v_sub.plan is null or public.plan_listing_limit(v_sub.plan) < public.plan_listing_limit('pilot')) then
    plan := 'pilot';
    max_active := public.plan_listing_limit('pilot');
  elsif v_sub.plan is not null then
    plan := v_sub.plan;
    max_active := public.plan_listing_limit(v_sub.plan);
  else
    plan := 'basic';
    max_active := public.plan_listing_limit('basic');
  end if;

  return next;
end
$fn$;

create or replace function public.plan_status(p_user uuid default auth.uid())
returns table (
  plan text, max_active int, active_count int, paused_count int,
  paid_plan text, paid_until timestamptz,
  pilot_id uuid, pilot_status text, pilot_ends_at timestamptz,
  pilot_project_name text, pilot_project_state text
)
language sql
stable
security definer
set search_path = public
as $$ select * from public.plan_status_at(p_user, now()) $$;

-- Functions are executable by PUBLIC unless revoked; the checks inside are
-- a second line, not the only one.
revoke execute on function public.plan_status_at(uuid, timestamptz) from public, anon;
revoke execute on function public.plan_status(uuid) from public, anon;
grant execute on function public.plan_status_at(uuid, timestamptz) to authenticated, service_role;
grant execute on function public.plan_status(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------
-- 4. Owner rules on listings (replaces the 0005 version)
-- ---------------------------------------------------------------
create or replace function public.guard_property_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $fn$
declare
  content_keys text[] := array['status', 'paused_from', 'paused_reason'];
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status        := 'pending';
    new.is_featured   := false;
    new.is_verified   := false;
    new.is_demo       := false;
    new.created_at    := now();
    new.published_at  := null;
    new.paused_from   := null;
    new.paused_reason := null;
    new.pilot_id      := null;  -- set by the allowance trigger for pilot listings
    return new;
  end if;

  if new.id           is distinct from old.id
  or new.user_id      is distinct from old.user_id
  or new.is_featured  is distinct from old.is_featured
  or new.is_verified  is distinct from old.is_verified
  or new.is_demo      is distinct from old.is_demo
  or new.created_at   is distinct from old.created_at
  or new.published_at is distinct from old.published_at
  or new.pilot_id     is distinct from old.pilot_id then
    raise exception 'Only an admin can change the owner, featured flag, verification, demo flag or dates of a listing'
      using errcode = '42501';
  end if;

  if old.pilot_id is not null
     and (new.state is distinct from old.state or new.estate_name is distinct from old.estate_name) then
    raise exception 'PILOT_SCOPE: a Founding Developer Pilot listing stays in its nominated estate'
      using errcode = '42501';
  end if;

  -- Pause bookkeeping belongs to the transitions below, never to the client.
  new.paused_from   := old.paused_from;
  new.paused_reason := old.paused_reason;

  if new.status is distinct from old.status then
    if old.status = 'approved' and new.status = 'sold' then
      null;
    elsif old.status in ('pending', 'approved') and new.status = 'paused' then
      new.paused_from   := old.status;
      new.paused_reason := 'owner';
    elsif old.status = 'paused' and old.paused_from is not null and new.status = old.paused_from then
      -- Restore. The allowance trigger decides whether there is room.
      new.paused_from   := null;
      new.paused_reason := null;
    else
      raise exception 'Only an admin can change the review status of a listing'
        using errcode = '42501';
    end if;
  end if;

  -- Moderation approved the old content, not this. Any content change that
  -- would leave the listing live sends it back to review.
  if new.status = 'approved'
     and (to_jsonb(new) - content_keys) is distinct from (to_jsonb(old) - content_keys) then
    new.status := 'pending';
  end if;

  return new;
end
$fn$;

-- ---------------------------------------------------------------
-- 5. Allowance and pilot scope on every path that makes a listing active
-- ---------------------------------------------------------------
create or replace function public.enforce_listing_allowance()
returns trigger
language plpgsql
set search_path = public
as $fn$
declare
  v record;
  becoming_active boolean;
begin
  -- The database owner (migrations, SQL editor, the expiry job) and admins
  -- resolving exceptions are not limited. Everyone else is, including the
  -- service role, so a future import job cannot bypass the plan.
  if current_user in ('postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  becoming_active := new.status in ('pending', 'approved')
    and (tg_op = 'INSERT' or old.status not in ('pending', 'approved'));
  if not becoming_active then
    return new;
  end if;

  -- Serialise per seller so two simultaneous saves cannot both take the
  -- last slot.
  perform pg_advisory_xact_lock(hashtextextended('listing_allowance:' || new.user_id::text, 0));

  select * into v from public.plan_status_at(new.user_id, now());

  if v.max_active is not null and v.active_count >= v.max_active then
    raise exception 'LISTING_LIMIT: your plan allows % active listings and you have %.', v.max_active, v.active_count
      using errcode = 'P0001',
            hint = 'Pause or mark sold a listing you no longer need, or upgrade.';
  end if;

  if v.plan = 'pilot' then
    if new.state is distinct from v.pilot_project_state then
      raise exception 'PILOT_SCOPE: pilot listings must be in % (the nominated estate is %).', v.pilot_project_state, v.pilot_project_name
        using errcode = 'P0001';
    end if;
    if new.estate_name is not null and btrim(new.estate_name) <> ''
       and lower(btrim(new.estate_name)) <> lower(btrim(v.pilot_project_name)) then
      raise exception 'PILOT_SCOPE: pilot listings must be in the nominated estate, %.', v.pilot_project_name
        using errcode = 'P0001';
    end if;
    new.estate_name := v.pilot_project_name;
    new.pilot_id    := v.pilot_id;
  end if;

  return new;
end
$fn$;

-- Trigger names decide firing order: guard_ (g) runs before listing_ (l),
-- so the allowance check sees the status the guard forced.
drop trigger if exists listing_allowance on public.properties;
create trigger listing_allowance
  before insert or update on public.properties
  for each row execute function public.enforce_listing_allowance();

create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if new.status = 'approved' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end
$fn$;

drop trigger if exists stamp_published_at on public.properties;
create trigger stamp_published_at
  before insert or update on public.properties
  for each row execute function public.stamp_published_at();

-- ---------------------------------------------------------------
-- 6. Fit an account to its allowance: pause the excess, or restore
--    plan-paused listings when there is room again.
-- ---------------------------------------------------------------
create or replace function public.apply_allowance(p_user uuid, p_at timestamptz default now())
returns table (paused int, restored int)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v record;
  n_paused int := 0;
  n_restored int := 0;
  free_slots int;
begin
  if coalesce(current_setting('role', true), 'none') in ('anon', 'authenticated')
     and p_user is distinct from auth.uid() and not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('listing_allowance:' || p_user::text, 0));
  select * into v from public.plan_status_at(p_user, p_at);
  if not found then
    return query select 0, 0;
    return;
  end if;

  if v.max_active is not null and v.active_count > v.max_active then
    -- Keep the earliest published live listings, then the oldest pending
    -- ones. Pause the rest.
    with ranked as (
      select p.id,
             row_number() over (
               order by (p.status = 'approved') desc, p.published_at asc nulls last,
                        p.created_at asc, p.id
             ) as rn
        from public.properties p
       where p.user_id = p_user and p.status in ('pending', 'approved')
    )
    update public.properties p
       set paused_from = p.status, paused_reason = 'plan_limit', status = 'paused'
      from ranked r
     where p.id = r.id and r.rn > v.max_active;
    get diagnostics n_paused = row_count;
  end if;

  free_slots := case when v.max_active is null then 2147483647
                     else v.max_active - (v.active_count - n_paused) end;
  if free_slots > 0 then
    with candidates as (
      select p.id
        from public.properties p
       where p.user_id = p_user and p.status = 'paused' and p.paused_reason = 'plan_limit'
         -- Under a pilot, only the estate's own listings come back.
         and (v.plan <> 'pilot' or p.pilot_id = v.pilot_id)
       order by (p.paused_from = 'approved') desc, p.published_at asc nulls last,
                p.created_at asc, p.id
       limit free_slots
    )
    update public.properties p
       set status = p.paused_from, paused_from = null, paused_reason = null
     where p.id in (select id from candidates);
    get diagnostics n_restored = row_count;
  end if;

  return query select n_paused, n_restored;
end
$fn$;

revoke execute on function public.apply_allowance(uuid, timestamptz) from public, anon;
grant execute on function public.apply_allowance(uuid, timestamptz) to authenticated, service_role;

-- ---------------------------------------------------------------
-- 7. Expiry job. Runs on a schedule, so a pilot or paid period ends
--    even if the seller never logs in again. Idempotent.
-- ---------------------------------------------------------------
create or replace function public.run_plan_expiry(p_at timestamptz default now())
returns table (user_id uuid, reason text, paused int)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  r record;
  a record;
begin
  if coalesce(current_setting('role', true), 'none') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  for r in
    with ended_pilots as (
      update public.pilots pl set status = 'expired'
       where pl.status = 'active' and pl.ends_at <= p_at
      returning pl.user_id, 'pilot_ended'::text as why
    ), ended_subs as (
      update public.subscriptions s set status = 'expired'
       where s.status = 'active' and s.end_date <= p_at
      returning s.user_id, 'paid_period_ended'::text as why
    )
    select distinct on (x.user_id) x.user_id, x.why
      from (select * from ended_pilots union all select * from ended_subs) x
  loop
    -- Keep the display cache honest. Admin-set enterprise accounts are left alone.
    update public.profiles pr
       set account_type = coalesce((
             select s.plan from public.subscriptions s
              where s.user_id = r.user_id and s.status = 'active' and s.end_date > p_at
              order by public.plan_listing_limit(s.plan::text) desc limit 1
           ), 'basic')
     where pr.id = r.user_id and pr.account_type <> 'enterprise' and pr.role <> 'admin';

    select * into a from public.apply_allowance(r.user_id, p_at);
    user_id := r.user_id;
    reason  := r.why;
    paused  := a.paused;
    return next;
  end loop;
end
$fn$;

revoke execute on function public.run_plan_expiry(timestamptz) from public, anon, authenticated;
grant execute on function public.run_plan_expiry(timestamptz) to service_role;

-- ---------------------------------------------------------------
-- 8. Public helpers
-- ---------------------------------------------------------------
-- Lets the public listing page say "no longer listed" for a paused or sold
-- listing instead of a bare 404, without exposing the row.
create or replace function public.listing_availability(p_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when status = 'approved' then 'live' else 'unavailable' end
    from public.properties where id = p_id
$$;
grant execute on function public.listing_availability(uuid) to anon, authenticated, service_role;

-- Admin view of every account's plan. Admins only.
create or replace function public.admin_plan_overview()
returns table (
  user_id uuid, email text, full_name text, user_type text, account_type text,
  plan text, max_active int, active_count int, paused_count int,
  paid_until timestamptz, pilot_status text, pilot_ends_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if coalesce(current_setting('role', true), 'none') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return query
    select pr.id, pr.email, pr.full_name, pr.user_type::text, pr.account_type::text,
           s.plan, s.max_active, s.active_count, s.paused_count,
           s.paid_until, s.pilot_status, s.pilot_ends_at
      from public.profiles pr
      cross join lateral public.plan_status_at(pr.id, now()) s
     order by pr.created_at desc;
end
$fn$;
revoke execute on function public.admin_plan_overview() from public, anon;
grant execute on function public.admin_plan_overview() to authenticated, service_role;

-- ---------------------------------------------------------------
-- 9. Enquiries: never on demo listings
-- ---------------------------------------------------------------
drop policy if exists "inquiries_sender_insert" on public.inquiries;
create policy "inquiries_sender_insert"
  on public.inquiries for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.status = 'approved'
        and not p.is_demo
        and p.user_id = receiver_id
    )
  );

-- ---------------------------------------------------------------
-- 10. Schedule the expiry job every 15 minutes where pg_cron exists.
--     The Vercel cron route calls the same function daily as a fallback.
-- ---------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('plotmarket-plan-expiry', '*/15 * * * *', 'select public.run_plan_expiry()');
  else
    raise notice 'pg_cron is not available here. Plan expiry relies on /api/cron/plan-expiry.';
  end if;
end $$;

-- ---------------------------------------------------------------
-- Rollback (manual). Does not delete listings; paused ones are restored.
--
--   select cron.unschedule('plotmarket-plan-expiry');  -- if pg_cron
--   update public.properties set status = paused_from, paused_from = null, paused_reason = null
--     where status = 'paused' and paused_from is not null;
--   drop trigger if exists listing_allowance on public.properties;
--   drop trigger if exists stamp_published_at on public.properties;
--   drop function if exists public.enforce_listing_allowance();
--   drop function if exists public.stamp_published_at();
--   drop function if exists public.run_plan_expiry(timestamptz);
--   drop function if exists public.apply_allowance(uuid, timestamptz);
--   drop function if exists public.admin_plan_overview();
--   drop function if exists public.listing_availability(uuid);
--   drop function if exists public.plan_status(uuid);
--   drop function if exists public.plan_status_at(uuid, timestamptz);
--   drop function if exists public.plan_listing_limit(text);
--   then re-run migration 0005 to restore its guard and inquiries policy.
--   The pilots table and the new columns can stay; they are inert without
--   the functions. Drop them only after exporting the pilots table.
-- ---------------------------------------------------------------
