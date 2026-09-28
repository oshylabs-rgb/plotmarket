-- Plotmarket migration 0008: stop exposing every user's contact details.
--
-- Before this, profiles_public_read (0001) let anyone holding the public anon
-- key list every account's email address, phone number and CAC number,
-- buyers included. The only profiles the public site needs are those of
-- sellers with a live listing, whose name, phone and email are shown on that
-- listing on purpose. Nigeria Data Protection Act 2023, s.24 and s.39.
--
-- Profiles are now readable by:
--   anyone              sellers with at least one approved listing
--   the signed-in user  their own profile
--   the signed-in user  the other party to an enquiry they sent or received
--   admins              everyone (admin_full_access_profiles, 0003)
--
-- Also from the Supabase security advisor:
--   * plan_listing_limit gets a fixed search_path
--   * handle_new_user (the sign-up trigger) is no longer callable through
--     the API; triggers do not need EXECUTE, so sign-up is unaffected
--
-- Safe to re-run. Rollback block at the end.

drop policy if exists "profiles_public_read" on public.profiles;

drop policy if exists "profiles_read_live_sellers" on public.profiles;
create policy "profiles_read_live_sellers"
  on public.profiles for select to anon, authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.user_id = profiles.id and p.status = 'approved'
    )
  );

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_read_enquiry_parties" on public.profiles;
create policy "profiles_read_enquiry_parties"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.inquiries i
      where (i.sender_id = profiles.id and i.receiver_id = auth.uid())
         or (i.receiver_id = profiles.id and i.sender_id = auth.uid())
    )
  );

alter function public.plan_listing_limit(text) set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------
-- Rollback (manual; reopens the exposure):
--
--   drop policy if exists "profiles_read_live_sellers" on public.profiles;
--   drop policy if exists "profiles_read_own" on public.profiles;
--   drop policy if exists "profiles_read_enquiry_parties" on public.profiles;
--   create policy "profiles_public_read" on public.profiles for select using (true);
--   grant execute on function public.handle_new_user() to public;
-- ---------------------------------------------------------------
