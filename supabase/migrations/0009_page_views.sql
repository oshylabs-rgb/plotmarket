-- Plotmarket migration 0009: first-party, cookieless visit counts.
--
-- One row per page view on production: the path, the referring site, campaign
-- tags, country and device class. No IP address, no cookie, no user id, no
-- visitor identifier, so a row cannot be tied to a person. Rows are written
-- only by the server route /api/visit with the service role; nobody can read
-- them through the API except admins, through admin_traffic_summary().
--
-- Rows older than 400 days are deleted daily where pg_cron exists.
--
-- Safe to re-run. Rollback block at the end.

create table if not exists public.page_views (
  id            bigint generated always as identity primary key,
  viewed_at     timestamptz not null default now(),
  path          text not null check (path like '/%' and char_length(path) <= 300),
  referrer_host text check (char_length(referrer_host) <= 200),
  utm_source    text check (char_length(utm_source) <= 100),
  utm_medium    text check (char_length(utm_medium) <= 100),
  utm_campaign  text check (char_length(utm_campaign) <= 100),
  country       text check (country ~ '^[A-Z]{2}$'),
  device        text check (device in ('mobile', 'tablet', 'desktop'))
);

create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at);

alter table public.page_views enable row level security;

-- 0004 grants every new table to the API roles by default. This one is
-- written by the service role only and read through the function below.
revoke all on table public.page_views from anon, authenticated;
revoke all on sequence public.page_views_id_seq from anon, authenticated;
grant all on table public.page_views to service_role;

-- ---------------------------------------------------------------
-- Admin report: traffic and the seller funnel over the last p_days.
-- ---------------------------------------------------------------
create or replace function public.admin_traffic_summary(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  since timestamptz;
  result jsonb;
begin
  if coalesce(current_setting('role', true), 'none') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  since := date_trunc('day', now()) - make_interval(days => greatest(least(coalesce(p_days, 30), 400), 1) - 1);

  with v as (select * from public.page_views where viewed_at >= since)
  select jsonb_build_object(
    'since', since,
    'views', (select count(*) from v),
    'by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d::date, 'views', coalesce(n, 0)) order by d)
        from generate_series(since, date_trunc('day', now()), interval '1 day') d
        left join (select date_trunc('day', viewed_at) as bucket, count(*) as n from v group by 1) c on c.bucket = d
    ), '[]'::jsonb),
    'top_paths', coalesce((
      select jsonb_agg(jsonb_build_object('key', path, 'views', n) order by n desc, path)
        from (select path, count(*) n from v group by path order by n desc, path limit 15) x
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('key', k, 'views', n) order by n desc, k)
        from (select coalesce(referrer_host, 'Direct or unknown') k, count(*) n
                from v group by 1 order by n desc, 1 limit 10) x
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(jsonb_build_object('key', k, 'views', n) order by n desc, k)
        from (select concat_ws(' / ', utm_source, utm_medium, utm_campaign) k, count(*) n
                from v
               where coalesce(utm_source, utm_medium, utm_campaign) is not null
               group by 1 order by n desc, 1 limit 10) x
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('key', k, 'views', n) order by n desc, k)
        from (select coalesce(country, '??') k, count(*) n from v group by 1 order by n desc, 1 limit 10) x
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('key', k, 'views', n) order by n desc, k)
        from (select coalesce(device, 'unknown') k, count(*) n from v group by 1) x
    ), '[]'::jsonb),
    'funnel', jsonb_build_object(
      'signups',          (select count(*) from public.profiles where created_at >= since),
      'listings_created', (select count(*) from public.properties where created_at >= since and not is_demo),
      'listings_live',    (select count(*) from public.properties where status = 'approved' and not is_demo),
      'enquiries',        (select count(*) from public.inquiries where created_at >= since),
      'pilot_requests',   (select count(*) from public.pilots where requested_at >= since),
      'business_payments',(select count(*) from public.subscriptions
                            where created_at >= since and plan = 'professional')
    )
  ) into result;
  return result;
end
$fn$;
revoke execute on function public.admin_traffic_summary(int) from public, anon;
grant execute on function public.admin_traffic_summary(int) to authenticated, service_role;

-- ---------------------------------------------------------------
-- Retention: 400 days.
-- ---------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('plotmarket-page-view-retention', '17 3 * * *',
      $job$delete from public.page_views where viewed_at < now() - interval '400 days'$job$);
  else
    raise notice 'pg_cron is not installed here. Page views are not pruned automatically.';
  end if;
end $$;

-- ---------------------------------------------------------------
-- Rollback (manual; deletes the visit counts):
--
--   select cron.unschedule('plotmarket-page-view-retention');
--   drop function if exists public.admin_traffic_summary(int);
--   drop table if exists public.page_views;
-- ---------------------------------------------------------------
