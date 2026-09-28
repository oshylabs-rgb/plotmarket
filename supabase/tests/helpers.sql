-- Shared assertions for the SQL tests. Included by each *.test.sql with \ir.

\set ON_ERROR_STOP 1
\o /dev/null
set client_min_messages = warning;
drop schema if exists t cascade;
set client_min_messages = notice;
create schema t;

-- Run one statement as an API caller. Returns rows affected. The role switch
-- is local to the surrounding (sub)transaction, so an error inside the
-- statement also undoes it.
create function t.exec_as(api_role text, uid uuid, stmt text) returns int
language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  execute format('set local role %I', api_role);
  execute stmt;
  get diagnostics n = row_count;
  reset role;
  return n;
end $$;

-- Passes when the statement is refused: a permission error or zero rows.
-- Whatever the statement did is always rolled back, so one failing check
-- cannot leave state behind that changes the outcome of the next.
create function t.denied(label text, api_role text, uid uuid, stmt text) returns void
language plpgsql as $$
declare n int; refused boolean := false; allowed boolean := false;
begin
  begin
    n := t.exec_as(api_role, uid, stmt);
    allowed := n > 0;
    raise exception using errcode = 'T0001';
  exception
    when insufficient_privilege or check_violation then refused := true;
    when sqlstate 'T0001' then null;
  end;
  if allowed and not refused then
    raise exception 'FAIL (was allowed): %', label;
  end if;
  raise notice 'ok   %', label;
end $$;

-- Passes when the statement affects exactly the expected number of rows.
create function t.allowed(label text, api_role text, uid uuid, stmt text, expect int default 1)
returns void language plpgsql as $$
declare n int;
begin
  n := t.exec_as(api_role, uid, stmt);
  if n <> expect then
    raise exception 'FAIL (% rows, expected %): %', n, expect, label;
  end if;
  raise notice 'ok   %', label;
end $$;

create function t.check(label text, cond boolean) returns void
language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'ok   %', label;
end $$;

-- Passes when the statement fails with the expected SQLSTATE, or with a
-- message starting with the expected text (e.g. 'LISTING_LIMIT').
create function t.raises(label text, api_role text, uid uuid, stmt text, expect text)
returns void language plpgsql as $$
declare msg text; st text;
begin
  begin
    perform t.exec_as(api_role, uid, stmt);
    raise exception using errcode = 'T0002';
  exception
    when sqlstate 'T0002' then
      raise exception 'FAIL (no error raised): %', label;
    when others then
      get stacked diagnostics msg = message_text, st = returned_sqlstate;
  end;
  if not (st = expect or msg like expect || '%') then
    raise exception 'FAIL (got % "%"): %', st, msg, label;
  end if;
  raise notice 'ok   %', label;
end $$;

