import { apiError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { isPro } from "./tier";

/**
 * Returns a 403 Response if the tier is not Pro, otherwise null.
 * Pure function — safe to use in tests without Supabase.
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
