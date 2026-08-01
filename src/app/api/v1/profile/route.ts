import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, dbError } from "@/lib/api/errors";

// ---------------------------------------------------------------------------
// PATCH /api/v1/profile  — Update the current user's profile
// ---------------------------------------------------------------------------

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const body = (await request.json()) as {
      display_name?: string;
    };

    const updates: Record<string, unknown> = {};

    if (body.display_name !== undefined) {
      updates.display_name = body.display_name.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return apiError(400, "No valid fields to update", "BAD_REQUEST");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("display_name, avatar_url, tier")
      .single();

    if (error) {
      return dbError("profile", error);
    }

    return apiSuccess(data);
  } catch {
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
