# Practice Leadership Summit 2027 — website

The public website for the summit (Sat Jan 9 – Sun Jan 10, 2027, North Jersey), hosted by Kasper in partnership with Global Academy of Dentistry.

Everything happens on one page. **Registration** and **pre-work** open as pop-up forms when a visitor presses a button. Submissions go straight into the Airtable base **Practice Leadership Summit 2027**, which means:

- the practice appears in the **team console** within 30 seconds,
- Airtable's email automations send the **confirmation to the practice** and a **notification to the summit inbox**,
- the **live table map** on the website updates (e.g. "34 of 35 tables open").

```
Visitor ──> website pop-up form ──> /api/register or /api/prework (server, holds the Airtable key)
                                            │
                                            ▼
                               Airtable base "Practice Leadership Summit 2027"
                                  │                       │
                     Airtable automations          Team console (Claude page)
              (confirmation + summit inbox email)   reads and updates the same records
```

## What's in the folder

| Path | What it is |
| --- | --- |
| `index.html` | The whole page: hero, four questions, agenda, take-home kit, faculty, price builder, register, pre-work, FAQ, and the two pop-up forms |
| `assets/styles.css` | All styling (light and dark mode, phone layout, pop-ups) |
| `assets/app.js` | Countdown, live table map, agenda tabs, price builder, pop-up forms. **Settings at the top** (summit inbox, dates) |
| `api/register.js` | Saves a registration to Airtable and returns the registration number (e.g. PLS-007) |
| `api/prework.js` | Saves pre-work, after checking the registration number exists |
| `api/stats.js` | Counts registrations for the live table map (cached 60 seconds) |
| `api/_lib/airtable.js` | Airtable connection, field IDs, spam and rate limits |
| `dev-server.js` | Local preview |

No packages to install. Needs Node 18 or newer.

## Go live on Vercel (about 15 minutes)

1. **Create an Airtable token.** Go to https://airtable.com/create/tokens → *Create token*. Scopes: `data.records:read` and `data.records:write`. Access: only the base **Practice Leadership Summit 2027**. Copy the token.
2. **Put the code on Vercel.** Either push this folder to a GitHub repository and choose *Add New → Project* in Vercel, or run `npx vercel` inside the folder. No build settings are needed; leave the framework as *Other*.
3. **Add the token.** Vercel → Project → *Settings → Environment Variables*: add `AIRTABLE_TOKEN` with the token from step 1. Redeploy.
4. **Add your domain.** Vercel → *Settings → Domains*, e.g. `summit.kasper.com`. Vercel shows the DNS record to add.
5. **Set the summit inbox.** Done: the inbox is Programs@amalandcompany.com (`INBOX` in `assets/app.js` and both Airtable automations). Turn both automations **on** in Airtable:
   - *New registration: confirm to practice, notify summit inbox, set status*
   - *Pre-work received: thank the practice, notify summit inbox*
6. **Test once.** Register a test practice on the live site, check it appears in Airtable and the console and that both emails arrive, then delete the test record in Airtable.

## Try it on your computer first

```bash
npm run dev:mock    # fake in-memory data, nothing is saved — open http://localhost:3000
npm run dev         # real Airtable — copy .env.example to .env and add AIRTABLE_TOKEN first
```

## Switching to Supabase, designed emails and the /admin console

The site now runs on any of three data stores and picks one from the settings in Vercel:
Supabase if `SUPABASE_URL` is set, otherwise Airtable (as before). Nothing changes until you add the settings below.

**1. Database (Supabase, free plan is enough)**
1. Create a project at supabase.com (region: US East).
2. SQL Editor → New query → paste `supabase/schema.sql` → Run.
3. Project Settings → API: copy the Project URL and the `service_role` key.

**2. Email (Resend, free plan: 3,000 emails a month)**
1. Create an account at resend.com → Domains → add the sending domain (for example `send.yoursummitdomain.com`).
2. Add the DNS records Resend shows (SPF, DKIM, and a DMARC record) at that domain's DNS host; wait for "Verified".
3. API Keys → create a key with "Sending access".

**3. Vercel → Project → Settings → Environment Variables**

| Name | Value |
|---|---|
| `SUPABASE_URL` | the Project URL |
| `SUPABASE_SERVICE_KEY` | the `service_role` key (server only, never in the page) |
| `RESEND_API_KEY` | the Resend key (`re_…`) |
| `EMAIL_FROM` | `Practice Leadership Summit <hello@send.yoursummitdomain.com>` |
| `EMAIL_REPLY_TO` | the inbox replies should reach (default Programs@amalandcompany.com) |
| `TEAM_EMAILS` | who gets the "new registration" notice, comma-separated |
| `ADMIN_EMAILS` | who can sign in to /admin: emails separated by commas, or a whole domain like `@amalandcompany.com` |
| `ADMIN_SECRET` | any long random text, 32+ characters |
| `CRON_SECRET` | any long random text; Vercel uses it for the daily email run |
| `GOOGLE_PLACES_API_KEY` | optional: drafts each report note from the practice’s positive Google reviews |
| `SITE_URL` | `https://practice-leadership-summit.vercel.app` (or your own domain) |

Redeploy. Then: open `/admin`, sign in with your email, fill in the event details on the Emails tab,
and approve the emails you want sent. In Airtable, turn off the two old email automations.

**What sends what**
- On registration: the confirmation to the owner (team members copied) and a notice to `TEAM_EMAILS`.
- On pre-work: a thank-you to whoever sent it and the owner.
- From the console's Report tab: "Email it to the office" sends the private Practice Snapshot link.
- Every morning at 9 am Eastern: approved journey emails that are due (dates are in `api/_lib/journey.js`).
- Every email is logged and never sent twice to the same practice.

Existing Airtable registrations are not copied automatically; tell Claude when you switch and it will move them.

Local test without any accounts: `STORE_MOCK=1 ADMIN_EMAILS=you@example.com npm run dev`. Emails are written to `.outbox/`
and the sign-in link appears on the sign-in screen.

## Common edits

- **Text, sessions, speakers, FAQ:** edit `index.html` (each section is labelled by `id`, e.g. `id="days"`, `id="faq"`).
- **Prices:** the ladder lives in two places that must match: `price()` in `assets/app.js` (what visitors see) and the **Price** formula field in Airtable (what is invoiced).
- **Keynote speakers:** replace the "Two keynote speakers · Announced late November" card in the Faculty section.
- **Early-bird date:** `EARLY_END` in `assets/app.js` and the date in the Airtable Price formula.

## Safety built in

- The Airtable token stays on the server; the browser never sees it.
- Every field is checked and length-limited on the server; select values must match the allowed list.
- A hidden "honeypot" field quietly drops most spam bots, and each visitor is limited to 8 submissions per 10 minutes.
- Pre-work is only accepted for a registration number that exists.

## Hosting elsewhere

The `api/` handlers use the standard Node `(req, res)` signature that Vercel runs as-is. On Netlify, Cloudflare or your own server, wrap each handler in that platform's function format, or run `dev-server.js` behind any Node host (set `PORT`).

## Questions

Every question on the registration and pre-work forms lives in `api/_lib/questions.js`, with why we ask it and which part of the Practice Report it feeds. The website's step-by-step pop-ups (`assets/wizard.js`) and the server checks are built from that file. After changing a question, run `npm run questions` to refresh `assets/questions.js`, then commit both. New answers need a matching Airtable field: put its field ID in `f`.
