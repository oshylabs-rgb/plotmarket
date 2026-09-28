-- Plotmarket migration 0010: the public sees a live seller's contact card only.
--
-- 0008 limits which profiles the public can read (sellers with a live
-- listing). This limits which columns: the name, phone, email, seller type,
-- company and avatar shown on the listing page. CAC number, role, plan and
-- verification flags are no longer readable with the anon key.
--
-- Signed-in users are unchanged: they need their own full row, and column
-- grants cannot differ per row. The app's public listing query asks for these
-- columns only (SELLER_CONTACT_COLUMNS in src/types/database.ts).
--
-- Safe to re-run. Rollback: grant select on public.profiles to anon;

revoke select on table public.profiles from anon;
grant select (id, full_name, phone, email, user_type, company_name, avatar_url)
  on table public.profiles to anon;
