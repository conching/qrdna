export type Tier = "free" | "pro" | "team";

/**
 * Returns true if a tier grants Pro-level access.
 * Both "pro" and "team" tiers are treated as Pro.
 */
export function isPro(tier: string | null | undefined): boolean {
  return tier === "pro" || tier === "team";
}

/**
 * Maps a Stripe subscription status to an app tier.
 */
export function tierFromStripeStatus(status: string): Tier {
  if (status === "active" || status === "trialing") return "pro";
  return "free";
}

import { apiError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns a 403 Response if the tier is not Pro, otherwise null.
 * Usage in API routes:
 *   const block = buildRequireProResponse(tier);
 *   if (block) return block;
 */
export function buildRequireProResponse(
  tier: string | null | undefined,
): Response | null {
  if (isPro(tier)) return null;
  return apiError(403, "Pro subscription required", "UPGRADE_REQUIRED");
}

/**
 * Server-side helper for API routes.
 * Fetches the current user's tier from the DB and returns a 403 Response
 * if they are not Pro. Returns null if Pro (caller should continue).
 *
 * Usage:
 *   const block = await requirePro();
 *   if (block) return block;
 */
export async function requirePro(): Promise<Response | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError(401, "Authentication required", "UNAUTHORIZED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  return buildRequireProResponse(profile?.tier ?? "free");
}
