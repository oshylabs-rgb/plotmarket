# Plotmarket database migrations

The Plotmarket Supabase project is not reachable from the tooling used to write
these files, so every migration here is **unapplied and unexecuted**. Run them
by hand in the Supabase SQL editor, in order, and read the notes below first.

| File | What it does | Applied? |
|---|---|---|
| `0001_base_schema.sql` | Reconstruction of the original base schema. Not the original file. | **Applied 2026-08-24** to project `lmfsqfwdgxlsuozxyauy` (fresh, empty database) |
| `0002_media_360_and_title_docs.sql` | 360 media columns, title document enum, storage bucket and RLS, listings index | **Applied 2026-08-24** |
| `0003_super_admin.sql` | Super admin account, `public.is_admin()`, admin override policies | **Applied 2026-08-24** (policies via SQL; the auth account was created through the dashboard Add User flow instead of the SQL insert, then promoted to admin) |
| `0004_grants.sql` | Standard Supabase role grants for anon/authenticated/service_role. The SQL editor tables never received them, every API request failed 42501 until this ran. | **Applied 2026-08-24** |
| `seed_demo.sql` | Demo stakeholder accounts and listings so the marketplace is not empty | **Applied 2026-08-24** |

## Before you run anything

`0001` was never committed. The version here was rebuilt from
`src/types/database.ts` and the query patterns in the app, so it describes what
the code *requires*, not necessarily what the live database *has*. It is fully
guarded, so it will skip anything that already exists, but that also means it
cannot correct an object that exists in a different shape.

Run this first and compare the output against `0001_base_schema.sql`:

```sql
-- tables and columns
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- policies
select tablename, policyname, cmd
from pg_policies
where schemaname in ('public', 'storage')
order by tablename, policyname;

-- the signup trigger, see the warning below
select tgname, tgrelid::regclass
from pg_trigger
where not tgisinternal and tgrelid = 'auth.users'::regclass;

-- storage bucket
select id, name, public from storage.buckets;
```

### The signup trigger is the thing most likely to be wrong

`src/app/(public)/register/page.tsx` calls `supabase.auth.signUp` with
`full_name`, `phone`, `user_type`, `company_name` and `cac_number` in the
metadata, and never inserts a `public.profiles` row itself. A database trigger
on `auth.users` is therefore the only thing that creates a profile.

That trigger lives in the database, not in this repository, so there is no way
to tell from the code whether it was updated when `user_type`, `company_name`
and `cac_number` were added. If it was not, agent and developer registrations
will appear to succeed while silently dropping the company name and CAC number.

Check the live function body:

```sql
select prosrc from pg_proc where proname = 'handle_new_user';
```

If it does not read all five metadata keys, apply the
`handle_new_user` function from `0001_base_schema.sql`. It is a
`create or replace`, so it is safe to run on its own.

## Running the migrations

1. **`0002_media_360_and_title_docs.sql`** — paste and run as is. Every
   statement is guarded and it is safe to re-run.

2. **`0003_super_admin.sql`** — this creates the super admin account.
   In the SQL editor, replace `__SET_BEFORE_RUNNING__` with the real password
   **in the editor buffer only**. Do not save it back into the file and do not
   commit it, this repository is public. The migration raises an exception
   rather than running if you forget, so it cannot create an account with a
   placeholder password.

   Rotate the password from the app after the first login.

## After running

Confirm each of these before trusting the result.

```sql
-- 1. the admin profile exists and the auth user is confirmed
select p.email, p.role, p.account_type, u.email_confirmed_at is not null as confirmed
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin';

-- 2. the helper resolves
select public.is_admin();

-- 3. the new columns landed
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'properties'
  and column_name in ('images_360', 'videos_360', 'title_document');
```

Then in the app:

- `superadmin@plotmarket.ng` can sign in and reaches `/admin`
- a normal user hitting `/admin` lands on `/dashboard` and never sees the panel
- the admin can delete a property, a user, and a listing image

## Environment variables this depends on

Two server side variables must exist wherever the app runs, including Vercel.
Neither is in the repository, and both fail silently if missing.

- `SUPABASE_SERVICE_ROLE_KEY` (Supabase, project settings, API, service_role).
  Required by the Paystack webhook and callback, and by the admin account
  deletion route. Without it a paid subscription is never granted and account
  deletion returns a 500.
- `NEXT_PUBLIC_APP_URL` must be the real origin in production. It falls back to
  `http://localhost:3000`, which would send live customers to a dead Paystack
  callback URL.

See `.env.example` in the repository root.

## Note on the super admin insert

`0003` writes directly into `auth.users` and `auth.identities`. GoTrue reads
several token columns on `auth.users` into Go strings, and a NULL in any of
them breaks email sign-in with `converting NULL to string is unsupported`.
The migration blanks those columns after the insert, guarding each one against
auth schema versions where it does not exist.

If sign-in still fails, the quickest clean alternative is to create the account
through the Supabase dashboard (Authentication, Add user, with "auto confirm"),
then run only sections 2 and 3 of `0003` to attach the admin role and the
policies.
