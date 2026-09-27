-- Read only. Run in the Supabase SQL editor for qjlwmpbmrdercymcnroz after
-- applying migration 0005. Returns one table: the first two rows confirm the
-- security fix, the rest are the plan exposure numbers Phase 2 needs.
select 'guard triggers (expect 2)' as check_name, count(*)::text as result
  from pg_trigger where tgname like 'guard_%'
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
select 'sellers with more than 3 active listings', count(*)::text
  from (select user_id from public.properties
        where status in ('pending', 'approved')
        group by user_id having count(*) > 3) over_limit
union all
select 'listings by status: ' || status::text, count(*)::text
  from public.properties group by status
union all
select 'demo listings', count(*)::text
  from public.properties where title ilike '%(demo)%';
