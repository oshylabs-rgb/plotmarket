# PlotMarket project memory

Living notes for whoever works on plotmarket.ng next, human or agent. Keep it short and current. Last updated 29 Sep 2026.

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

Must exist: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (sensitive, cannot be pulled; also used by `/api/visit`), `NEXT_PUBLIC_APP_URL=https://plotmarket.ng`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `RESEND_API_KEY`, `CRON_SECRET`. Verified present on 25 Sep; `CRON_SECRET` on 28 Sep.

## Post deploy verification checklist

Run after every production deploy. All must pass.

- `https://plotmarket.ng/robots.txt` returns 200 and contains `Sitemap: https://plotmarket.ng/sitemap.xml`
- `https://plotmarket.ng/sitemap.xml` returns 200 with at least 30 URLs including `/guides/` and `/land-for-sale/` pages
- `https://plotmarket.ng/pricing` shows exactly Free Starter, Founding Developer Pilot, Business ₦35,000 per 30 days, and the phone +234 803 217 9317
- `https://plotmarket.ng/api/health/plans` returns 200 with every check `ok`
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
- `GET /api/health/plans` on production answers ok/missing per plan migration (no data returned); 503 when anything is missing, so it can back an uptime monitor.
- `npm run test:db` applies every migration to a throwaway local Postgres with Supabase's roles stubbed (`supabase/tests/supabase_stub.sql`) and runs `supabase/tests/*.test.sql` as anon, authenticated and service_role. Needs local Postgres server binaries; never touches a real project.

## What changed on 27 Sep 2026

- Seller plan audit: `docs/PLAN_AUDIT_2026-09-27.md`, with the owner's approved plan decisions in section F.
- Security fix: migration `0005_lock_privileged_columns.sql`. Before it, any signed in user could make themselves admin, give themselves a paid plan, approve or feature their own listings, write themselves an active subscription, and send enquiries about unpublished listings. Paystack callback and webhook now also refuse charges that do not cover the plan price in NGN. The client-side "Cancel subscription" button is gone; plans are one-off 30 day charges and never renewed.

## Seller plans (28 Sep 2026)

Free Starter 3 active listings; Founding Developer Pilot 20 in one estate for 30 days from admin activation, invitation only; Business ₦35,000 per 30 days, 100 active, one-off Paystack charge, no auto-renew. Defined once in `src/constants/plans.ts`, enforced in the database by migration 0007 (`plan_status`, `listing_allowance` trigger, `run_plan_expiry`). Full report: `docs/PLANS_IMPLEMENTATION_2026-09-28.md`. Internal id for Business is `professional`; `business` is the legacy 500-listing plan.

## Privacy, analytics, contact and outreach (28 Sep 2026)

- **Profile privacy.** Migration 0008 (applied live 28 Sep): the public reads only profiles of sellers with an approved listing; signed-in users read their own profile and the other party of an enquiry; admins read all. Before it, the anon key could list all 13 accounts' emails and phones. Migration 0010 (applied live 29 Sep, after PR #10 deployed): the anon role can read only `id, full_name, phone, email, user_type, company_name, avatar_url`. Any new public query on profiles must select `SELLER_CONTACT_COLUMNS`, never `*`.
- **Analytics.** First-party and cookieless, no third party. `VisitBeacon` (root layout) posts path, referrer and `?utm_*` to `/api/visit`, which records production traffic only (service role, bot filter, same-origin check) into `page_views` (0009): path, referrer host, UTM, country, device. No IP, no identifier. Admins see it with the seller funnel on `/admin` (Traffic and funnel, 7/30/90 days) via `admin_traffic_summary()`. Rows over 400 days are pruned by pg_cron job `plotmarket-page-view-retention`. Vercel Web Analytics was not used: it needs a dashboard toggle the API cannot flip.
- **Contact.** Nigerian line +234 803 217 9317, defined once in `src/constants/contact.ts`; shown in the footer, pricing, dashboard Plan page, terms, privacy and the Organization JSON-LD. Not advertised as WhatsApp. The line is Mr Desmond Oshenye's (Arnold's father, whose Plotmarket account carries the same number); developer outreach emails and the pilot brochure send readers to him by name and to that number, from Arnold's mailbox.
- **Outreach.** `docs/outreach/PILOT_OUTREACH_PACK.md` is the only current pack (pilot offer, never-say list, NDPA rules, UTM links, email, WhatsApp, LinkedIn, call, follow ups, objections). The 4 Sep Google Doc with the 90-day / 500 / ₦80,000 offer is retired.
- **Old 90-day offer: nobody to honour.** Searched 28 Sep: Zoho `arnold.oshenye@oshylabs.eu` (every folder, about 710 messages, 3 Feb to 28 Sep 2026) and Resend (all 59 sends, 1 to 28 Sep) have no PlotMarket trial outreach and no replies. The 4 Sep pack appears never to have been sent from Oshylabs channels. The personal Gmail was searched earlier with no match. If someone ever quotes it, the pack's reply script and `/admin/pilots` Grant a pilot directly cover it.
- **Warm leads.** 2 probable real sellers (agents, signed up 26 Sep) had no listings on 28 Sep. Activation email is in the outreach pack, section 13.
- **Passwords (29 Sep).** Supabase stores them with bcrypt on every plan. Its leaked-password check is Pro-only, so `src/lib/passwords.ts` does it for free at sign up and in Dashboard, Profile: at least 10 characters, and the browser sends only the first 5 characters of the SHA-1 to `/api/password-check`, which relays the Have I Been Pwned range (nobody but the browser sees the full hash). It fails open if the service is down. A guard for honest users, not a security boundary: direct calls to the Supabase API skip it. `supabase/config.toml` now sets `minimum_password_length = 10`, **not yet applied to the live project**: Arnold sets Authentication, Providers, Email, Minimum password length to 10 in the Supabase dashboard (or `supabase config push` from a logged in machine). Existing users keep their passwords; the rules apply to new or changed ones. MongoDB was considered and rejected: it is a database, not a login service, and moving would mean rebuilding auth and every row level security rule.
- **Lead sources.** Vibe Prospecting dataset `ds-97c99d1c-4f2b-4556-bbdc-fc8489b767a7` (50 Nigerian real estate and building CEOs, MDs and founders with valid emails, exported 29 Sep for 150 credits, 45 credits left) lives in the Vibe hub, not in git: it holds third party contact details. Log each contact's source in the outreach tracker before sending (outreach pack, section 4).
- **Pilot brochure (29 Sep).** Two page A4 PDF, `public/brochures/plotmarket-developer-pilot.pdf`, served at `https://plotmarket.ng/brochures/plotmarket-developer-pilot.pdf` and linked in every developer email and WhatsApp. Source `brochure/developer-pilot.html` (site fonts and colours); rebuild with `npm run brochure` after any plan change. `src/constants/brochure.test.ts` fails if its numbers disagree with `src/constants/plans.ts` or it makes a claim the site cannot back (verified, escrow, commission, 90 days). No earlier brochure existed in Canva or Gamma; the personal Drive doc of 4 Sep is retired and untouched.
- **Pilot poster (29 Sep).** A3 vector PDF and a PNG at `/brochures/plotmarket-developer-pilot-poster-A3.pdf` and `.png`, from `brochure/poster.html`, for Mr Desmond Oshenye to print in Nigeria. QR code decodes to the register link with `utm_source=poster`. Guarded by `src/constants/poster.test.ts`. If the register link changes, regenerate the inline QR (see the comment in the HTML).
- **Live verification 28 Sep** (rolled back, nothing persisted): Free 4th listing refused; self-admin and self-subscription refused; pilot request, 30 days, 21st listing and other-estate listing refused; expiry keeps the 3 earliest live and pauses the rest with no rows deleted; anon sees live sellers only; no enquiries on paused listings.
- **Database access from cloud sessions** works through the Supabase connector signed in as cadencebyoshy@gmail.com (owner of org Oshylabs). pg_cron 1.6.4: `plotmarket-plan-expiry` (every 15 min) and `plotmarket-page-view-retention` (daily 03:17 UTC) both active.

## Open items and risks

0a. **Seller plans live since 28 Sep 2026** (PRs #6, #7, #8). Migrations 0005 to 0010 applied and verified live (0010 on 29 Sep). `CRON_SECRET` is set in Vercel production. The `plotmarket-plan-expiry` pg_cron job is verified active and succeeding; the daily Vercel cron at `/api/cron/plan-expiry` is the fallback and sends reminders. Never re-run 0005 after 0007; it now refuses to. Cloud sessions reach the database only when the Supabase connector is authorised with the login that owns org "Oshylabs" (Arnold, 28 Sep: cadencebyoshy@gmail.com, signed in on the Olabs browser; older notes say cadenceoshylabs@gmail.com). The "Oshylabs3" org cannot see the project, and cloud containers cannot reach supabase.co directly. Cloud sessions have no browser.
0. ~~Migration 0005 must be applied~~ Applied (see 0a). Historical note: **Migration 0005 must be applied to `qjlwmpbmrdercymcnroz`** (SQL editor, or `supabase db push` from a machine logged in as the cadence account). Until it is, the holes above are open on live. Verify afterwards with `select tgname from pg_trigger where tgname like 'guard_%';` (expect 2 rows) and `select policyname from pg_policies where tablename='subscriptions';` (expect only owner read and admin).

1. Listing pages are server rendered since PR #4 (25 Sep). If a listing ever shows "No properties yet" to curl, check `src/lib/listings.ts` and the anon key first.
2. Super admin: `superadmin@plotmarket.ng` must exist in the new project (Authentication → Users → Add user) and be promoted with `update public.profiles set role='admin', account_type='enterprise', is_verified=true where email='superadmin@plotmarket.ng'`.
3. Security advisors: run 28 Sep. Fixed by 0008: `plan_listing_limit` search_path, `handle_new_user` callable through the API. Remaining WARNs are intentional (SECURITY DEFINER RPCs that check the caller themselves; `page_views` has RLS on and no policies by design). Leaked password protection needs the Supabase Pro plan: a money decision for Arnold. Re-run after the first real users arrive.
6. Legacy `starter` and `business` plan ids are still honoured for existing subscribers via `LEGACY_PLAN_LIMITS` in `src/constants/pricing.ts`.
