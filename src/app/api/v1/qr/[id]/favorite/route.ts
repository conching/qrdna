import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/errors";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// PATCH /api/v1/qr/[id]/favorite  — Toggle the favorited state
// ---------------------------------------------------------------------------

export async function PATCH(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    // Fetch current favorited state
    const { data: existing, error: fetchError } = await supabase
      .from("qr_codes")
      .select("is_favorited")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    const newValue = !existing.is_favorited;

    const { error: updateError } = await supabase
      .from("qr_codes")
      .update({
        is_favorited: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return apiError(500, updateError.message, "DB_ERROR");
    }

    return apiSuccess({ isFavorited: newValue });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
