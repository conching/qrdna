import { BILLING_ENABLED } from "@/lib/billing/flags";

export type Tier = "free" | "pro" | "team";

/**
 * Returns true if the user should be granted Pro-level *access*.
 *
 * While billing is switched off every signed-in user gets full access, so this
 * is the only check feature gates need. Use `hasPaidPlan` instead when you want
 * to know whether someone is actually on a paid plan (badges, billing UI).
 */
export function isPro(
  tier: string | null | undefined,
  isAdmin?: boolean,
): boolean {
  if (!BILLING_ENABLED) return true;
  if (isAdmin) return true;
  return hasPaidPlan(tier);
}

/**
 * Returns true if the tier itself is a paid one, ignoring the billing kill
 * switch and admin bypass. Display-only — never gate a feature on this.
 */
export function hasPaidPlan(tier: string | null | undefined): boolean {
  return tier === "pro" || tier === "team";
}

/**
 * Maps a Stripe subscription status to an app tier.
 */
export function tierFromStripeStatus(status: string): Tier {
  if (status === "active" || status === "trialing") return "pro";
  return "free";
}

