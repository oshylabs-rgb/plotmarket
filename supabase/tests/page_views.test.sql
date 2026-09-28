-- Visit count tests for migration 0009.
-- Run with: npm run test:db

\ir helpers.sql

\set VADMIN '''30000000-0000-0000-0000-0000000000a1'''
\set VUSER  '''30000000-0000-0000-0000-0000000000b2'''

insert into auth.users (id, email, raw_user_meta_data) values
  (:VADMIN, 'admin@v', '{"full_name":"Admin"}'),
  (:VUSER,  'user@v',  '{"full_name":"User"}');
update public.profiles set role = 'admin' where id = :VADMIN;

select t.allowed('the server route writes a page view with the service role', 'service_role', null,
  $s$insert into public.page_views (path, referrer_host, utm_source, utm_medium, utm_campaign, country, device)
     values ('/pricing', 'wa.me', 'whatsapp', 'dm', 'pilot-oct', 'NG', 'mobile'),
            ('/pricing', null, null, null, null, 'NG', 'desktop'),
            ('/', 'google.com', null, null, null, 'GB', 'mobile')$s$, 3);
insert into public.page_views (viewed_at, path) values (now() - interval '40 days', '/old');

select t.denied('the public cannot write page views', 'anon', null,
  $s$insert into public.page_views (path) values ('/spam')$s$);
select t.denied('signed in users cannot write page views', 'authenticated', :VUSER,
  $s$insert into public.page_views (path) values ('/spam')$s$);
select t.denied('the public cannot read page views', 'anon', null,
  $s$select * from public.page_views$s$);
select t.denied('signed in users cannot read page views', 'authenticated', :VUSER,
  $s$select * from public.page_views$s$);
select t.denied('not even admins read the raw table', 'authenticated', :VADMIN,
  $s$select * from public.page_views$s$);

select t.raises('rejects a path that is not a site path', 'service_role', null,
  $s$insert into public.page_views (path) values ('https://evil.example')$s$, '23514');
select t.raises('rejects a malformed country', 'service_role', null,
  $s$insert into public.page_views (path, country) values ('/', 'Nigeria')$s$, '23514');

select t.raises('the report refuses the public', 'anon', null,
  $s$select public.admin_traffic_summary(30)$s$, '42501');
select t.raises('the report refuses a non-admin', 'authenticated', :VUSER,
  $s$select public.admin_traffic_summary(30)$s$, '42501');

create temp table report as select public.admin_traffic_summary(30) r;
select t.allowed('an admin gets the report', 'authenticated', :VADMIN,
  $s$select public.admin_traffic_summary(30)$s$, 1);

select t.check('counts views in the window only', (select (r->>'views')::int = 3 from report));
select t.check('one row per day for 30 days', (select jsonb_array_length(r->'by_day') = 30 from report));
select t.check('top page is /pricing with 2 views',
  (select r->'top_paths'->0 = '{"key":"/pricing","views":2}'::jsonb from report));
select t.check('direct traffic is labelled',
  (select r->'referrers' @> '[{"key":"Direct or unknown","views":1}]'::jsonb from report));
select t.check('campaign tags are joined',
  (select r->'campaigns' = '[{"key":"whatsapp / dm / pilot-oct","views":1}]'::jsonb from report));
select t.check('countries counted', (select r->'countries'->0 = '{"key":"NG","views":2}'::jsonb from report));
select t.check('funnel includes sign ups in the window',
  (select (r->'funnel'->>'signups')::int >= 2 from report));
select t.check('funnel has every stage',
  (select r->'funnel' ?& array['signups','listings_created','listings_live','enquiries','pilot_requests','business_payments'] from report));
select t.check('a 400 day window includes the old view',
  (select (public.admin_traffic_summary(400)->>'views')::int = 4));

\o
\echo 'ALL PASSED'
