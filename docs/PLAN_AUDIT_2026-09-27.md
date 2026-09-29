# Seller plan audit, 27 Sep 2026

Phase 1 of the Free Starter / Founding Developer Pilot / Paid Business rework. No product code changed. Evidence is file:line against `master` at 691fdc5.

Limitation: the live Supabase project `qjlwmpbmrdercymcnroz` could not be queried from this session (the Supabase connector is signed into a different account). `supabase/migrations/0001_base_schema.sql` is itself a reconstruction, so every RLS finding below is **as reconstructed** and must be confirmed on live with the SQL in section G before Phase 2 migrations run.

## A. Exists and works

| Area | Evidence |
|---|---|
| Next.js 16.2 App Router, Supabase SSR auth, `src/proxy.ts` gates `/dashboard` and `/admin` (admin role checked) | `src/proxy.ts` |
| Listing moderation: new rows default `pending`, public reads filter `status='approved'` in RLS and in `src/lib/listings.ts` | `0001:88`, `listings.ts:20` |
| Seller-stated title document, required select, disclaimers on detail page, footer, area pages, guides, column comment | `listings/new/page.tsx:324`, `PropertyDetail.tsx:261`, `0002:40` |
| Seller name and phone on every listing (profile public read) | `PropertyDetail.tsx:338-361` |
| Paystack one-off charge: `/api/paystack/initialize` → hosted checkout → `/api/paystack/callback` verifies with Paystack → grants plan | `api/paystack/*` |
| Webhook HMAC SHA-512, constant-time compare; returns 500 on DB failure so Paystack retries | `webhook/route.ts:12-22` |
| Idempotency by `paystack_reference` lookup + unique partial index | `webhook/route.ts:68-80`, `0001:130` |
| Admin user delete API checks role server side, refuses admin targets | `api/admin/users/[id]/route.ts` |
| Demo listings carry "(Demo)" in title and description | `supabase/seed_demo.sql` |

## B. Exists but broken or incomplete

| # | Severity | Finding | Evidence |
|---|---|---|---|
| B1 | **Critical** | Any signed-in user can update their own `profiles` row with no column restriction: `role='admin'`, `account_type='enterprise'`, `is_verified=true`. That is admin takeover and free paid plan through a single PostgREST call. | `0001:190-193` `profiles_owner_update`, grants `0004` |
| B2 | **Critical** | Owners can update any column of their own listing, including `status='approved'`, `is_verified`, `is_featured`. Moderation and "Verified" can be self-granted. | `0001:208-211` |
| B3 | **Critical** | Owners can insert and update their own `subscriptions` rows (`status='active'`, any plan, any end date) without paying. | `0001:220-228` |
| B4 | High | Listing limit is client-side only (a `useEffect` in the form). Direct insert through the anon key bypasses it; no DB trigger, no server route. | `listings/new/page.tsx:55-83` |
| B5 | High | Limit counts every row (pending, rejected, sold), not active listings. A Free user with 3 rejected drafts is blocked. | same, `.select('*', {count})` with no status filter |
| B6 | High | No expiry. Paid access is a one-off 30-day charge (no Paystack plan code, no auto-renew), but nothing ever reads `end_date`. One ₦35,000 payment = Professional forever. No cron, no pg_cron, no scheduled job anywhere. | `callback/route.ts:74`, repo-wide |
| B7 | High | "Cancel subscription" is a client-side write that drops the account to `basic` immediately, discarding paid days. It also does not cancel anything at Paystack (nothing recurring exists). | `subscription/page.tsx:62-75` |
| B8 | Medium | `subscription.create` / `subscription.disable` webhook handlers can never fire for current checkouts (transactions carry no plan). No handling of `charge.failed`, `invoice.payment_failed`. | `webhook/route.ts:114-189` |
| B9 | Medium | Callback and webhook race: both look up then insert. The unique index stops a duplicate, but the loser returns an error; on the callback path the paying user sees "subscription setup failed". | `callback/route.ts:58-86` |
| B10 | Medium | Paid UI says "/month" and "Renews: <date>" but nothing renews. | `subscription/page.tsx:150-160` |
| B11 | Medium | Edit button on My Listings does nothing; there is no edit route. Sellers cannot mark sold or unpublish themselves, only delete. | `listings/page.tsx:150-155` |
| B12 | Medium | Inquiry insert RLS checks only `sender_id`; an enquiry can be sent via API to a pending, rejected or sold listing. | `0001:239-241` |
| B13 | Medium | Demo accounts are `is_verified=true`, so demo listings show a green "Verified" badge. Demo agent/developer sit on `starter`/`professional` without subscriptions. Demo rows appear in "Featured Properties / Hand-picked for you" and in area pages and the sitemap as ordinary inventory; the only marker is "(Demo)" in the title. | `seed_demo.sql:50-51`, `PropertyCard.tsx:126`, `HomePage.tsx` |
| B14 | Low | Featured-listing allowance (20/100) is not enforced; featuring is admin-only. Harmless, but the plan text implies self-serve. | `pricing.ts:37` |
| B15 | Low | `0001` is a reconstruction; live schema drift unknown. No tests, no test runner, no E2E framework installed. | `0001:1-18`, `package.json` |

## C. Marketing copy only (no working feature behind it)

| Claim | Where | Reality |
|---|---|---|
| Professional: "Verified lister badge" | `pricing.ts:42` | Manual admin toggle on `profiles.is_verified` with no documented process; not tied to plan. Implies identity verification that is not defined. |
| Professional: "Enquiry analytics" | `pricing.ts:43` | Dashboard shows a count of inquiries. No per-listing or time-series analytics. |
| Professional: "Priority support" | `pricing.ts:44` | No support system or SLA. |
| Professional: "360 degree photos and video tours" | `pricing.ts:41` | Works, but Free gets it too (no gating in `MediaUpload`). Not a paid differentiator. |
| Enterprise: developer page with estate 360 tour, bulk upload, team seats, API access, monthly enquiry report | `pricing.ts:58-63`, `pricing/page.tsx:117` | None exist. No route, table or job for any of them. |
| Home trust bar "Payments secured by Paystack" | `HomePage.tsx:15` | Paystack processes seller plan fees only. Reads as buyer payment protection. |
| Home trust bar "Every listing reviewed before it goes live" | `HomePage.tsx:13` | True in the UI, bypassable via B2. |
| "Featured Properties / Hand-picked properties for you" | `HomePage.tsx` | It is the newest approved listings, featured first. Nothing is hand-picked. |
| "Verified" badge on cards and detail | `PropertyCard.tsx:129`, `PropertyDetail.tsx:244,345` | Ambiguous: buyers will read it as title verified. |

## D. Where the old 90-day / 500 / ₦80,000 offer appears

| Location | Content |
|---|---|
| Repo source, copy, seed, metadata, FAQ, emails | **Not present.** No "90 day", "trial" or ₦80,000 string in the current tree. The app sends no transactional email itself (Supabase Auth templates only). |
| `src/constants/pricing.ts:76-78` | `LEGACY_PLAN_LIMITS.business = { listings: 500 }`, still honoured for any account with `account_type='business'`. |
| `src/types/database.ts:3`, `0001:33` enum | `'business'` account type (the old ₦80,000 self-serve plan from commit df0eb24). |
| `src/constants/changelog.ts:17` | Public changelog: "Existing Starter and Business subscriptions keep their limits until they end." |
| Google Doc "Untitled document" (B2B outreach pack, 4 Sep 2026, id `1YTe76qkDYKiTcr7iaQLlJcQjL8jKqWy4oNmDZ3NEYpc`, owned by the personal Drive) | Email subject line, email body, WhatsApp script, call script, LinkedIn DM, objection handling and the close all offer "Business plan free for 90 days: 500 listings, bulk upload, a developer page, and a monthly report of enquiries… Normal price is ₦80,000 a month", "offer stays open until {offer_end_date}". Also asserts diaspora buyers "come to us", which is unevidenced. |
| Live DB | Unknown. Needs query G2 for any `business` accounts or subscriptions. |

Whether any company **accepted** the 90-day offer is unverified. No match in the personal Gmail. The pack says sends go from `arnold.oshenye@oshylabs.eu` (Zoho), which was not searched. **Resolved 28 Sep:** Zoho (all folders, about 710 messages) and Resend (all sends since 1 Sep) searched; the offer was never sent and nobody accepted it. No pilots are owed.

## E. Where Free users reach paid-only capabilities

1. Self-upgrade to any plan or to admin via `profiles` update (B1).
2. Self-insert an active subscription (B3).
3. Exceed 3 listings via direct insert (B4).
4. Self-approve, self-feature, self-verify listings (B2).
5. 360 media and video: available to all tiers (by design today, but listed as a Professional feature).
6. After one payment, keep Professional indefinitely (B6).

## F. Owner decisions (all approved 27 Sep 2026)

1. Security holes B1 to B3 fixed first, in their own PR (migration 0005), ahead of plan work. B12 (inquiries) and an unreported one found while fixing, Paystack charges granting a plan without checking the amount paid, ride in the same PR.
2. Business allowance = **100 active listings**, active meaning `pending` or `approved`. Rejected, sold and paused do not count.
3. Business billing stays a one-off ₦35,000 charge for **30 days, renewed by hand**. No automatic charge, no billing change. Copy says "per 30 days"; access is enforced to end at `end_date`.
4. Business shows only working features: 100 active listings, photos, video and 360 media, title document and seller shown, email support. Verified badge, analytics, priority support and "20 featured" come off.
5. Enterprise card is replaced by the Founding Developer Pilot card plus a "Larger volumes? Talk to us" line with no feature list.
6. Pilot expiry: nothing deleted. The 3 **earliest published** listings stay live under Free Starter, the rest become **Paused** (hidden from search, detail page says no longer listed, enquiries blocked). Seller can swap which 3 are live or upgrade to restore all. Warning email 7 days before.
7. One estate = a project record the admin names on approval (estate name, state, area). Every pilot listing must reference it, enforced server side.
8. Existing `business` and `starter` accounts keep their limits to their current `end_date`, then fall to Free under rule 6. No price changes.
9. Anyone who accepted the 90-day outreach offer is honoured as an admin-granted pilot matching the promised end date. The outreach pack is retired and redrafted.
10. Verified badges come off public pages until a documented verification process exists. Admins keep the flag internally.
11. Demo listings get an `is_demo` flag and a "Demo listing, not for sale" label, are excluded from the home strip, sitemap and area pages, and cannot receive enquiries.

## G. Live checks to run before Phase 2 (read only)

```sql
-- G1 policies as they really are
select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname='public' order by 1,2;
-- G2 plan and billing exposure
select account_type, role, count(*) from profiles group by 1,2;
select plan, status, count(*), count(paystack_reference), min(end_date), max(end_date) from subscriptions group by 1,2;
-- G3 listings per seller by status, and anyone already over 3 active
select user_id, count(*) filter (where status in ('pending','approved')) active, count(*) total from properties group by 1 having count(*) filter (where status in ('pending','approved')) > 3;
-- G4 demo rows
select count(*) from properties where title ilike '%(demo)%';
```
