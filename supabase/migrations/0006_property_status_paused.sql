-- Plotmarket migration 0006
-- Adds 'paused' to property_status: a listing kept in full but hidden from
-- the public because the account is over its plan allowance, or because the
-- owner took it down to free a slot.
--
-- Its own migration because Postgres will not let a new enum value be used in
-- the transaction that adds it, and 0007 uses it.
--
-- Rollback: enum values cannot be dropped. 'paused' is harmless if unused;
-- move any paused rows back first with
--   update public.properties set status = paused_from where status = 'paused';

do $$
begin
  if exists (select 1 from pg_type where typname = 'property_status') then
    alter type public.property_status add value if not exists 'paused';
  else
    raise exception 'public.property_status enum not found; the live schema differs from 0001';
  end if;
end $$;
