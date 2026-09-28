-- Plan, pilot and pause policy tests for migration 0007. Every check runs
-- as the API role a real request would use. Boundaries covered:
--   Free: listing #1, #3, #4, and the ways round it (status games, bulk,
--         duplicate, service role)
--   Pilot: request, one per account and company, activation, #1, #20, #21,
--          other estate, day before / exact / after expiry, expiry job,
--          pause policy, swap, upgrade restores, downgrade pauses again
--   Business: #100, #101, cancelled and lapsed subscriptions
--   Demo listings, enquiries and visibility of paused listings, admin.
--
-- Run with: npm run test:db

\ir helpers.sql

\set F   '''10000000-0000-0000-0000-0000000000f1'''
\set P   '''10000000-0000-0000-0000-0000000000d1'''
\set P2  '''10000000-0000-0000-0000-0000000000d2'''
\set B   '''10000000-0000-0000-0000-0000000000b1'''
\set L   '''10000000-0000-0000-0000-0000000000e1'''
\set ADM '''10000000-0000-0000-0000-0000000000a1'''
\set BUY '''10000000-0000-0000-0000-0000000000c1'''

insert into auth.users (id, email, raw_user_meta_data) values
  (:F,   'free@t',  '{"full_name":"Free Seller"}'),
  (:P,   'dev@t',   '{"full_name":"Dev","user_type":"developer","company_name":"Crest Homes","cac_number":"RC 100"}'),
  (:P2,  'dev2@t',  '{"full_name":"Dev again","user_type":"developer","company_name":"Crest Homes","cac_number":"rc-100"}'),
  (:B,   'biz@t',   '{"full_name":"Agency","user_type":"agent"}'),
  (:L,   'legacy@t','{"full_name":"Legacy"}'),
  (:ADM, 'adm@t',   '{"full_name":"Admin"}'),
  (:BUY, 'buy@t',   '{"full_name":"Buyer"}');
update public.profiles set role = 'admin' where id = :ADM;

-- SQL for one listing insert, as a client would send it.
create function t.listing(uid uuid, title text, state text default 'Lagos',
                          estate text default null, status text default 'pending')
returns text language sql as $$
  select format(
    'insert into public.properties (user_id, title, type, listing_type, price, state, estate_name, status)
     values (%L, %L, ''land'', ''sale'', 1000000, %L, %L, %L)', uid, title, state, estate, status)
$$;

create function t.active(uid uuid) returns int language sql as $$
  select count(*)::int from public.properties where user_id = uid and status in ('pending', 'approved')
$$;
create function t.paused(uid uuid) returns int language sql as $$
  select count(*)::int from public.properties where user_id = uid and status = 'paused'
$$;
create function t.plan(uid uuid, at timestamptz default now()) returns text language sql as $$
  select plan from public.plan_status_at(uid, at)
$$;

-- ===============================================================
-- Free Starter
-- ===============================================================
select t.check('new account is Free Starter with 3 active listings',
  (select plan = 'basic' and max_active = 3 and active_count = 0 from public.plan_status_at(:F, now())));
select t.allowed('free: listing #1', 'authenticated', :F, t.listing(:F, 'F1'));
select t.allowed('free: listing #2', 'authenticated', :F, t.listing(:F, 'F2'));
select t.allowed('free: listing #3', 'authenticated', :F, t.listing(:F, 'F3'));
select t.raises('free: listing #4 is refused', 'authenticated', :F, t.listing(:F, 'F4'), 'LISTING_LIMIT');
select t.raises('free: cannot dodge the limit by sending status rejected', 'authenticated', :F,
  t.listing(:F, 'F4', status => 'rejected'), 'LISTING_LIMIT');
select t.raises('free: duplicate of an existing listing is refused', 'authenticated', :F,
  format($s$insert into public.properties (user_id, title, type, listing_type, price, state)
            select user_id, title || ' copy', type, listing_type, price, state
              from public.properties where user_id = %L limit 1$s$, :F), 'LISTING_LIMIT');
select t.raises('free: import through the service role is refused too', 'service_role', null,
  t.listing(:F, 'F4 import'), 'LISTING_LIMIT');
select t.check('free: still exactly 3 active', t.active(:F) = 3);

-- Rejected and sold listings free a slot.
select t.allowed('admin rejects F1', 'authenticated', :ADM,
  format($s$update public.properties set status = 'rejected' where user_id = %L and title = 'F1'$s$, :F));
select t.allowed('free: a rejected listing does not count', 'authenticated', :F, t.listing(:F, 'F4'));
select t.allowed('admin approves F2, F3, F4', 'authenticated', :ADM,
  format($s$update public.properties set status = 'approved' where user_id = %L and title in ('F2','F3','F4')$s$, :F), 3);
select t.check('approval stamps published_at',
  (select bool_and(published_at is not null) from public.properties where user_id = :F and status = 'approved'));
select t.raises('free: bulk upload of 2 with no slot left is refused whole', 'authenticated', :F,
  format($s$insert into public.properties (user_id, title, type, listing_type, price, state)
            select %L, 'bulk ' || g, 'land', 'sale', 1, 'Lagos' from generate_series(1, 2) g$s$, :F), 'LISTING_LIMIT');
select t.check('free: nothing from the failed bulk upload was saved',
  (select count(*) = 0 from public.properties where user_id = :F and title like 'bulk%'));

-- Owner swap: pause one, list another, restore is refused while full.
select t.allowed('free: owner pauses F2', 'authenticated', :F,
  format($s$update public.properties set status = 'paused' where user_id = %L and title = 'F2'$s$, :F));
select t.check('owner pause is recorded as owner, from approved',
  (select paused_reason = 'owner' and paused_from = 'approved' from public.properties where user_id = :F and title = 'F2'));
select t.allowed('free: a paused listing does not count', 'authenticated', :F, t.listing(:F, 'F5'));
select t.raises('free: restoring F2 while at 3 is refused', 'authenticated', :F,
  format($s$update public.properties set status = 'approved' where user_id = %L and title = 'F2'$s$, :F), 'LISTING_LIMIT');
select t.allowed('free: owner marks F3 sold', 'authenticated', :F,
  format($s$update public.properties set status = 'sold' where user_id = %L and title = 'F3'$s$, :F));
select t.allowed('free: restore F2 once a slot is free', 'authenticated', :F,
  format($s$update public.properties set status = 'approved' where user_id = %L and title = 'F2'$s$, :F));
select t.check('restored listing is live again without re-review',
  (select status = 'approved' and paused_from is null and paused_reason is null
     from public.properties where user_id = :F and title = 'F2'));
select t.denied('free: owner cannot restore a paused listing straight to approved from pending', 'authenticated', :F,
  format($s$update public.properties set status = 'approved' where user_id = %L and title = 'F5'$s$, :F));
select t.denied('free: owner cannot fake pause bookkeeping', 'authenticated', :F,
  format($s$update public.properties set paused_reason = 'plan_limit', paused_from = 'approved'
            where user_id = %L and title = 'F4' and paused_reason is not null$s$, :F));

-- ===============================================================
-- Founding Developer Pilot
-- ===============================================================
select t.allowed('pilot: developer requests a pilot (tries to self activate)', 'authenticated', :P,
  format($s$insert into public.pilots (user_id, company_name, cac_number, project_name, project_state,
              status, activated_at, ends_at)
            values (%L, 'Crest Homes', 'RC 100', 'Crestline Court', 'Lagos', 'active', now(), '2099-01-01')$s$, :P));
select t.check('pilot request lands as requested with no dates',
  (select status = 'requested' and activated_at is null and ends_at is null from public.pilots where user_id = :P));
select t.check('a requested pilot grants nothing', t.plan(:P) = 'basic');
select t.denied('pilot: developer cannot approve own request', 'authenticated', :P,
  format($s$update public.pilots set status = 'active' where user_id = %L$s$, :P));
select t.raises('pilot: a second request from the same account is refused', 'authenticated', :P,
  format($s$insert into public.pilots (user_id, company_name, cac_number, project_name, project_state)
            values (%L, 'Crest Homes', 'RC 999', 'Another', 'Lagos')$s$, :P), '23505');
select t.raises('pilot: a new account for the same company (same CAC) is refused', 'authenticated', :P2,
  format($s$insert into public.pilots (user_id, company_name, cac_number, project_name, project_state)
            values (%L, 'Crest Homes', 'rc-100', 'Crestline Court', 'Lagos')$s$, :P2), '23505');
select t.denied('pilot: buyer cannot read the pilot', 'authenticated', :BUY,
  $s$select * from public.pilots$s$);

select t.allowed('admin activates the pilot', 'authenticated', :ADM,
  format($s$update public.pilots set status = 'active' where user_id = %L$s$, :P));
select t.check('activation starts a 30 day clock and records the decision',
  (select ends_at - activated_at = interval '30 days' and decided_by = :ADM and decided_at is not null
     from public.pilots where user_id = :P));
select t.check('active pilot: 20 listings, estate recorded',
  (select plan = 'pilot' and max_active = 20 and pilot_project_name = 'Crestline Court'
     from public.plan_status_at(:P, now())));

select t.allowed('pilot: listing #1 in the estate', 'authenticated', :P, t.listing(:P, 'P1'));
select t.check('pilot listing is tagged to the pilot and the estate',
  (select pilot_id is not null and estate_name = 'Crestline Court' from public.properties where title = 'P1'));
select t.raises('pilot: listing in another state is refused', 'authenticated', :P,
  t.listing(:P, 'P-x', state => 'Oyo'), 'PILOT_SCOPE');
select t.raises('pilot: listing in another estate is refused', 'authenticated', :P,
  t.listing(:P, 'P-y', estate => 'Other Gardens'), 'PILOT_SCOPE');
select t.allowed('pilot: listings #2 to #20 in one bulk upload', 'authenticated', :P,
  format($s$insert into public.properties (user_id, title, type, listing_type, price, state)
            select %L, 'P' || g, 'land', 'sale', 1, 'Lagos' from generate_series(2, 20) g$s$, :P), 19);
select t.check('pilot: 20 active', t.active(:P) = 20);
select t.raises('pilot: listing #21 is refused', 'authenticated', :P, t.listing(:P, 'P21'), 'LISTING_LIMIT');
select t.raises('pilot: a pilot listing cannot be moved out of the estate', 'authenticated', :P,
  format($s$update public.properties set state = 'Oyo' where title = 'P1'$s$), 'PILOT_SCOPE');

-- Admin publishes the 20, with a known publication order: P1 earliest.
update public.properties p
   set status = 'approved',
       published_at = '2026-01-01'::timestamptz + (substring(p.title from 2)::int * interval '1 minute')
 where p.user_id = :P;

select ends_at as pilot_end from public.pilots where user_id = :P \gset
select t.check('pilot: a day before expiry it is still a pilot',
  t.plan(:P, :'pilot_end'::timestamptz - interval '1 day') = 'pilot');
select t.check('pilot: at the exact expiry instant it has ended',
  t.plan(:P, :'pilot_end'::timestamptz) = 'basic');
select t.check('pilot: after expiry it has ended',
  t.plan(:P, :'pilot_end'::timestamptz + interval '1 second') = 'basic');

select t.check('expiry job a day early changes nothing',
  (select count(*) = 0 from public.run_plan_expiry(:'pilot_end'::timestamptz - interval '1 day')));
select t.check('pilot still active after the early run',
  (select status = 'active' from public.pilots where user_id = :P) and t.paused(:P) = 0);

select t.check('expiry job at the end instant expires the pilot and pauses 17',
  (select count(*) = 1 and bool_and(reason = 'pilot_ended' and paused = 17)
     from public.run_plan_expiry(:'pilot_end'::timestamptz)));
select t.check('pilot marked expired', (select status = 'expired' from public.pilots where user_id = :P));
select t.check('the 3 earliest published stay live: P1, P2, P3',
  (select array_agg(title order by title) = array['P1','P2','P3']
     from public.properties where user_id = :P and status = 'approved'));
select t.check('17 paused for plan limit, from approved, none deleted',
  t.paused(:P) = 17
  and (select bool_and(paused_reason = 'plan_limit' and paused_from = 'approved')
         from public.properties where user_id = :P and status = 'paused')
  and (select count(*) = 20 from public.properties where user_id = :P));
select t.check('expiry job is idempotent',
  (select count(*) = 0 from public.run_plan_expiry(:'pilot_end'::timestamptz + interval '1 hour'))
  and t.paused(:P) = 17);

select t.allowed('public sees only the 3 live pilot listings', 'anon', null,
  format($s$select * from public.properties where user_id = %L$s$, :P), 3);
select t.check('a paused listing reads as unavailable, a live one as live',
  public.listing_availability((select id from public.properties where title = 'P20')) = 'unavailable'
  and public.listing_availability((select id from public.properties where title = 'P1')) = 'live'
  and public.listing_availability('00000000-0000-0000-0000-000000000000') is null);
select t.denied('no enquiry about a paused listing', 'authenticated', :BUY,
  format($s$insert into public.inquiries (property_id, sender_id, receiver_id, message)
            select id, %L, user_id, 'hi' from public.properties where title = 'P20'$s$, :BUY));
select t.allowed('enquiry about a live pilot listing still works', 'authenticated', :BUY,
  format($s$insert into public.inquiries (property_id, sender_id, receiver_id, message)
            select id, %L, user_id, 'hi' from public.properties where title = 'P1'$s$, :BUY));

-- Expired pilot cannot get back in.
select t.raises('expired pilot: a new listing is refused', 'authenticated', :P, t.listing(:P, 'P22'), 'LISTING_LIMIT');
select t.denied('expired pilot: cannot reopen the pilot', 'authenticated', :P,
  format($s$update public.pilots set status = 'active', ends_at = '2099-01-01' where user_id = %L$s$, :P));
select t.raises('expired pilot: cannot request another', 'authenticated', :P,
  format($s$insert into public.pilots (user_id, company_name, cac_number, project_name, project_state)
            values (%L, 'Crest 2', 'RC 555', 'Crest 2', 'Lagos')$s$, :P), '23505');
select t.denied('expired pilot: cannot change account type or plan on the profile', 'authenticated', :P,
  format($s$update public.profiles set account_type = 'professional', user_type = 'agent' where id = %L$s$, :P));
select t.check('expired pilot stays Free Starter in a new session', t.plan(:P) = 'basic');

-- Swap within Free: pause a live one, bring back a plan-paused one.
select t.allowed('expired pilot: owner pauses P3', 'authenticated', :P,
  $s$update public.properties set status = 'paused' where title = 'P3'$s$);
select t.allowed('expired pilot: owner restores P20 in its place', 'authenticated', :P,
  $s$update public.properties set status = 'approved' where title = 'P20'$s$);
select t.check('swap done: P1, P2, P20 live',
  (select array_agg(title order by title) = array['P1','P2','P20']
     from public.properties where user_id = :P and status = 'approved'));

-- Upgrade to Business restores plan-paused listings; owner-paused stay paused.
select t.allowed('Paystack (service role) records a Business payment', 'service_role', null,
  format($s$insert into public.subscriptions (user_id, plan, amount, end_date, status, paystack_reference)
            values (%L, 'professional', 35000, now() + interval '30 days', 'active', 'ref_pilot_upgrade')$s$, :P));
select t.check('upgrade: plan is Business with 100', (select plan = 'professional' and max_active = 100
  from public.plan_status_at(:P, now())));
select t.check('upgrade restores the 16 plan-paused listings',
  (select restored = 16 and paused = 0 from public.apply_allowance(:P)));
select t.check('owner-paused P3 stays paused; 19 live',
  (select status = 'paused' and paused_reason = 'owner' from public.properties where title = 'P3')
  and t.active(:P) = 19);

-- Downgrade: the paid period ends, back to 3 live.
select end_date as sub_end from public.subscriptions where paystack_reference = 'ref_pilot_upgrade' \gset
select t.check('downgrade: paid period end pauses back to 3',
  (select bool_and(reason = 'paid_period_ended' and paused = 16) from public.run_plan_expiry(:'sub_end'::timestamptz))
  and t.active(:P) = 3);
select t.check('downgrade: profile display cache back to basic',
  (select account_type = 'basic' from public.profiles where id = :P));

-- ===============================================================
-- Paid Business
-- ===============================================================
select t.allowed('Paystack records Business for the agency', 'service_role', null,
  format($s$insert into public.subscriptions (user_id, plan, amount, end_date, status, paystack_reference)
            values (%L, 'professional', 35000, now() + interval '30 days', 'active', 'ref_biz')$s$, :B));
select t.allowed('business: listings #1 to #100 in one bulk upload', 'authenticated', :B,
  format($s$insert into public.properties (user_id, title, type, listing_type, price, state)
            select %L, 'B' || g, 'land', 'sale', 1, 'Oyo' from generate_series(1, 100) g$s$, :B), 100);
select t.raises('business: listing #101 is refused', 'authenticated', :B, t.listing(:B, 'B101'), 'LISTING_LIMIT');
select t.check('business: no estate restriction', (select count(distinct state) = 1 from public.properties where user_id = :B));
select t.denied('business: seller cannot extend the subscription', 'authenticated', :B,
  format($s$update public.subscriptions set end_date = '2099-01-01' where user_id = %L$s$, :B));
select t.allowed('admin cancels the subscription (refund case)', 'authenticated', :ADM,
  format($s$update public.subscriptions set status = 'cancelled' where user_id = %L$s$, :B));
select t.check('cancelled: Business benefits stop at once', t.plan(:B) = 'basic');
select t.raises('cancelled: no new listings over 3', 'authenticated', :B, t.listing(:B, 'B102'), 'LISTING_LIMIT');
select t.check('cancelled: allowance applied keeps 3, pauses 97, deletes none',
  (select paused = 97 from public.apply_allowance(:B))
  and t.active(:B) = 3 and (select count(*) = 100 from public.properties where user_id = :B));

-- A charge that was never recorded (failed payment) grants nothing.
select t.check('failed payment: no subscription row, still Free', t.plan(:BUY) = 'basic');

-- Legacy subscribers keep their limit to the end date, then fall to Free.
insert into public.subscriptions (user_id, plan, amount, end_date, status)
  values (:L, 'business', 80000, now() + interval '10 days', 'active');
select t.check('legacy Business keeps 500 until its end date',
  (select plan = 'business' and max_active = 500 from public.plan_status_at(:L, now())));
select t.check('legacy Business falls to Free after its end date',
  t.plan(:L, now() + interval '11 days') = 'basic');

-- ===============================================================
-- Demo listings
-- ===============================================================
insert into public.properties (user_id, title, type, listing_type, price, state, status, is_demo)
  values (:ADM, 'Show Flat (Demo)', 'apartment', 'rent', 1, 'Lagos', 'approved', true);
select t.denied('no enquiry about a demo listing', 'authenticated', :BUY,
  format($s$insert into public.inquiries (property_id, sender_id, receiver_id, message)
            select id, %L, user_id, 'hi' from public.properties where is_demo$s$, :BUY));
select t.allowed('free: owner pauses pending F5 to free a slot', 'authenticated', :F,
  $s$update public.properties set status = 'paused' where title = 'F5'$s$);
select t.allowed('free: new listing sent with is_demo true', 'authenticated', :F,
  format($s$insert into public.properties (user_id, title, type, listing_type, price, state, is_demo)
            values (%L, 'F6', 'land', 'sale', 1, 'Lagos', true)$s$, :F));
select t.check('is_demo was forced off', (select not is_demo from public.properties where title = 'F6'));
select t.denied('owner cannot flip the demo flag', 'authenticated', :F,
  $s$update public.properties set is_demo = true where title = 'F6'$s$);

-- ===============================================================
-- Admin and permissions
-- ===============================================================
select t.allowed('admin can list for a seller beyond the limit (exception handling)', 'authenticated', :ADM,
  t.listing(:F, 'F-admin'));
select t.allowed('admin sees every account plan', 'authenticated', :ADM,
  $s$select * from public.admin_plan_overview()$s$, (select count(*)::int from public.profiles));
select t.raises('seller cannot read the plan overview', 'authenticated', :F,
  $s$select * from public.admin_plan_overview()$s$, '42501');
select t.raises('seller cannot read another seller''s plan', 'authenticated', :F,
  format($s$select * from public.plan_status(%L)$s$, :P), '42501');
select t.allowed('seller reads own plan', 'authenticated', :F, $s$select * from public.plan_status()$s$);
select t.raises('anon cannot read plans', 'anon', null, $s$select * from public.plan_status()$s$, '42501');
select t.raises('seller cannot run the expiry job', 'authenticated', :F,
  $s$select * from public.run_plan_expiry()$s$, '42501');
select t.raises('seller cannot rebalance another seller', 'authenticated', :F,
  format($s$select * from public.apply_allowance(%L)$s$, :P), '42501');
select t.allowed('admin extends a pilot by hand (exception)', 'authenticated', :ADM,
  format($s$update public.pilots set status = 'active', ends_at = now() + interval '7 days' where user_id = %L$s$, :P));
select t.check('extended pilot is a pilot again', t.plan(:P) = 'pilot');

\o
\echo 'ALL PASSED'
