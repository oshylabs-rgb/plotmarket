# Plotmarket Founding Developer Pilot: outreach pack

Version 1, 28 Sep 2026. Replaces the 4 Sep 2026 pack (Google Doc "Untitled document", personal Drive, id `1YTe76qkDYKiTcr7iaQLlJcQjL8jKqWy4oNmDZ3NEYpc`) which offered "Business free for 90 days, 500 listings, ₦80,000 a month". That offer is retired. Do not send anything from the old doc.

Sender: Arnold Oshenye, `arnold.oshenye@oshylabs.eu`, +234 803 217 9317.
Copy in the boxes below is ready to send. It has no hyphens or dashes on purpose; keep it that way when editing.

---

## 1. The offer, exactly

Source of truth is `src/constants/plans.ts`. If this section and that file ever disagree, the file wins and this doc is wrong.

| | Free Starter | Founding Developer Pilot | Business |
|---|---|---|---|
| Price | Free | Free | ₦35,000 per 30 days |
| Listings | 3 active | 20 active, one estate or project | 100 active, any projects |
| Length | No limit | 30 days from the moment we activate it | 30 days per payment |
| How | Sign up | Request in the dashboard, we approve | Paystack, paid once, does not renew |
| Extras | | One setup session with Arnold | Email support |

All plans: photos, video and 360 tours; the seller states the title document; buyers see the seller's name and phone and can send an enquiry to the seller's Plotmarket inbox.

When a pilot ends: nothing is deleted and nothing is charged. The 3 earliest published listings stay live on Free Starter. The rest are paused (hidden, kept with all photos) until the developer pays for Business or picks which 3 stay live.

One pilot per account and per CAC number.

## 2. What we must never say

| Never | Why |
|---|---|
| "Verified", "verified title", "verified developer" | We do not verify title or identity. Listings say the title is stated by the seller. |
| Any visitor, buyer or enquiry number | We have no real listings yet (28 Sep: 0 real, 8 demo). Say we are new. |
| "Diaspora buyers come to us" or similar | Unevidenced. The old pack said it. |
| "Escrow", "secure payment", "we protect your money" | Plotmarket never holds money for property. Paystack takes the plan fee only. |
| "90 days", "500 listings", "₦80,000", "3 months free" | Retired offer. |
| "Free forever" about the pilot | It is 30 days. Free Starter is the free forever part, 3 listings. |
| "Developer page", "bulk upload", "enquiry reports", "API", "team seats" | Not built. |
| "Auto renew", "subscription" | Business is a one off payment for 30 days. |

## 3. Who to contact

Developers selling a current estate or project, with a CAC registered company and 5 to 20 plots or units to list now. Start with the areas Plotmarket already has pages for: Lekki, Ajah, Ibeju Lekki, Epe, Ikorodu, Ikeja (Lagos); Gwarinpa, Lugbe, Kubwa (Abuja); Mowe and Ibafo (Ogun); Ibadan; Port Harcourt.

Use contact details the company publishes for sales or business enquiries: its website, its LinkedIn company page, its own adverts. Not personal numbers from private groups, not bought lists.

Estate agencies with more than 20 listings are Business prospects, not pilot prospects. Send them the pricing page instead.

## 4. Data protection (NDPA 2023) rules for every send

1. Business contacts only, at the business address or line they publish. Lawful basis: legitimate interest in offering a relevant B2B service.
2. Log where each contact came from (URL or source) in the tracker before sending.
3. Every first message says who we are and how to stop. The email line "Reply no and I won't email again" does this.
4. One "no", "stop" or "remove" ends it. Add them to the suppression list the same day, across every channel.
5. No more than 2 follow ups after the first message. Nothing after that.
6. If someone asks where we got their details, tell them the source from the tracker.
7. Never paste contact lists into shared docs outside the Oshylabs workspace.

## 5. Tracked links

Use these, not bare links. The admin dashboard (`/admin`, Traffic and funnel) shows visits by campaign, so we can see which channel brings sign ups.

| Channel | Link |
|---|---|
| Email | `https://plotmarket.ng/register?plan=pilot&utm_source=email&utm_medium=outreach&utm_campaign=pilot-oct26` |
| WhatsApp | `https://plotmarket.ng/register?plan=pilot&utm_source=whatsapp&utm_medium=dm&utm_campaign=pilot-oct26` |
| LinkedIn | `https://plotmarket.ng/register?plan=pilot&utm_source=linkedin&utm_medium=dm&utm_campaign=pilot-oct26` |
| Pricing, any channel | `https://plotmarket.ng/pricing?utm_source=<channel>&utm_medium=outreach&utm_campaign=pilot-oct26` |

`?plan=pilot` opens registration as a developer with the pilot explained. After sign up they request the pilot from Dashboard, Plan. Arnold (or Claude on his instruction) approves it in `/admin/pilots`; the 30 days start at approval.

## 6. Cold email

Subject: `20 free listings for {estate_name}`

```
Hi {first_name},

I run Plotmarket (plotmarket.ng), a property listing site for Nigeria. I'm picking a few developers to list one estate free for 30 days, and {estate_name} is the kind of project I want on it.

You get up to 20 active listings with photos, video and 360 tours, and one setup session with me to get them live. Buyers see your name and number and contact you directly. It costs you nothing and we take no commission on sales.

We're new. You would be one of the first developers on the site.

After 30 days nothing is deleted or charged. Three listings stay up free and the rest pause until you decide.

Worth 15 minutes this week?

Arnold Oshenye
Plotmarket, Oshylabs Ltd
+234 803 217 9317
{email_link}

Reply no and I won't email again.
```

## 7. WhatsApp or SMS

Only to a number the company publishes for sales or enquiries. Send from the Nigerian line.

```
Hi {first_name}, Arnold from Plotmarket (plotmarket.ng). I'm inviting a few developers to list one estate free for 30 days. Up to 20 listings with photos, video and 360 tours, and I set it up with you. It's free and we take no commission. Can I send you the details for {estate_name}?
```

## 8. LinkedIn DM

```
{first_name}, I run Plotmarket, a Nigerian property listing site. I'm giving a few developers 30 days to list one estate free, up to 20 listings, and I do the setup with you. {estate_name} looks like a good fit. Open to a quick call?
```

## 9. Call opener

```
Hi {first_name}, it's Arnold from Plotmarket. Thirty seconds and you can tell me no.
We're a new property listing site. I'm letting a small group of developers list one estate free for 30 days, up to 20 listings, and I help set it up.
Is {estate_name} still selling?
```

If yes: book the setup session, then send the WhatsApp or email link so they can register.

## 10. Follow ups

Day 3:

```
Hi {first_name}, following up on the Plotmarket pilot for {estate_name}. 30 days, 20 listings, free, and I set it up with you. Worth a call, or should I leave it?
```

Day 8, last one:

```
Last note from me on this. If {estate_name} is sold out or it's not for you, no problem. If you want the pilot later, it's here: {link}
```

## 11. Replies to common questions

What's the catch?
```
No catch. After 30 days you either stay free with 3 live listings, or pay ₦35,000 for 30 days of Business, up to 100 listings. One payment, no auto renewal. Nothing is charged unless you choose to pay.
```

How many buyers do you get?
```
We're new, and I won't give you a number I can't show you. Every listing gets its own page built for Google, and we have area pages for places like Lekki, Ibeju Lekki and Lugbe. The pilot is how we find out together.
```

Do you verify titles?
```
No. You state the title document, C of O, Governor's Consent and so on, and the listing shows it as stated by you. We review every listing before it goes live, but we don't check ownership or title, and the page tells buyers that.
```

Do you take a commission or handle payment?
```
No. Buyers deal with you directly. Plotmarket never holds money for property.
```

Can I list more than one estate?
```
The pilot is one estate. For more, Business covers up to 100 listings across any of your projects for ₦35,000 per 30 days.
```

What happens to my listings after 30 days?
```
Nothing is deleted. Your 3 earliest listings stay live free. The rest are hidden but kept with all their photos, and come back the moment you move to Business.
```

I got your 90 day offer
```
That offer has closed and the 30 day pilot replaced it. If you accepted it in writing before 28 September, reply to that thread and I'll honour the date I gave you.
```
Then, if the acceptance is on record: grant the pilot in `/admin/pilots`, "Grant a pilot directly", with the end date that was promised.

Send me something to read
```
Sure. Plans and what happens at the end of the pilot are here: {pricing_link}. Happy to talk it through on a call.
```

## 12. Cadence and targets

| Day | Action |
|---|---|
| 0 | Email |
| 1 | WhatsApp, only if they publish a sales number and have not replied |
| 3 | Follow up 1, same channel as the first reply or email |
| 8 | Follow up 2, last |

Up to 20 new contacts a day. Log each one in the tracker: company, contact, source URL, channel, date, reply, outcome.

October targets, not claims: 5 pilots active, 60 real listings live, 1 Business payment by the first pilot's end date. Check `/admin` weekly: campaign visits, sign ups, pilot requests, live listings.

## 13. People who signed up but have not listed

Highest value contacts: they already chose Plotmarket. Find them in `/admin` Users (agent or developer, no listings). Send from `arnold.oshenye@oshylabs.eu`, once, then one follow up at most.

Agent:
```
Hi {first_name}, you signed up to Plotmarket on {signup_date} but haven't listed anything yet. What stopped you? If it's time, send me the details and photos of up to 3 properties on WhatsApp or email and I'll put them up with you. Free, no card.

Arnold, Plotmarket
+234 803 217 9317
```

Developer with an estate: use section 6 but open with "You signed up to Plotmarket on {signup_date}" instead of the first line, and link to Dashboard, Plan to request the pilot.

## 14. Voice check

Drafted and passed through the arnold-voice rules on 28 Sep 2026 (baseline rules; the voice memory file was not reachable from the build session). DM and LinkedIn are an unsampled register for Arnold's voice, so treat those two as closest guess and correct them freely. Corrections go to the voice memory so the next pack is closer.
