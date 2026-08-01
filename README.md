# QR DNA

Dynamic QR codes that stay editable after they're printed — with scan analytics,
time- and device-based routing, and digital business cards.

![Next.js](https://img.shields.io/badge/Next.js-16-000000.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e.svg)
![Tests](https://img.shields.io/badge/tests-121-brightgreen.svg)

A static QR code bakes its destination into the pixels. Reprint the sign, or the
URL changes, and the code is dead. QR DNA encodes a short code that resolves
server-side on every scan, so the destination stays editable for the life of the
printed asset — and every scan becomes a data point.

**Every feature is currently free.** Billing is switched off behind a flag; see
[Billing](#billing) below.

---

## What it does

### Dynamic redirects

Each code encodes a short URL. A scan hits the redirect endpoint, which resolves
the destination at request time through a priority chain:

```
short code → scheduled redirects → routing rules → base destination
                    ↓ (if inactive or past expiry)
             branded expiry page (HTTP 410)
```

- **Scheduled redirects** — day-of-week and time-of-day windows, each with its
  own IANA timezone. A restaurant code points at the lunch menu 11:00–15:00 and
  the dinner menu after, evaluated in the venue's local time via
  `Intl.DateTimeFormat` rather than server time.
- **Routing rules** — override the destination by device type, `Accept-Language`,
  or country. Country is read from Cloudflare (`cf-ipcountry`) or Vercel
  (`x-vercel-ip-country`) geo headers.
- **Expiry pages** — an expired or deactivated code serves a branded HTML page
  with configurable copy, colors, and CTA instead of a dead 404.
- **Versioning** — destination history is retained in `qr_code_versions`, so a
  printed code's routing can be rolled back.

### Scan analytics

Every scan writes a `scan_events` row with parsed device, OS, browser, referrer,
IP, and approximate location taken from the edge network's geo headers.
Uniqueness is determined by an IP + user-agent match inside a rolling 24-hour
window, so repeat scans from the same phone don't inflate reach.

Link-preview crawlers are told apart from people. Pasting a short link into
Slack, iMessage, WhatsApp, Facebook or X makes that platform fetch it to build a
preview, and those fetches were previously indistinguishable from a scan. They
are still recorded, flagged `is_bot`, and left out of every count and export.

Counters increment through a Postgres RPC (`increment_scan_counters`) to stay
atomic under concurrency, with a read-modify-write fallback if the RPC is absent.
The RPC refuses to count a flagged scan, so the rule does not rely on every
caller remembering it. Scan logging failures never block the redirect — the user
gets where they're going even if telemetry fails.

Dashboard covers time series, device breakdown, browser/OS split, geography,
referrers, and CSV export.

### QR types

Nine encoders in `src/lib/qr/encoders.ts`, each emitting the payload format
scanners expect:

`URL` · `Text` · `Email` · `Phone` · `SMS` · `WiFi` · `vCard` · `Geo` · `Calendar event`

App Store links are offered as a tenth option in the editor and encode as a URL.

### Contact cards

A vCard code can carry a full contact — multiple phone numbers and email
addresses with type labels, several websites, a postal address, social profiles,
and a headshot — built against RFC 2426 with correct escaping, CRLF line
endings, and octet-aware line folding.

The headshot is the interesting constraint. A QR code holds at most 2,953 bytes;
a usable portrait is 10–30 KB once base64-encoded, so it cannot go inside the
symbol. Contact codes therefore come in two shapes:

| Mode | The QR contains | Photo | Works offline |
|------|-----------------|-------|---------------|
| Encoded | the vCard text itself | no | yes, forever |
| Linked | `/c/<short code>` | yes | needs a network |

Linked cards resolve to a `.vcf` download with the photo embedded as
`PHOTO;ENCODING=b` — the only form iOS and macOS Contacts actually render, since
neither follows a remote `PHOTO` URL. The editor shows a live byte budget while
you type and switches modes automatically when a photo is attached.

### Digital business cards

Hosted card pages at `/card/[slug]` in four layouts (centered, split, minimal,
left-aligned), with social links, action buttons, `.vcf` download, and their own
view tracking in `card_view_events`.

### Styling and export

`qr-code-styling` drives dot shapes, corner styles, gradients, and logo
embedding, with a template browser over saved `style_templates` and a built-in
UTM builder.

Export covers PNG, JPEG, WebP, SVG, and PDF. SVG and PDF are true vector — the
PDF is produced by `svg2pdf`, sized in millimetres and pages to the code with a
6 mm quiet zone, so it drops straight into a print layout.

### Billing

Stripe is wired end to end — monthly and annual prices, a customer portal, and
webhook-driven entitlement — but **the paywall is currently off**.

`BILLING_ENABLED` in `src/lib/billing/flags.ts` reads
`NEXT_PUBLIC_BILLING_ENABLED` and defaults to false. While it is off, `isPro()`
and `requirePro()` short-circuit, every gate opens, and the upgrade surfaces are
hidden. Set the variable to `true` and redeploy to restore the paywall; no code
changes are involved.

Two related predicates, easy to confuse:

- `isPro()` — *may this user use the feature?* True for everyone while billing is
  off. Gate on this.
- `hasPaidPlan()` — *is this user actually paying?* Ignores the flag. Display
  only; never gate on it.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5, Zod schemas |
| Styling | Tailwind CSS 4 with OKLCH tokens, shadcn/ui on Radix |
| Data | Supabase — Postgres, Auth, row-level security |
| Payments | Stripe (currently disabled by flag) |
| State | Zustand |
| QR rendering | `qr-code-styling` |
| PDF | `jspdf` + `svg2pdf.js` |
| Charts | Recharts |
| Motion | Framer Motion, Lottie |
| Testing | Vitest, Testing Library (jsdom) |

### Schema

Eight tables: `profiles`, `projects`, `qr_codes`, `qr_code_versions`,
`scan_events`, `business_cards`, `card_view_events`, `style_templates`.
Migrations live in `supabase/migrations/`. RLS policies are applied in
`00002_rls_policies.sql`; `00007` and `00008` harden them further — see
[Notes](#notes-on-a-few-decisions).

### Layout

```
src/
  middleware.ts     short-code and /c/ rewrites, auth gating — see Notes
  app/
    (app)/          dashboard, create, analytics, cards, settings
    (auth)/         login, signup, OAuth callback
    api/v1/         REST surface — qr, cards, contact, projects, analytics,
                    scan, stripe
    card/[slug]/    public business-card pages
  lib/
    qr/             encoders, generator, export, templates, schedule,
                    build-data, public-url, code-response
    vcard/          RFC 2426 builder shared by codes and cards
    api/            zod schemas, error envelope
    billing/        the BILLING_ENABLED flag
    analytics/      user-agent parsing
    cards/          card→vCard mapping, slugs
    stripe/         tier resolution and pro gating
    supabase/       browser, server, middleware, and service-role clients
  components/       qr editor, analytics charts, card layouts, landing, ui
  stores/           zustand stores for the editor and UI
```

---

## Running locally

Requires Node 20+ and a Supabase project. Stripe credentials are only needed if
you turn billing on.

```bash
npm install
cp .env.local.example .env.local   # fill in the values below
npm run dev
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — used by the scan and contact endpoints to read and write past RLS |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL. Short links and `/c/` contact links are built from this |
| `NEXT_PUBLIC_SHORT_DOMAIN` | Domain short codes are issued on |
| `NEXT_PUBLIC_BILLING_ENABLED` | `true` enforces the paywall. Unset or `false` makes everything free |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook route |
| `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_ANNUAL_PRICE_ID` | Price IDs for the pro tier |

```bash
npm test          # vitest — 121 tests
npm run lint
npm run build
```

Point the Stripe CLI at `/api/v1/stripe/webhook` to exercise billing locally.

### Migrations

For a **fresh** database:

```bash
npx supabase db push
```

> [!WARNING]
> The production database is not in sync with this folder's migration history.
> Its schema was originally applied through the SQL editor, so
> `supabase_migrations` does not record `00001`–`00006`; `00007` and `00008` were
> applied separately. Running a bare `db push` against it will try to replay
> migrations that have already run. Baseline the history with
> `supabase migration repair --status applied <version>` first, or apply
> statements directly.

---

## Notes on a few decisions

**Middleware must live at `src/middleware.ts`.** This project uses a `src/`
directory, so that is the only path Next.js loads it from. At the package root it
still compiles, still appears in `middleware-manifest.json` with correct
matchers, and still prints `ƒ Proxy (Middleware)` in the build output — and never
runs. The failure is silent: protected routes serve 200 to anonymous visitors and
every short code 404s. To check it is wired, request a seven-character path; it
must return the scan handler's JSON, not Next's HTML 404 page.

**Service-role client on the public paths.** Scan events are written by an
unauthenticated visitor, and contact `.vcf` files are read by one, so those two
endpoints use the service-role client rather than the RLS-bound one. They are the
only routes that do, and each reads a single row by short code.

**Privileged profile columns are not client-writable.** The `profiles` RLS policy
allows a user to update their own row, which — with the anon key in the browser —
meant anyone could set `tier` and `is_admin` on themselves. `00007` removes those
columns from the `authenticated` grant and adds a trigger that rejects the write.
The trigger is `SECURITY INVOKER` on purpose: under `SECURITY DEFINER`,
`current_user` is the function owner and the service-role bypass check matches
every caller, so the guard passes everything through.

**Counter RPCs are revoked from `PUBLIC`, not from `anon`.** Postgres grants
`EXECUTE` on every function to `PUBLIC`, and `anon` inherits it, so revoking from
`anon` and `authenticated` individually leaves the function callable. `00008`
revokes from `PUBLIC` and grants back to `service_role` only.

**Bot detection is asymmetric on purpose.** Discarding a real scan loses
something the customer is watching; counting one extra preview nudges a number.
So named agents are matched as plain substrings — `facebookexternalhit` and
`Facebot` both survive a `\bbot\b` test — and the generic fallbacks take
boundaries on opposite sides: `bot` needs one in front, because CUBOT and
Elephone ship real handsets, while `crawler` and `spider` need one behind,
because SPIDERMAN-A1 is a real phone. `preview` is deliberately not a generic
pattern; Safari Technology Preview is a browser people use.

**Uniqueness over cookies.** A cookie would be more accurate but requires a
consent banner in most jurisdictions and fails across the browser/native scanner
boundary. The IP + UA + 24h heuristic is deliberately approximate and documented
as such rather than presented as a precise reach number.

**String comparison for schedule windows.** Times are compared as `HH:MM`
strings in 24-hour format, which sorts lexicographically. Windows are not
currently allowed to cross midnight — a rule ending at `02:00` will not match.

**Gradient rotation is stored in degrees.** `qr-code-styling` takes radians; the
style panel and the built-in templates both work in degrees, and the conversion
happens once in `mapGradient`. Anything that writes a rotation should keep using
degrees.

**Every generated code gets a four-module quiet zone.** `qr-code-styling`
defaults the margin to zero, which scans acceptably on white paper and fails
against a coloured background or when butted up against other artwork. The module
count is only knowable after the symbol is encoded, so `generator.ts` reads it
back and sets the margin to match.

**Public error pages are format-negotiated.** The scan and contact endpoints are
the only routes a member of the public reaches by pointing a phone at a piece of
paper. A browser gets a small self-contained HTML page; the redirect worker and
any API client keep the JSON envelope, machine-readable code intact.

---

## License

Not currently licensed for reuse. All rights reserved.
