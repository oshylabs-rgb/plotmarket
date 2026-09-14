# Plotmarket Vercel review, 3 September 2026

Project `prj_Et3GQvplmJUrFDzg0Jl39AWmGFSc`, team `vetts-projects-3acfed86`,
production `plotmarket.ng`. Re-verified in a real browser after the first pass.

**Headline: production is healthy.** PR #1 is merged and live at v0.4.0, the
database is connected, all eight seeded listings render with their title
document stamps and 360 badges, and there have been no runtime errors in seven
days.

---

## Correction to the first pass

The first version of this review claimed production was pointed at the wrong
Supabase project, on the evidence that the home page rendered "No properties
yet". **That was wrong and I withdraw it.**

The home page and the properties index are both client components that load
data in `useEffect`. A plain HTTP fetch does not execute JavaScript, so it only
ever sees the pre-hydration shell, and the empty state is what that shell
contains by definition. Re-checked in a real browser, `/properties` reports
**"8 properties found"** with correct Naira prices, `C OF O`, `EXCISION`,
`GOV. CONSENT`, `DEED`, `GAZETTE`, `REG. SURVEY` and `FAMILY RECEIPT` stamps,
360 badges on two listings, and verified markers.

No environment variable change is needed. Worth confirming
`SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_APP_URL` are set in Production
regardless, since both fail silently, but there is no evidence either is wrong.

Similarly, `/properties` returning the old footer was **edge cache on the bare
path only**. `/properties?cb=1` returns the current build. It expires on its
own. Forcing the route dynamic would have been the wrong fix: it would push
every request through a lambda for no benefit and make the page slower for the
exact audience this site is built for.

---

## What changed in this pass

### 1. The 360 viewer no longer redraws forever

`src/components/Viewer360.tsx` ran a permanent `requestAnimationFrame` loop from
mount, redrawing at 60fps for the life of the page even when the panorama was a
still image, scrolled off screen, or the tab was in the background.

For a still panorama nothing changes between frames unless the visitor drags or
zooms, so that was pure battery drain on an audience that is overwhelmingly on
mobile.

Now:

- a still panorama draws once on load, then only on drag, pinch, wheel or resize
- a continuous loop runs only while a 360 **video** is actually playing
- an `IntersectionObserver` stops all drawing when the viewer is off screen
- `visibilitychange` stops all drawing when the tab is hidden

Same visual behaviour, a fraction of the CPU.

### 2. Functions moved from `iad1` to `fra1`

Added `vercel.json`:

```json
{ "regions": ["fra1"] }
```

Production functions were running in Washington DC while the entire audience is
Nigerian. Server work is narrower than it first appears, because the listing
pages query Supabase directly from the browser, but `proxy.ts` runs on every
`/dashboard/*` and `/admin/*` request and now does an auth call plus a
`profiles` lookup for the admin role check. Every one of those was crossing the
Atlantic twice.

Lagos to Frankfurt is roughly 90ms against roughly 150ms to Virginia, so the
user-facing leg improves regardless of where the database sits.

**Two caveats, please check both.**

1. I could not confirm the Supabase region for `lmfsqfwdgxlsuozxyauy` from here.
   If it is in `us-east-1` rather than the EU, the database leg gets worse even
   though the user leg improves. Check it in Supabase project settings. If it is
   US East, either move the region back or, better, move the Supabase project to
   an EU region to match the audience.
2. On a Hobby plan `regions` in `vercel.json` can fail the build. If it does,
   delete `vercel.json` and set the region in Project Settings, Functions,
   Function Region instead.

Measure it rather than trusting the theory:

```powershell
curl -o NUL -s -w "%{time_total}\n" https://plotmarket.ng/dashboard
```

---

## Left alone deliberately

**Preview deployments behind Vercel SSO.** `ssoProtection` is on for everything
except custom domains. Production is open, previews need a login. That is the
right setting and I have not touched it. It only means that testing a preview on
a handset needs a Vercel login on that handset first.

**Demo listings.** All eight carry `(Demo)` in the title, so the earlier concern
about unmarked fake inventory is already handled. Worth deciding when they come
down, but nothing is misleading anyone today.

---

## Not verified

The 360 viewer renders on production: the canvas mounts, the WebGL context is
acquired, the shader programme links and the flat fallback does not fire. I
could not confirm the image visually, because `requestAnimationFrame` does not
run in a hidden browser pane, which is what turned up the battery issue above.
Claude Code's commit message records the shader maths as verified by framebuffer
readback against analytic UVs, which is a stronger check than eyeballing it.

After the next deploy, open a listing with a 360 tour on a phone and confirm the
panorama paints and drags. That is the one thing still worth a human look.

---

## Still needs Arnold

`sales@plotmarket.ng` is used on the pricing page and the Enterprise CTA.
Confirm the mailbox exists or repoint it to `arnold.oshenye@oshylabs.eu`.
