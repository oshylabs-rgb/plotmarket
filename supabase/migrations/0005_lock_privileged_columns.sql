-- Plotmarket migration 0005
-- Closes three privilege holes left by the owner policies in 0001, plus one on
-- inquiries. Before this, any signed in user could, with one PostgREST call
-- using the public anon key:
--
--   1. profiles:      set their own role to 'admin', account_type to any paid
--                     plan, or is_verified to true.
--   2. properties:    set their own listing to 'approved' (skipping
--                     moderation), is_featured, is_verified, or a future
--                     created_at that pins it to the top of the feed.
--   3. subscriptions: insert or update an 'active' subscription for any plan
--                     without paying.
--   4. inquiries:     write an inquiry to any receiver about any listing,
--                     including unpublished ones.
--
-- Approach: the owner policies stay, because owners legitimately edit their
-- own rows. BEFORE triggers then refuse changes to privileged columns unless
-- the caller is an admin or a trusted server role. "Trusted" means the
-- statement is not running as the anon or authenticated API roles:
-- service_role (Paystack webhook and callback), postgres (SQL editor,
-- migrations) and security definer functions such as handle_new_user.
--
-- Safe to re-run. Does not touch any existing row.
--
-- Rollback: see the block at the end of this file.

-- The triggers below call public.is_admin() on every write. plpgsql does not
-- check that at create time, so without this guard a database missing 0003
-- would accept this migration and then fail every profile and listing save.
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Apply migration 0003 (public.is_admin) before 0005';
  end if;
  -- 0007 replaces guard_property_privileged_columns and the inquiries
  -- policy below with newer versions. Re-running 0005 after it would
  -- silently downgrade both, so refuse instead. This aborts the whole file
  -- when it runs as one request (SQL editor, apply_migration, db push);
  -- with psql use --single-transaction or ON_ERROR_STOP=1.
  if to_regprocedure('public.enforce_listing_allowance()') is not null then
    raise exception 'Migration 0007 is already applied; re-running 0005 would downgrade its listing guard. Skip 0005.';
  end if;
end $$;

-- ---------------------------------------------------------------
-- 1. profiles: only admins and server roles may change role, plan,
--    verification, account type, email or identity columns.
-- ---------------------------------------------------------------
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
-- Deliberately SECURITY INVOKER: current_user must be the API role that made
-- the request, not the function owner.
set search_path = public
as $fn$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Profiles are normally created by handle_new_user, which is trusted.
    -- A client insert (possible through profiles_owner_insert) gets the
    -- defaults, whatever it asked for.
    new.role         := 'user';
    new.account_type := 'basic';
    new.is_verified  := false;
    new.created_at   := now();
    return new;
  end if;

  if new.id           is distinct from old.id
  or new.email        is distinct from old.email
  or new.role         is distinct from old.role
  or new.account_type is distinct from old.account_type
  or new.user_type    is distinct from old.user_type
  or new.is_verified  is distinct from old.is_verified
  or new.created_at   is distinct from old.created_at then
    raise exception 'Only an admin can change role, plan, verification, account type or email'
      using errcode = '42501';
  end if;

  return new;
end
$fn$;

drop trigger if exists guard_profile_privileged_columns on public.profiles;
create trigger guard_profile_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ---------------------------------------------------------------
-- 2. properties: owners cannot approve, feature, verify or backdate their
--    own listings. Editing a live listing sends it back to review.
-- ---------------------------------------------------------------
create or replace function public.guard_property_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status      := 'pending';
    new.is_featured := false;
    new.is_verified := false;
    new.created_at  := now();
    return new;
  end if;

  if new.id          is distinct from old.id
  or new.user_id     is distinct from old.user_id
  or new.is_featured is distinct from old.is_featured
  or new.is_verified is distinct from old.is_verified
  or new.created_at  is distinct from old.created_at then
    raise exception 'Only an admin can change the owner, featured flag, verification or date of a listing'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    -- The one status change an owner may make: marking a live listing sold,
    -- which only removes it from public view.
    if not (old.status = 'approved' and new.status = 'sold') then
      raise exception 'Only an admin can change the review status of a listing'
        using errcode = '42501';
    end if;
  elsif old.status = 'approved'
    and (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    -- Content changed on a published listing. Moderation approved the old
    -- content, not this, so it goes back into the review queue.
    new.status := 'pending';
  end if;

  return new;
end
$fn$;

drop trigger if exists guard_property_privileged_columns on public.properties;
create trigger guard_property_privileged_columns
  before insert or update on public.properties
  for each row execute function public.guard_property_privileged_columns();

-- ---------------------------------------------------------------
-- 3. subscriptions: written only by the Paystack webhook and callback
--    (service role) and by admins. Owners keep read access.
-- ---------------------------------------------------------------
drop policy if exists "subscriptions_owner_insert" on public.subscriptions;
drop policy if exists "subscriptions_owner_update" on public.subscriptions;

-- ---------------------------------------------------------------
-- 4. inquiries: only about a published listing, and only to its owner.
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
        and p.user_id = receiver_id
    )
  );

-- ---------------------------------------------------------------
-- Rollback (run manually only if this migration breaks something):
--
--   drop trigger if exists guard_profile_privileged_columns on public.profiles;
--   drop trigger if exists guard_property_privileged_columns on public.properties;
--   drop function if exists public.guard_profile_privileged_columns();
--   drop function if exists public.guard_property_privileged_columns();
--   create policy "subscriptions_owner_insert" on public.subscriptions
--     for insert to authenticated with check (auth.uid() = user_id);
--   create policy "subscriptions_owner_update" on public.subscriptions
--     for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   drop policy if exists "inquiries_sender_insert" on public.inquiries;
--   create policy "inquiries_sender_insert" on public.inquiries
--     for insert to authenticated with check (auth.uid() = sender_id);
--
-- Rolling back reopens all four holes.
-- ---------------------------------------------------------------
