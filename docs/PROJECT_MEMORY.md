# PlotMarket project memory

Living notes for whoever works on plotmarket.ng next, human or agent. Keep it short and current. Last updated 25 Sep 2026.

## The one rule

**Production deploys only from `master`, through the Vercel git integration.** Never run `vercel deploy` from a working directory again. The 13 Sep deployment was a file upload whose build script cloned master and copied an unpushed overlay on top; nothing in git matched what was live for 12 days. That overlay was recovered file by file from the deployment on 25 Sep and merged as PR #3.

Merge to master → Vercel builds → aliases `plotmarket.ng` and `www.plotmarket.ng`. Watch it with:

```bash
vercel ls plotmarket --scope team_Ha87dazpFrZWxGtyiEA0x0zD
```

## Infrastructure

| Piece | Where | Notes |
|---|---|---|
| Repo | github.com/oshylabs-rgb/plotmarket | default branch `master` |
| Hosting | Vercel project `prj_Et3GQvplmJUrFDzg0Jl39AWmGFSc`, team `team_Ha87dazpFrZWxGtyiEA0x0zD` | git connected |
| Database and auth | Supabase project `qjlwmpbmrdercymcnroz` ("Plotmarket", org `Oshylabs`, eu-west-2 London), owner cadenceoshylabs@gmail.com | Dedicated to PlotMarket since 25 Sep 2026. Before that PlotMarket lived inside the ProfileProof project `lmfsqfwdgxlsuozxyauy`; its tables, enums, functions, trigger, bucket and PlotMarket-only accounts were removed from there the same day (verified, all counts zero). Never use that project for PlotMarket again. |
| Supabase org | `Oshylabs` (slug `crkmwalwmkotzpnahsmi`) under cadenceoshylabs@gmail.com | Free plan. The CLI on this machine is logged in as this account. |
| Payments | Paystack, keys in Vercel env | webhook at `/api/paystack/webhook` needs `SUPABASE_SERVICE_ROLE_KEY` |
| Email | Resend, verified domain `oshylabs.eu` | see below |

## Auth email arrangement

Supabase Auth on `qjlwmpbmrdercymcnroz` sends through **custom SMTP on Resend** (`smtp.resend.com`, port 465, user `resend`, Resend key "Plotmarket - Supabase Auth SMTP", sending access, domain oshylabs.eu). Sender is `Plotmarket <arnold.oshenye@oshylabs.eu>`. Confirmations on, 100 emails/hour, site URL `https://plotmarket.ng`, redirect allow list covers plotmarket.ng, www.plotmarket.ng and localhost:3000. Verified 25 Sep: a test signup was delivered by Resend within 2 seconds. Keys are never written here; the SMTP password lives in Supabase and `RESEND_API_KEY` (key "Plotmarket - App", currently unused by code) in Vercel.

Auth settings are managed as code: a minimal `supabase/config.toml` declaring only `[auth]`, pushed with `supabase config push --project-ref qjlwmpbmrdercymcnroz`. Undeclared properties are left alone.

Symptom to remember: registering an address that already exists shows the "Check your email" screen but sends nothing (Supabase hides account existence). Check `auth.users` before assuming mail is broken.

## Vercel production environment

Must exist: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (sensitive, cannot be pulled), `NEXT_PUBLIC_APP_URL=https://plotmarket.ng`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `RESEND_API_KEY`. Verified present on 25 Sep.

## Post deploy verification checklist

Run after every production deploy. All must pass.

- `https://plotmarket.ng/robots.txt` returns 200 and contains `Sitemap: https://plotmarket.ng/sitemap.xml`
- `https://plotmarket.ng/sitemap.xml` returns 200 with at least 30 URLs including `/guides/` and `/land-for-sale/` pages
- `https://plotmarket.ng/pricing` shows exactly Free, Professional ₦35,000, Enterprise
- `curl https://plotmarket.ng/` HTML contains at least one real listing title and not "No properties yet" 
- `curl https://plotmarket.ng/properties` HTML contains listing cards and no spinner
- `curl https://plotmarket.ng/properties/<any approved listing id>` contains a `RealEstateListing` JSON-LD block and the seller name (get an id with `select id from public.properties where status='approved' limit 1`)
- `https://plotmarket.ng/land-for-sale/lagos/lekki` and `https://plotmarket.ng/guides/how-to-verify-land-title-in-nigeria` return 200
- A fresh registration on `/register` receives its confirmation email and the link lands on plotmarket.ng

## What changed on 25 Sep 2026

- Public listing pages server rendered (PR #4): `/`, `/properties` static with 5 minute revalidate, `/properties/[id]` on demand; UI in `src/components/home` and `src/components/properties`.

- Overlay recovered from deployment `dpl_HZ8dAz8zaKJDGPNh1pwhrhEQqiTd` and merged to master (PR #3): robots, sitemap, OG image, 3 guides, 12 area pages, three tier pricing, per-route metadata, JSON-LD, public anon Supabase client.
- First git triggered production deploy since 13 Sep; robots, sitemap (38 URLs), pricing, guides and area pages verified live.
- `RESEND_API_KEY` added to Vercel production.
- Supabase org `Oshylabs` created under the cadence account.
- Tracking issue: github.com/oshylabs-rgb/plotmarket/issues/2

## Tests

- `npm test` runs Vitest (route tests with mocked Supabase; no network, no live Paystack).
- `npm run test:e2e` builds the app and runs Playwright at 375px and 1280px against `e2e/mock-supabase.mjs` (fixture listings, no real project). Playwright is pinned to 1.56.1 to match the container's chromium-1194.
- `npm run test:db` applies every migration to a throwaway local Postgres with Supabase's roles stubbed (`supabase/tests/supabase_stub.sql`) and runs `supabase/tests/*.test.sql` as anon, authenticated and service_role. Needs local Postgres server binaries; never touches a real project.

## What changed on 27 Sep 2026

- Seller plan audit: `docs/PLAN_AUDIT_2026-09-27.md`, with the owner's approved plan decisions in section F.
- Security fix: migration `0005_lock_privileged_columns.sql`. Before it, any signed in user could make themselves admin, give themselves a paid plan, approve or feature their own listings, write themselves an active subscription, and send enquiries about unpublished listings. Paystack callback and webhook now also refuse charges that do not cover the plan price in NGN. The client-side "Cancel subscription" button is gone; plans are one-off 30 day charges and never renewed.

## Seller plans (28 Sep 2026)

Free Starter 3 active listings; Founding Developer Pilot 20 in one estate for 30 days from admin activation, invitation only; Business ₦35,000 per 30 days, 100 active, one-off Paystack charge, no auto-renew. Defined once in `src/constants/plans.ts`, enforced in the database by migration 0007 (`plan_status`, `listing_allowance` trigger, `run_plan_expiry`). Full report: `docs/PLANS_IMPLEMENTATION_2026-09-28.md`. Internal id for Business is `professional`; `business` is the legacy 500-listing plan.

## Open items and risks

0a. **Plans PR: apply 0005, run `supabase/checks/live_plan_check.sql`, apply 0006 and 0007, then merge.** (`CRON_SECRET` optional.) Order and rollback in `docs/PLANS_IMPLEMENTATION_2026-09-28.md` section 3. The Supabase connector in cloud sessions must be authorised with the Supabase login that owns org "Oshylabs" (Arnold, 28 Sep: cadencebyoshy@gmail.com, signed in on the Olabs browser; older notes say cadenceoshylabs@gmail.com). The "Oshylabs3" org cannot see the project.
0. **Migration 0005 must be applied to `qjlwmpbmrdercymcnroz`** (SQL editor, or `supabase db push` from a machine logged in as the cadence account). Until it is, the holes above are open on live. Verify afterwards with `select tgname from pg_trigger where tgname like 'guard_%';` (expect 2 rows) and `select policyname from pg_policies where tablename='subscriptions';` (expect only owner read and admin).

1. Listing pages are server rendered since PR #4 (25 Sep). If a listing ever shows "No properties yet" to curl, check `src/lib/listings.ts` and the anon key first.
2. Super admin: `superadmin@plotmarket.ng` must exist in the new project (Authentication → Users → Add user) and be promoted with `update public.profiles set role='admin', account_type='enterprise', is_verified=true where email='superadmin@plotmarket.ng'`.
3. Security advisors: re-run `supabase db advisors --linked --project-ref qjlwmpbmrdercymcnroz --type security` after the first real users arrive; enable leaked password protection.
6. Legacy `starter` and `business` plan ids are still honoured for existing subscribers via `LEGACY_PLAN_LIMITS` in `src/constants/pricing.ts`.
