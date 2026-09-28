-- Profile privacy tests for migrations 0008 (rows) and 0010 (public columns).
-- Run with: npm run test:db

\ir helpers.sql

\set SELLER '''20000000-0000-0000-0000-0000000000a1'''
\set PENDING '''20000000-0000-0000-0000-0000000000b2'''
\set BUYER '''20000000-0000-0000-0000-0000000000c3'''
\set BUYER2 '''20000000-0000-0000-0000-0000000000d4'''
\set ADMIN '''20000000-0000-0000-0000-0000000000e5'''

insert into auth.users (id, email, raw_user_meta_data) values
  (:SELLER,  'live.seller@p',   '{"full_name":"Live Seller","phone":"0801"}'),
  (:PENDING, 'pending.seller@p','{"full_name":"Pending Seller","phone":"0802"}'),
  (:BUYER,   'buyer@p',         '{"full_name":"Buyer One","phone":"0803"}'),
  (:BUYER2,  'buyer2@p',        '{"full_name":"Buyer Two","phone":"0804"}'),
  (:ADMIN,   'admin@p',         '{"full_name":"Admin"}');
update public.profiles set role = 'admin' where id = :ADMIN;

insert into public.properties (id, user_id, title, type, listing_type, price, state, status) values
  ('20000000-0000-0000-0000-00000000f001', :SELLER,  'Live plot',    'land', 'sale', 1, 'Lagos', 'approved'),
  ('20000000-0000-0000-0000-00000000f002', :PENDING, 'Pending plot', 'land', 'sale', 1, 'Lagos', 'pending');

create function t.visible(api_role text, uid uuid, target uuid) returns int
language sql as $$
  select t.exec_as(api_role, uid, format('select id from public.profiles where id = %L', target))
$$;

select t.check('sign up still creates profiles although handle_new_user is not callable',
  (select count(*) = 5 from public.profiles where email like '%@p'));
select t.raises('handle_new_user cannot be called through the API', 'authenticated', :BUYER,
  $s$select public.handle_new_user()$s$, '42501');

select t.check('public can read a seller with a live listing', t.visible('anon', null, :SELLER) = 1);
select t.check('public cannot read a seller whose listing is not live', t.visible('anon', null, :PENDING) = 0);
select t.check('public cannot read a buyer', t.visible('anon', null, :BUYER) = 0);
select t.allowed('public listing of profiles returns only live sellers', 'anon', null,
  $s$select id from public.profiles where email like '%@p'$s$, 1);

select t.allowed('the public reads a live seller''s contact card', 'anon', null,
  format($s$select id, full_name, phone, email, user_type, company_name, avatar_url
            from public.profiles where id = %L$s$, :SELLER));
select t.raises('the public cannot read a seller''s CAC number', 'anon', null,
  format($s$select cac_number from public.profiles where id = %L$s$, :SELLER), '42501');
select t.raises('the public cannot read a seller''s role or plan', 'anon', null,
  format($s$select role, account_type from public.profiles where id = %L$s$, :SELLER), '42501');
select t.raises('the public cannot select every column', 'anon', null,
  $s$select * from public.profiles$s$, '42501');
select t.check('signed in users still read their own full row',
  (select t.exec_as('authenticated', :SELLER,
     format($s$select role, account_type, cac_number from public.profiles where id = %L$s$, :SELLER)) = 1));

select t.check('a buyer reads their own profile', t.visible('authenticated', :BUYER, :BUYER) = 1);
select t.check('a buyer cannot read another buyer', t.visible('authenticated', :BUYER, :BUYER2) = 0);
select t.check('a buyer can read a live seller', t.visible('authenticated', :BUYER, :SELLER) = 1);
select t.check('a seller cannot read a buyer who has not contacted them', t.visible('authenticated', :SELLER, :BUYER) = 0);

select t.allowed('buyer sends an enquiry', 'authenticated', :BUYER,
  format($s$insert into public.inquiries (property_id, sender_id, receiver_id, message)
            values ('20000000-0000-0000-0000-00000000f001', %L, %L, 'Is it available?')$s$, :BUYER, :SELLER));
select t.check('the seller can now read the buyer who enquired', t.visible('authenticated', :SELLER, :BUYER) = 1);
select t.check('but still not the other buyer', t.visible('authenticated', :SELLER, :BUYER2) = 0);
select t.allowed('the enquiries page query returns self, the enquirer and live sellers only', 'authenticated', :SELLER,
  $s$select id, full_name, email from public.profiles where email like '%@p'$s$, 2);

select t.check('admins still read everyone',
  (select t.exec_as('authenticated', :ADMIN, $s$select * from public.profiles where email like '%@p'$s$)) = 5);

select t.check('plan_listing_limit has a fixed search_path',
  (select proconfig::text like '%search_path=public%' from pg_proc where proname = 'plan_listing_limit'));

\o
\echo 'ALL PASSED'
