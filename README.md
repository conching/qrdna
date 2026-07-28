# QR DNA

Dynamic QR codes that stay editable after they're printed — with scan analytics,
time- and device-based routing, and digital business cards.

![Next.js](https://img.shields.io/badge/Next.js-16-000000.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e.svg)
![Stripe](https://img.shields.io/badge/Stripe-billing-635bff.svg)

A static QR code bakes its destination into the pixels. Reprint the sign, or the
URL changes, and the code is dead. QR DNA encodes a short code that resolves
server-side on every scan, so the destination stays editable for the life of the
printed asset — and every scan becomes a data point.

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
and IP. Uniqueness is determined by an IP + user-agent match inside a rolling
24-hour window, so repeat scans from the same phone don't inflate reach.

Counters increment through a Postgres RPC (`increment_scan_counters`) to stay
atomic under concurrency, with a read-modify-write fallback if the RPC is absent.
Scan logging failures never block the redirect — the user gets where they're
going even if telemetry fails.

Dashboard covers time series, device breakdown, browser/OS split, geography,
referrers, and CSV export.

### QR types

Nine encoders in `src/lib/qr/encoders.ts`, each emitting the payload format
scanners expect:

`URL` · `Text` · `Email` · `Phone` · `SMS` · `WiFi` · `vCard` · `Geo` · `Calendar event`

### Digital business cards

Hosted card pages at `/card/[slug]` in four layouts (centered, split, minimal,
left-aligned), with social links, action buttons, `.vcf` download, and their own
view tracking in `card_view_events`.

### Styling and billing

`qr-code-styling` drives dot shapes, corner styles, gradients, and logo
embedding, with a template browser over saved `style_templates` and a built-in
UTM builder. Stripe handles free/pro tiers — monthly and annual prices, a
customer portal, and webhook-driven entitlement — with `require-pro.ts` gating
paid features server-side.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5, Zod schemas |
| Styling | Tailwind CSS 4, shadcn/ui on Radix |
| Data | Supabase — Postgres, Auth, Storage, row-level security |
| Payments | Stripe |
| State | Zustand |
| QR rendering | `qr-code-styling` |
| Charts | Recharts |
| Motion | Framer Motion, Lottie |
| Testing | Vitest, Testing Library, Playwright |

### Schema

Eight tables: `profiles`, `projects`, `qr_codes`, `qr_code_versions`,
`scan_events`, `business_cards`, `card_view_events`, `style_templates`.
Migrations live in `supabase/migrations/` and RLS policies are applied in
`00002_rls_policies.sql`.

### Layout

```
src/
  app/
    (app)/          dashboard, create, analytics, cards, settings
    (auth)/         login, signup, OAuth callback
    api/v1/         REST surface — qr, cards, projects, analytics, scan, stripe
    card/[slug]/    public business-card pages
  lib/
    qr/             encoders, generator, export, templates, schedule
    analytics/      user-agent parsing
    cards/          vCard generation, slugs
    stripe/         tier resolution and pro gating
    supabase/       browser, server, middleware, and service-role clients
  components/       qr editor, analytics charts, card layouts, ui primitives
  stores/           zustand stores for the editor and UI
```

---

## Running locally

Requires Node 20+, a Supabase project, and a Stripe account (test mode is fine).

```bash
npm install
cp .env.local.example .env.local   # fill in the values below
npx supabase db push               # apply migrations
npm run dev
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — used by the scan endpoint to write events past RLS |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL |
| `NEXT_PUBLIC_SHORT_DOMAIN` | Domain short codes are issued on |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook route |
| `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_ANNUAL_PRICE_ID` | Price IDs for the pro tier |

```bash
npm test          # vitest
npm run lint
npm run build
```

Point the Stripe CLI at `/api/v1/stripe/webhook` to exercise billing locally.

---

## Notes on a few decisions

**Service-role client on the scan path.** Scan events are written by an
unauthenticated visitor, so the redirect endpoint uses the service-role client
rather than the RLS-bound one. It is the only route that does, and it reads a
single row by short code before writing.

**Uniqueness over cookies.** A cookie would be more accurate but requires a
consent banner in most jurisdictions and fails across the browser/native scanner
boundary. The IP + UA + 24h heuristic is deliberately approximate and documented
as such rather than presented as a precise reach number.

**String comparison for schedule windows.** Times are compared as `HH:MM`
strings in 24-hour format, which sorts lexicographically. Windows are not
currently allowed to cross midnight — a rule ending at `02:00` will not match.

---

## License

Not currently licensed for reuse. All rights reserved.
