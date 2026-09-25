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
- `curl https://plotmarket.ng/` HTML contains at least one real listing title and not "No properties yet" (needs the server render fix, see open items)
- `curl https://plotmarket.ng/properties` HTML contains listing cards and no spinner (same dependency)
- `curl https://plotmarket.ng/properties/<any approved listing id>` contains a `RealEstateListing` JSON-LD block and the seller name (get an id with `select id from public.properties where status='approved' limit 1`)
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
2. Super admin: `superadmin@plotmarket.ng` must exist in the new project (Authentication → Users → Add user) and be promoted with `update public.profiles set role='admin', account_type='enterprise', is_verified=true where email='superadmin@plotmarket.ng'`.
3. Security advisors: re-run `supabase db advisors --linked --project-ref qjlwmpbmrdercymcnroz --type security` after the first real users arrive; enable leaked password protection.
6. Legacy `starter` and `business` plan ids are still honoured for existing subscribers via `LEGACY_PLAN_LIMITS` in `src/constants/pricing.ts`.
