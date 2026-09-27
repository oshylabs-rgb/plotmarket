# Supabase ownership migration: PlotMarket to plotmarketng@gmail.com

Status: **pending**, staged 27 Sep 2026. Needs a session with browser control (Cowork desktop), not a cloud container.

## Goal

Move ownership of Supabase project `qjlwmpbmrdercymcnroz` ("Plotmarket") so that `plotmarketng@gmail.com` (the "plot" browser) owns it and the old account no longer does.

## Chosen route: hand over the organization, not the project

The org `Oshylabs` (slug `crkmwalwmkotzpnahsmi`) exists only for PlotMarket (created 25 Sep 2026). Transferring ownership of the whole org keeps everything identical:

| Stays unchanged | Why it matters |
|---|---|
| Project ref, URL `https://qjlwmpbmrdercymcnroz.supabase.co` | No code or Vercel env change |
| Anon and service role keys | Vercel `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` keep working |
| Auth SMTP (Resend), site URL, redirect list | Signups keep receiving mail |
| Data, storage, users | Nothing is copied, zero downtime |

A project transfer into a new org would also keep the ref and keys, but needs the old account to be Owner of the new org as well; more steps for no gain. A dump and restore to a new project is rejected: new ref, new keys, auth users and storage to migrate, downtime.

## Steps

Pre-flight: confirm which Google account is signed in to supabase.com on each browser. Project memory records the current owner as `cadenceoshylabs@gmail.com`; the request said the Olabs browser (`oshylabs@gmail.com`). Use whichever account the dashboard shows as Owner of org `Oshylabs`.

1. **Current owner browser**: supabase.com/dashboard/org/crkmwalwmkotzpnahsmi/team → Invite → `plotmarketng@gmail.com`, role **Owner**. Invite expires in 24 h.
2. **plot browser** (signed in as plotmarketng@gmail.com): sign up or sign in to supabase.com with that Google account, open the invite email in Gmail, accept.
3. **plot browser**: org team page shows plotmarketng@gmail.com as Owner. Open the Plotmarket project, confirm tables and auth users are visible.
4. Optional: rename the org from `Oshylabs` to `PlotMarket` (Org settings → General).
5. **Current owner browser**: Team → Leave team. Only after step 3 is verified.
6. Rotate the Supabase personal access token used by any CLI or MCP for this project; issue a new one from plotmarketng@gmail.com if automation needs it.

## Verification

- `curl -s https://plotmarket.ng/properties` still renders listing cards.
- Supabase dashboard as plotmarketng@gmail.com: org role Owner, project status Active.
- Old account no longer lists org `Oshylabs`.
- Update `docs/PROJECT_MEMORY.md` infrastructure table (owner line, org name) and mark this file done.

## Notes

- Free plan limit: 2 active free projects per Owner/Admin across their orgs. plotmarketng@gmail.com is a fresh account, so no conflict.
- No billing change: org stays on Free.
