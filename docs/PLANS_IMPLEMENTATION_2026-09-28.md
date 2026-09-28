# Seller plans: implementation report, 28 Sep 2026

Phases 2 to 5 of the plan rework. The audit and the owner's decisions are in `docs/PLAN_AUDIT_2026-09-27.md` (section F). The security fix (migration 0005, PR #5) shipped first.

## 1. What changed, by behaviour

| Area | Before | Now |
|---|---|---|
| Free limit | Checked in the browser only; counted rejected and sold listings | Enforced in the database on every insert, restore and status change; counts pending and approved only |
| Paid plan | One payment gave Professional forever; UI said "/month" and "Renews" | Business is in date only while a subscription row is in date; access ends at `end_date`; copy says "per 30 days, does not renew automatically"; paying early extends from the current end |
| Pilot | Did not exist (only the 90-day outreach offer, never built) | `pilots` table, request by seller, activation by admin only, 30 days from activation, 20 active listings, one estate, one pilot per account and per CAC number |
| Plan end | Nothing happened | Expiry job (pg_cron every 15 min, Vercel cron daily fallback) ends pilots and paid periods; earliest published listings up to the new limit stay live, the rest are `paused`, nothing is deleted |
| Seller controls | Delete only (Edit button did nothing) | Pause, bring back, mark sold; delete warns that pausing keeps everything |
| Demo listings | "(Demo)" in the title; shown as featured, in the sitemap, with a Verified badge; enquiries allowed | `is_demo` flag; labelled "Demo listing, not for sale"; off the home page, area pages, state counts and sitemap; noindex, no listing markup; enquiries refused by the database |
| Verified badges | Shown on cards, listing pages and seller cards | Removed from public pages. The admin flag stays, relabelled "Admin flag", described as internal only |
| Paused or sold listing URL | 404 | "This listing is no longer listed. Enquiries are closed." Enquiries refused by the database |

## 2. File by file

**Database**
- `supabase/migrations/0006_property_status_paused.sql`: adds `paused` to `property_status`.
- `supabase/migrations/0007_plans_and_pilots.sql`: listing columns (`is_demo`, `published_at`, `paused_from`, `paused_reason`, `estate_name`, `pilot_id`) with backfill; `pilots` table, RLS, `guard_pilot` trigger; `plan_listing_limit`, `plan_status_at`, `plan_status`; replaces the 0005 listing guard with owner pause, restore and sold rules; `listing_allowance` trigger (limit, pilot scope, per-seller advisory lock); `stamp_published_at`; `apply_allowance`; `run_plan_expiry`; `listing_availability`; `admin_plan_overview`; enquiries refused on demo listings; pg_cron schedule.
- `supabase/checks/live_plan_check.sql`: read-only check, now previews what the first expiry run would pause.
- `supabase/tests/helpers.sql`, `plans.test.sql`, `privileged_columns.test.sql`, `scripts/test-db.sh`: SQL tests run as anon, authenticated and service_role against a throwaway Postgres.

**Plans and payments**
- `src/constants/plans.ts` (new, replaces `src/constants/pricing.ts`): the one definition of plan names, limits, price, public copy and pilot expiry terms.
- `src/lib/paystack.ts`: `grantPaidPlan`, shared by webhook and callback, idempotent, extends from the current end date, rebalances listings after payment.
- `src/app/api/paystack/{initialize,callback,webhook}/route.ts`: only Business can be bought; amount and NGN checked; a cancel event also rebalances.
- `src/app/api/cron/plan-expiry/route.ts`, `vercel.json`, `src/lib/email.ts`: daily expiry fallback and the 7-day pilot reminder email (Resend), each reminder claimed atomically so it is sent once; `CRON_SECRET` is honoured when set.

**Seller dashboard**
- `dashboard/subscription/page.tsx` (sidebar label now "Plan"): current plan from the database, usage, Business checkout, pilot request form with the expiry terms shown and acknowledged before requesting.
- `dashboard/listings/new/page.tsx`: allowance from the database, pilot state and estate locked, database refusals shown in plain words.
- `dashboard/listings/page.tsx`: plan banner, pause, bring back, mark sold; dead Edit button removed.
- `dashboard/page.tsx`, `dashboard/profile/page.tsx`, `OnboardingTour.tsx`, `DashboardSidebar.tsx`, `hooks/usePlanStatus.ts`.

**Admin**
- `admin/pilots/page.tsx` (new): approve and activate, reject, end now, change end date (exception), record the setup session, grant a pilot directly to honour a written offer.
- `admin/users/page.tsx`: real plan, usage, paid until and pilot state per account; "Verified" relabelled "Admin flag".
- `admin/page.tsx`, `admin/subscriptions/page.tsx`: "Revenue" relabelled to what it is, the value of active paid periods.

**Public site**
- `components/home/HomePage.tsx`, `pricing/page.tsx`, `register/page.tsx`, `terms/page.tsx` (section 7 rewritten to match billing), `constants/guides.ts`, `constants/changelog.ts` (0.6.0), `layout.tsx`, `opengraph-image.tsx`, `Footer.tsx`, `land-for-sale` pages.
- `components/PropertyCard.tsx`, `components/properties/PropertyDetail.tsx`, `properties/[id]/page.tsx` and `layout.tsx`, `lib/listings.ts`, `sitemap.ts`: demo handling, no Verified badges, "no longer listed" page.

**Tests**: `vitest.config.ts` (from PR #5), `src/constants/plans.test.ts`, `src/app/api/paystack/webhook/route.test.ts`, `src/app/api/cron/plan-expiry/route.test.ts`, `playwright.config.ts`, `e2e/*`.

## 3. Migrations and rollback

Apply to `qjlwmpbmrdercymcnroz` **before** merging this PR. The new code calls `plan_status` and `apply_allowance`, so it breaks the dashboard on a database without them.

1. `0005_lock_privileged_columns.sql` (if not already applied).
2. Run `supabase/checks/live_plan_check.sql`. Review "first expiry run: listings it would pause". Those are accounts whose paid period has already ended; under decision 8 they fall to Free on the first run.
3. `0006_property_status_paused.sql`, then `0007_plans_and_pilots.sql`.
4. Run the check again: expect `listing_allowance` = 1. `select jobname, schedule from cron.job;` should list `plotmarket-plan-expiry` (if pg_cron is not available on the plan, the Vercel cron covers it daily).
5. Merge. `CRON_SECRET` is optional: the cron route only does work that is already due and claims each reminder atomically, so it runs without one; set it later to refuse other callers.

Rollback: every migration ends with a commented rollback block. 0007's restores every paused listing first, then drops the triggers and functions, and keeps the `pilots` table and the new columns (inert without the functions) so no data is lost. Re-run 0005 afterwards to restore its guard and enquiry policy.

## 4. Test results (run 28 Sep 2026 in the build container)

| Suite | Command | Result |
|---|---|---|
| Unit and route | `npm test` | 18 passed |
| Database, as each API role | `npm run test:db` | 2 files, 144 assertions, all passed |
| End to end, 375px and 1280px | `npm run test:e2e` | 22 passed |
| Lint | `npm run lint` | 0 errors, 1 existing warning (`<img>` in PropertyDetail) |
| Types and build | `tsc --noEmit`, `next build` (inside the E2E run) | clean |

The tests were also checked for teeth: breaking the Free limit, the estate scope and the "earliest published" ordering in the migration each made the database tests fail; the old webhook failed the underpayment tests; the old listing card failed the E2E demo and badge checks.

Covered by database tests: Free #1, #3, #4 and every way round #4 (status games, duplicate, bulk upload, service-role import); rejected, sold and paused not counting; owner swap. Pilot request, self-activation refused, one per account and per CAC, activation clock, #1, #20 (bulk), #21, other state, other estate, moving a pilot listing out; day before, exact instant and after expiry; expiry job early, on time and repeated; 3 earliest published kept, 17 paused, none deleted; paused listings hidden and closed to enquiries; expired pilot cannot list, reopen, re-request or edit its way back; upgrade restores 16, owner-paused stays paused; downgrade pauses again. Business #100 and #101, seller cannot extend, admin cancellation ends benefits at once; legacy 500 to end date then Free. Demo enquiries refused, demo flag cannot be set or flipped by owners. Admin exceptions and every permission boundary.

Covered by route tests (mocked Supabase, no network, no live Paystack, no live email): bad signature, full price, underpaid, wrong currency, non-purchasable plans, retries, retry after a failed step, early payment extends, rebalance after payment; cron secret, expiry run, reminder sent once, reminder not marked on email failure.

Covered by E2E (production build, fake Supabase API, both widths): pricing copy, home page real inventory only, demo labels, no Verified badge, real listing markup and enquiry form, demo listing labelled, noindexed and closed, paused listing "no longer listed", 404, sitemap, pilot sign-up note, signed-out redirects, no horizontal scroll.

**Not tested end to end:** signed-in seller and admin journeys in a browser, because that needs a real Supabase auth stack. Those rules are covered at the database layer, where they are enforced. Also not tested: a real Paystack sandbox charge, a real Resend send, and pg_cron on the hosted project.

## 5. Risks and manual checks

1. **Merge only after the migrations.** See section 3.
2. **First expiry run** will pause listings of accounts whose paid period already ended (decision 8). The check query lists them first.
3. Accounts on Free that are already over 3 active listings (for example with a hand-set `account_type` and no subscription row) are left as they are; they just cannot add more. Decide case by case in Admin, Users.
4. `published_at` for listings that were live before 0007 is their creation date. Approval times were never stored.
5. Reminder emails send from `Plotmarket <arnold.oshenye@oshylabs.eu>` through Resend (`RESEND_API_KEY` is in Vercel). Change with `EMAIL_FROM`.
6. The terms page section 7 was rewritten to match how billing works (no auto-renew, pilot, pause on expiry). Worth a read by you before merge.
7. After merge, verify on live: sign up, create 3 listings, the 4th is refused; request a pilot; approve it in Admin, Pilots; the listing form locks to the estate.

## 6. Exact plan copy now in the app

**Free Starter**: Free, No time limit. "List up to 3 properties free." Up to 3 active listings; Photos, video and 360° media; Title-document type stated by the seller; Your name and phone shown to buyers. Button: List free.

**Founding Developer Pilot**: Free, 30 days, by approval. "Selected developers can request a 30-day pilot for one estate and up to 20 active listings. Approval required. No card or automatic charge." One estate or project; Up to 20 active listings for 30 days from approval; One assisted setup session with our team; No card, no automatic charge. Button: Request a pilot.

**Business**: ₦35,000 per 30 days. "For agencies and developers listing at volume." Up to 100 active listings; Photos, video and 360° media; Title-document type stated by the seller; Email support; Paid once through Paystack. Does not renew automatically. Button: Choose Business.

**Pilot expiry, shown before requesting**: "When the 30 days end, nothing is deleted and nothing is charged. Your 3 earliest published listings stay live on Free Starter. The rest are paused: hidden from buyers and search, but kept with all their photos and details. Upgrade to Business to bring them back, or choose which 3 stay live."

**Below the plans**: "Larger volumes? If you need more than 100 active listings, talk to us."
