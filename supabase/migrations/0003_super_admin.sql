-- Plotmarket migration 0003
-- Creates the master super admin account and gives role='admin' full read,
-- write, update and delete across every table.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR ONLY.
--
-- Before running, replace __SET_BEFORE_RUNNING__ below with the real password
-- in the editor buffer only. Do not save that value back into this file and do
-- not commit it, this repository is public. Rotate the password from the app
-- after the first login.
--
-- Safe to re-run: the account insert is a no-op if the email already exists.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- 1. The auth user
-- ---------------------------------------------------------------
do $$
declare
  v_user_id uuid;
  v_col text;
  v_email text := 'superadmin@plotmarket.ng';
  -- Set this to the real password immediately before running, then clear it
  -- again. Never commit a real value here, this file is in a public repo.
  v_password text := '__SET_BEFORE_RUNNING__';
begin
  if v_password = '__SET_BEFORE_RUNNING__' then
    raise exception
      'Set v_password to a real password before running migration 0003.';
  end if;

  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Plotmarket Super Admin"}'::jsonb,
      false
    );

    -- GoTrue needs a matching identity row or email sign-in fails.
    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  end if;

  -- GoTrue reads several auth.users token columns straight into Go strings,
  -- so a NULL in any of them breaks email sign-in with
  -- "converting NULL to string is unsupported". A row inserted by hand does
  -- not get the blank defaults GoTrue would have written, so blank them here.
  -- Column names differ between auth schema versions, hence the guard.
  foreach v_col in array array[
    'confirmation_token', 'recovery_token', 'email_change',
    'email_change_token_new', 'email_change_token_current',
    'phone_change', 'phone_change_token', 'reauthentication_token'
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'auth' and table_name = 'users' and column_name = v_col
    ) then
      execute format(
        'update auth.users set %I = coalesce(%I, %L) where id = %L',
        v_col, v_col, '', v_user_id
      );
    end if;
  end loop;

  -- ---------------------------------------------------------------
  -- 2. The application profile, carrying the admin role
  -- ---------------------------------------------------------------
  insert into public.profiles (
    id, email, full_name, phone, role, account_type, user_type, is_verified
  ) values (
    v_user_id,
    v_email,
    'Plotmarket Super Admin',
    null,
    'admin',
    'enterprise',
    'individual',
    true
  )
  on conflict (id) do update
    set role = 'admin',
        account_type = 'enterprise',
        is_verified = true,
        full_name = 'Plotmarket Super Admin';
end $$;

-- ---------------------------------------------------------------
-- 3. Admin override policies
--    A single helper keeps the policies short and avoids recursive
--    lookups inside the profiles policy itself.
-- ---------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- properties
drop policy if exists "admin_full_access_properties" on public.properties;
create policy "admin_full_access_properties"
  on public.properties for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles
drop policy if exists "admin_full_access_profiles" on public.profiles;
create policy "admin_full_access_profiles"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- subscriptions
drop policy if exists "admin_full_access_subscriptions" on public.subscriptions;
create policy "admin_full_access_subscriptions"
  on public.subscriptions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- inquiries
drop policy if exists "admin_full_access_inquiries" on public.inquiries;
create policy "admin_full_access_inquiries"
  on public.inquiries for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- storage: admins can remove any listing media
drop policy if exists "property_media_admin_all" on storage.objects;
create policy "property_media_admin_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'property-media' and public.is_admin())
  with check (bucket_id = 'property-media' and public.is_admin());

-- ---------------------------------------------------------------
-- 4. Confirm
-- ---------------------------------------------------------------
select p.email, p.role, p.account_type, u.email_confirmed_at is not null as confirmed
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
