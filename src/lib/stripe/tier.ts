export type Tier = "free" | "pro" | "team";

/**
 * Returns true if a tier grants Pro-level access.
 * Both "pro" and "team" tiers are treated as Pro.
 * Admin users always get Pro-level access regardless of tier.
 */
export function isPro(
  tier: string | null | undefined,
  isAdmin?: boolean,
): boolean {
  if (isAdmin) return true;
  return tier === "pro" || tier === "team";
}

/**
 * Maps a Stripe subscription status to an app tier.
 */
export function tierFromStripeStatus(status: string): Tier {
  if (status === "active" || status === "trialing") return "pro";
  return "free";
}

