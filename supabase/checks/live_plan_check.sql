-- Read only. Run in the Supabase SQL editor for qjlwmpbmrdercymcnroz.
-- Works before and after migrations 0005 to 0007. Returns one table:
--   * whether 0005 and 0007 are in place
--   * plan and billing exposure
--   * a preview of what the first expiry run will pause (decision 8:
--     subscriptions still marked active after their end date fall to Free).
-- Review the preview before 0007's cron job has run for the first time.
select 'guard triggers from 0005 (expect 2)' as check_name, count(*)::text as result
  from pg_trigger where tgname in ('guard_profile_privileged_columns', 'guard_property_privileged_columns')
union all
select '0007 listing_allowance trigger (expect 1)', count(*)::text
  from pg_trigger where tgname = 'listing_allowance'
union all
select 'subscription policies (expect owner read + admin only)', string_agg(policyname, ', ' order by policyname)
  from pg_policies where schemaname = 'public' and tablename = 'subscriptions'
union all
select 'profiles ' || account_type::text || ' / ' || role::text, count(*)::text
  from public.profiles group by account_type, role
union all
select 'subscriptions ' || plan::text || ' / ' || status::text,
       count(*) || ' rows, ' || count(paystack_reference) || ' with Paystack ref, latest end '
       || coalesce(max(end_date)::date::text, '-')
  from public.subscriptions group by plan, status
union all
select 'subscriptions marked active but past their end date (first expiry run ends these)', count(*)::text
  from public.subscriptions where status = 'active' and end_date <= now()
union all
select 'first expiry run: listings it would pause, per account',
       coalesce(string_agg(pr.email || ' ' || x.over_by || ' of ' || x.active, '; '), 'none')
  from (
    select p.user_id, count(*) as active, count(*) - 3 as over_by
      from public.properties p
     where p.status in ('pending', 'approved')
       and p.user_id in (select s.user_id from public.subscriptions s
                          where s.status = 'active' and s.end_date <= now())
       and p.user_id not in (select s.user_id from public.subscriptions s
                              where s.status = 'active' and s.end_date > now())
       and p.user_id not in (select id from public.profiles where role = 'admin' or account_type = 'enterprise')
     group by p.user_id
    having count(*) > 3
  ) x
  join public.profiles pr on pr.id = x.user_id
union all
select 'Free accounts already over 3 active listings (left alone until an admin or the owner acts)', count(*)::text
  from (select p.user_id from public.properties p
         where p.status in ('pending', 'approved')
           and p.user_id not in (select s.user_id from public.subscriptions s where s.status = 'active')
           and p.user_id not in (select id from public.profiles where role = 'admin' or account_type = 'enterprise')
         group by p.user_id having count(*) > 3) over_limit
union all
select 'listings by status: ' || status::text, count(*)::text
  from public.properties group by status
union all
select 'demo listings (title ends "(Demo)")', count(*)::text
  from public.properties where title ilike '%(demo)%';
