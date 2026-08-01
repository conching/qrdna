import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { apiError, apiSuccess, dbError, unexpectedError } from "@/lib/api/errors";

// ---------------------------------------------------------------------------
// POST /api/v1/admin/activate — Grant admin access with secret
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const body = (await request.json()) as { secret?: string };

    if (!body.secret) {
      return apiError(400, "Secret is required", "MISSING_FIELD");
    }

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return apiError(503, "Admin activation is not configured", "NOT_CONFIGURED");
    }

    // Constant-time-ish comparison (good enough for a low-stakes admin secret)
    if (body.secret !== adminSecret) {
      return apiError(403, "Invalid secret", "INVALID_SECRET");
    }

    // `is_admin` is guarded against client-side writes (migration 00007), so
    // this must go through the service role.
    const { error } = await createServiceClient()
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", user.id);

    if (error) {
      return dbError("admin/activate", error);
    }

    return apiSuccess({ is_admin: true });
  } catch (err) {
    return unexpectedError("admin/activate", err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/admin/activate — Revoke own admin access
// ---------------------------------------------------------------------------

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const { error } = await createServiceClient()
      .from("profiles")
      .update({ is_admin: false })
      .eq("id", user.id);

    if (error) {
      return dbError("admin/activate", error);
    }

    return apiSuccess({ is_admin: false });
  } catch (err) {
    return unexpectedError("admin/activate", err);
  }
}
