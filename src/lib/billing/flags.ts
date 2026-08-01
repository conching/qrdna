/**
 * Billing kill switch.
 *
 * While `BILLING_ENABLED` is false, every Pro-gated feature is open to every
 * signed-in user: `isPro()` returns true, `requirePro()` never blocks, and the
 * upgrade CTAs are hidden. The Stripe routes, webhook, and `profiles.tier`
 * column all keep working, so flipping this back on restores the paywall
 * without any code changes.
 *
 * To re-enable billing, set NEXT_PUBLIC_BILLING_ENABLED=true and redeploy.
 *
 * Read as NEXT_PUBLIC_ because both the client (`useUser`, nav badges) and the
 * server (`requirePro`) need the same answer.
 */
export const BILLING_ENABLED =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/** Copy shown wherever a plan/upgrade surface would otherwise appear. */
export const FREE_ACCESS_NOTICE =
  "Every feature is free while QR DNA is in early access.";
