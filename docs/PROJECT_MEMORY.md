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
| Database and auth | Supabase project `lmfsqfwdgxlsuozxyauy` (eu-west-1) | **Shared with ProfileProof.** The project is named `profileproof` and holds both apps' tables (`analyses`, `pp_profiles`, `purchases`, `safety_blocks` are ProfileProof's; `properties`, `profiles`, `inquiries`, `subscriptions`, `user_consents` are PlotMarket's). Auth settings, email templates, SMTP sender and site URL are project wide, so every auth change affects both apps. |
| Supabase org | Owned by `hemsmartltd@gmail.com` (org `pmcerzzkmoiiqlenkzrf`) | A new org `Oshylabs` (slug `crkmwalwmkotzpnahsmi`) exists under `cadenceoshylabs@gmail.com`; the transfer is pending, see open items. |
| Payments | Paystack, keys in Vercel env | webhook at `/api/paystack/webhook` needs `SUPABASE_SERVICE_ROLE_KEY` |
| Email | Resend, verified domain `oshylabs.eu` | see below |

## Auth email arrangement

Supabase Auth already sends through **custom SMTP on Resend** (`smtp.resend.com`, port 465, user `resend`). The sender is currently `ProfileProof <no-reply@oshylabs.eu>` because the project is shared. Resend's log shows "Confirm your email address" mails delivering since August. Keys are never written here; they live in Supabase (SMTP password) and Vercel (`RESEND_API_KEY`, key "Plotmarket - App", currently unused by code).

Known gap as of 25 Sep: `https://plotmarket.ng/auth/callback` and `https://plotmarket.ng/**` must be in Authentication → URL Configuration → Redirect URLs. Until they are, confirmation links fall back to the project site URL (`https://www.oshylabs.eu/profileproof.html`) instead of logging the user in on plotmarket.ng.

Symptom to remember: registering an address that already exists shows the "Check your email" screen but sends nothing (Supabase hides account existence). Check `auth.users` before assuming mail is broken.

## Vercel production environment

Must exist: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (sensitive, cannot be pulled), `NEXT_PUBLIC_APP_URL=https://plotmarket.ng`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `RESEND_API_KEY`. Verified present on 25 Sep.

## Post deploy verification checklist

Run after every production deploy. All must pass.

- `https://plotmarket.ng/robots.txt` returns 200 and contains `Sitemap: https://plotmarket.ng/sitemap.xml`
- `https://plotmarket.ng/sitemap.xml` returns 200 with at least 30 URLs including `/guides/` and `/land-for-sale/` pages
- `https://plotmarket.ng/pricing` shows exactly Free, Professional ₦35,000, Enterprise
- `curl https://plotmarket.ng/` HTML contains at least one real listing title and not "No properties yet" (needs the server render fix, see open items)
- `curl https://plotmarket.ng/properties` HTML contains listing cards and no spinner (same dependency)
- `curl https://plotmarket.ng/properties/e92c11e3-5545-48b5-88b4-440eb25fa05a` contains a `RealEstateListing` JSON-LD block and the seller name
- `https://plotmarket.ng/land-for-sale/lagos/lekki` and `https://plotmarket.ng/guides/how-to-verify-land-title-in-nigeria` return 200
- A fresh registration on `/register` receives its confirmation email and the link lands on plotmarket.ng

## What changed on 25 Sep 2026

- Overlay recovered from deployment `dpl_HZ8dAz8zaKJDGPNh1pwhrhEQqiTd` and merged to master (PR #3): robots, sitemap, OG image, 3 guides, 12 area pages, three tier pricing, per-route metadata, JSON-LD, public anon Supabase client.
- First git triggered production deploy since 13 Sep; robots, sitemap (38 URLs), pricing, guides and area pages verified live.
- `RESEND_API_KEY` added to Vercel production.
- Supabase org `Oshylabs` created under the cadence account.
- Tracking issue: github.com/oshylabs-rgb/plotmarket/issues/2

## Open items and risks

1. **Public listing pages are still client rendered.** `/`, `/properties` and `/properties/[id]` serve "No properties yet" or a spinner to crawlers. The prepared patch `0001-Server-render-the-public-listing-pages.patch` was not in the working directory; apply it on a branch from master, resolve the three page files by keeping the patch's Server Component structure and the overlay's metadata, and open a PR.
2. **Redirect URLs** for plotmarket.ng not yet in the Supabase allow list (see above). One click in the dashboard.
3. **Shared Supabase project.** Any PlotMarket branded change to sender name, site URL or email templates changes ProfileProof too. The clean fix is a dedicated Supabase project for one of the apps, which means a data and auth-user migration; decide before growth makes it harder.
4. **Project transfer** to the `Oshylabs` org is pending: invite `hemsmartltd@gmail.com` as Owner of `Oshylabs`, accept, then Project Settings → General → Transfer project.
5. Security advisor warnings (no RLS changes made): leaked password protection disabled; `handle_new_user`, `pp_handle_new_user`, `is_admin`, `invoke_purge`, `rls_auto_enable` are SECURITY DEFINER and executable by `anon`; `pg_net` installed in `public`; `pp_set_updated_at` has a mutable search_path.
6. Legacy `starter` and `business` plan ids are still honoured for existing subscribers via `LEGACY_PLAN_LIMITS` in `src/constants/pricing.ts`.
