# QR DNA Monetization Design

**Date:** 2026-02-25
**Status:** Approved

---

## Tier Structure

| Feature | Free | Pro |
|---|---|---|
| Static QR codes (no account) | Unlimited | Unlimited |
| Dynamic QR codes | ✗ | Unlimited |
| Business cards | ✗ | Unlimited |
| Analytics | ✗ | Unlimited |
| Price | $0 | $9/mo or $90/yr |

**Free tier** is the public static QR generator — already built. No account required. Free users who sign up see the dashboard but cannot create dynamic QR codes, business cards, or view analytics.

**Pro tier** unlocks everything with no usage caps. Truly unlimited.

---

## Stripe Setup

- **1 product:** "QR DNA Pro"
- **2 prices:**
  - Monthly: $9.00/month, recurring
  - Annual: $90.00/year, recurring (~2 months free)
- **Customer portal** enabled for self-serve cancellation, plan switching, invoice history
- **`stripe_customer_id`** stored on `profiles` (already in schema)
- **`tier`** field on `profiles` drives all gating: `'free'` | `'pro'` | `'team'`

---

## Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `tier = 'pro'` on profile |
| `customer.subscription.updated` | Sync tier if plan changed |
| `customer.subscription.deleted` | Set `tier = 'free'` on profile |
| `invoice.payment_failed` | Optional: email user (future) |

Webhook signature verified via `STRIPE_WEBHOOK_SECRET`. Route: `POST /api/v1/stripe/webhook`.

---

## Checkout Flow

1. Authenticated user clicks upgrade (from modal or `/settings`)
2. `POST /api/v1/stripe/checkout` — creates Stripe Checkout Session with `customer_email` and `metadata.user_id`
3. Redirect to Stripe-hosted checkout page
4. On success → redirect to `/settings?upgraded=true` with success toast
5. On cancel → redirect back to wherever they came from

---

## Upgrade UX

**Discovery:** Pro features in the dashboard show a subtle "Pro" badge when the user is on the free tier.

**Conversion:** Clicking a locked feature opens an inline `UpgradeModal` dialog showing:
- The specific feature they tried to use
- What Pro unlocks (bullet list)
- Price ($9/mo or $90/yr)
- "Upgrade to Pro" button → triggers checkout flow
- "Maybe later" cancel

**Settings page** (`/settings/billing`) shows:
- Current plan + next billing date (for Pro)
- "Upgrade" CTA (for free users)
- "Manage billing" link → Stripe Customer Portal (for Pro users)

---

## Tier Gating Implementation

**Server-side (API routes):** Middleware helper `requirePro(userId)` checks `profiles.tier`. Returns 403 with `{ error: { code: "UPGRADE_REQUIRED" } }` for free users hitting Pro endpoints.

**Client-side (UI):** `useUser()` hook exposes `isPro: boolean`. Components use this to show Pro badges and trigger the upgrade modal instead of the real action.

**Gated features at launch:**
- `POST /api/v1/qr` — dynamic QR creation (static QR remains ungated)
- `POST /api/v1/cards` — business card creation
- `/api/v1/analytics/*` — all analytics endpoints
- Dashboard QR list, cards list, analytics pages (show upgrade prompt if free)

---

## Environment Variables Added

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Out of Scope (launch)

- Team tier (schema exists, not surfaced)
- Email notifications on payment failure
- Trial periods
- Promo codes (can enable in Stripe dashboard later)
- Usage metering
