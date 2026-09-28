-- Security tests for migration 0005. Each check runs a statement the way
-- PostgREST would, as the anon, authenticated or service_role database role
-- with the caller's user id in the JWT claim, then asserts the outcome.
--
-- Run with: npm run test:db

\ir helpers.sql

-- ---------------------------------------------------------------
-- Fixtures, created as postgres the way sign up and the SQL editor do
-- ---------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'seller.a@test', '{"full_name":"Seller A","user_type":"agent"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'seller.b@test', '{"full_name":"Seller B"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'admin@test',    '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000d4', 'buyer@test',    '{"full_name":"Buyer"}');

update public.profiles set role = 'admin' where email = 'admin@test';

insert into public.properties (id, user_id, title, type, listing_type, price, state, status) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000000a1', 'A live',    'land', 'sale', 1000000, 'Lagos', 'approved'),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000a1', 'A pending', 'land', 'sale', 2000000, 'Lagos', 'pending');

\set a '''00000000-0000-0000-0000-0000000000a1'''
\set b '''00000000-0000-0000-0000-0000000000b2'''
\set admin '''00000000-0000-0000-0000-0000000000c3'''
\set buyer '''00000000-0000-0000-0000-0000000000d4'''

select t.check('sign up trigger still creates profiles with safe defaults',
  (select count(*) = 4 and bool_and(account_type = 'basic' and not is_verified) from public.profiles where email like '%@test')
  and (select user_type = 'agent' from public.profiles where email = 'seller.a@test'));

-- ---------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------
select t.allowed('owner edits own name, phone, company', 'authenticated', :a,
  $$update public.profiles set full_name = 'A2', phone = '0800', company_name = 'Co', cac_number = 'RC1'
    where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.denied('owner cannot make self admin', 'authenticated', :a,
  $$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.denied('owner cannot give self a paid plan', 'authenticated', :a,
  $$update public.profiles set account_type = 'enterprise' where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.denied('owner cannot verify self', 'authenticated', :a,
  $$update public.profiles set is_verified = true where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.denied('owner cannot change listed email', 'authenticated', :a,
  $$update public.profiles set email = 'someone@else' where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.denied('owner cannot change account type', 'authenticated', :a,
  $$update public.profiles set user_type = 'developer' where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.denied('user cannot edit another profile', 'authenticated', :b,
  $$update public.profiles set full_name = 'x' where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.denied('anon cannot edit profiles', 'anon', null,
  $$update public.profiles set role = 'admin'$$);
select t.allowed('admin can verify a user', 'authenticated', :admin,
  $$update public.profiles set is_verified = true where id = '00000000-0000-0000-0000-0000000000b2'$$);
select t.allowed('service role (Paystack webhook) can set a plan', 'service_role', null,
  $$update public.profiles set account_type = 'professional' where id = '00000000-0000-0000-0000-0000000000a1'$$);
select t.check('profile state after profile tests',
  (select role = 'user' and account_type = 'professional' and not is_verified and full_name = 'A2'
     from public.profiles where email = 'seller.a@test')
  and (select is_verified from public.profiles where email = 'seller.b@test'));

-- A client insert (profiles_owner_insert) cannot smuggle privileges in.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e5', 'late@test');
delete from public.profiles where id = '00000000-0000-0000-0000-0000000000e5';
select t.allowed('owner insert of own missing profile is allowed', 'authenticated',
  '00000000-0000-0000-0000-0000000000e5',
  $$insert into public.profiles (id, email, role, account_type, is_verified)
    values ('00000000-0000-0000-0000-0000000000e5', 'late@test', 'admin', 'enterprise', true)$$);
select t.check('but it lands with default role, plan and verification',
  (select role = 'user' and account_type = 'basic' and not is_verified
     from public.profiles where id = '00000000-0000-0000-0000-0000000000e5'));

-- ---------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------
select t.allowed('owner creates a listing', 'authenticated', :a,
  $$insert into public.properties (id, user_id, title, type, listing_type, price, state,
      status, is_featured, is_verified, created_at)
    values ('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000a1',
      'A new', 'land', 'sale', 5, 'Lagos', 'approved', true, true, '2099-01-01')$$);
select t.check('new listing is forced to pending, unfeatured, unverified, dated now',
  (select status = 'pending' and not is_featured and not is_verified and created_at <= now()
     from public.properties where id = '00000000-0000-0000-0000-00000000f003'));
select t.denied('owner cannot list under another user', 'authenticated', :a,
  $$insert into public.properties (user_id, title, type, listing_type, price, state)
    values ('00000000-0000-0000-0000-0000000000b2', 'x', 'land', 'sale', 1, 'Lagos')$$);
select t.denied('owner cannot approve own listing', 'authenticated', :a,
  $$update public.properties set status = 'approved' where id = '00000000-0000-0000-0000-00000000f002'$$);
select t.denied('owner cannot feature own listing', 'authenticated', :a,
  $$update public.properties set is_featured = true where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.denied('owner cannot verify own listing', 'authenticated', :a,
  $$update public.properties set is_verified = true where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.denied('owner cannot backdate or future date a listing', 'authenticated', :a,
  $$update public.properties set created_at = '2099-01-01' where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.denied('owner cannot hand a listing to another user', 'authenticated', :a,
  $$update public.properties set user_id = '00000000-0000-0000-0000-0000000000b2'
    where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.denied('other user cannot edit the listing', 'authenticated', :b,
  $$update public.properties set price = 1 where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.allowed('owner no-op save on a live listing', 'authenticated', :a,
  $$update public.properties set price = price where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.check('no-op save keeps it live',
  (select status = 'approved' from public.properties where id = '00000000-0000-0000-0000-00000000f001'));
select t.allowed('owner edits a live listing', 'authenticated', :a,
  $$update public.properties set price = 999 where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.check('edited live listing goes back to review',
  (select status = 'pending' and price = 999 from public.properties where id = '00000000-0000-0000-0000-00000000f001'));
select t.allowed('admin approves a listing', 'authenticated', :admin,
  $$update public.properties set status = 'approved' where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.allowed('admin features a listing', 'authenticated', :admin,
  $$update public.properties set is_featured = true where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.allowed('owner marks a live listing sold', 'authenticated', :a,
  $$update public.properties set status = 'sold' where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.denied('owner cannot relist a sold listing', 'authenticated', :a,
  $$update public.properties set status = 'approved' where id = '00000000-0000-0000-0000-00000000f001'$$);
select t.allowed('owner deletes own listing', 'authenticated', :a,
  $$delete from public.properties where id = '00000000-0000-0000-0000-00000000f003'$$);

-- ---------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------
select t.denied('owner cannot create an active subscription', 'authenticated', :a,
  $$insert into public.subscriptions (user_id, plan, amount, end_date, status)
    values ('00000000-0000-0000-0000-0000000000a1', 'enterprise', 0, '2099-01-01', 'active')$$);
select t.allowed('service role (Paystack) records a subscription', 'service_role', null,
  $$insert into public.subscriptions (id, user_id, plan, amount, end_date, status, paystack_reference)
    values ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000a1',
      'professional', 35000, now() + interval '30 days', 'active', 'ref_1')$$);
do $$
begin
  begin
    perform t.exec_as('service_role', null,
      $s$insert into public.subscriptions (user_id, plan, amount, end_date, paystack_reference)
         values ('00000000-0000-0000-0000-0000000000a1', 'professional', 35000, now(), 'ref_1')$s$);
    raise exception 'FAIL (was allowed): duplicate Paystack reference';
  exception when unique_violation then
    raise notice 'ok   duplicate Paystack reference is rejected (webhook retry cannot double grant)';
  end;
end $$;
select t.denied('owner cannot extend own subscription', 'authenticated', :a,
  $$update public.subscriptions set end_date = '2099-01-01'
    where id = '00000000-0000-0000-0000-00000000aa01'$$);
select t.denied('owner cannot change plan on own subscription', 'authenticated', :a,
  $$update public.subscriptions set plan = 'enterprise'
    where id = '00000000-0000-0000-0000-00000000aa01'$$);
select t.allowed('owner can read own subscription', 'authenticated', :a,
  $$select * from public.subscriptions$$);
select t.allowed('other user cannot read it', 'authenticated', :b,
  $$select * from public.subscriptions$$, 0);
select t.allowed('admin can amend a subscription', 'authenticated', :admin,
  $$update public.subscriptions set status = 'expired' where id = '00000000-0000-0000-0000-00000000aa01'$$);

-- ---------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------
update public.properties set status = 'approved' where id = '00000000-0000-0000-0000-00000000f002';
insert into public.properties (id, user_id, title, type, listing_type, price, state, status) values
  ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-0000000000b2', 'B pending', 'land', 'sale', 1, 'Lagos', 'pending');

select t.allowed('buyer enquires about a live listing', 'authenticated', :buyer,
  $$insert into public.inquiries (property_id, sender_id, receiver_id, message)
    values ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000d4',
      '00000000-0000-0000-0000-0000000000a1', 'Still available?')$$);
select t.denied('no enquiry about an unpublished listing', 'authenticated', :buyer,
  $$insert into public.inquiries (property_id, sender_id, receiver_id, message)
    values ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-0000000000d4',
      '00000000-0000-0000-0000-0000000000b2', 'hi')$$);
select t.denied('no enquiry about a sold listing', 'authenticated', :buyer,
  $$insert into public.inquiries (property_id, sender_id, receiver_id, message)
    values ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000000d4',
      '00000000-0000-0000-0000-0000000000a1', 'hi')$$);
select t.denied('enquiry cannot be redirected to someone other than the owner', 'authenticated', :buyer,
  $$insert into public.inquiries (property_id, sender_id, receiver_id, message)
    values ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000d4',
      '00000000-0000-0000-0000-0000000000b2', 'hi')$$);
select t.denied('enquiry cannot be sent in another user''s name', 'authenticated', :buyer,
  $$insert into public.inquiries (property_id, sender_id, receiver_id, message)
    values ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000b2',
      '00000000-0000-0000-0000-0000000000a1', 'hi')$$);
select t.denied('anon cannot enquire', 'anon', null,
  $$insert into public.inquiries (property_id, sender_id, receiver_id, message)
    values ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000d4',
      '00000000-0000-0000-0000-0000000000a1', 'hi')$$);

-- ---------------------------------------------------------------
-- public reads are unchanged
-- ---------------------------------------------------------------
select t.allowed('anon sees only approved listings', 'anon', null,
  $$select * from public.properties where user_id::text like '00000000-%'$$, 1);

\echo 'ALL PASSED'
