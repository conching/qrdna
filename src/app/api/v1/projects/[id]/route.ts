import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/errors";

// ---------------------------------------------------------------------------
// PATCH /api/v1/projects/:id  — Update a project
// ---------------------------------------------------------------------------

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      color?: string | null;
      icon?: string | null;
    };

    // Build the update payload (only set fields that were provided)
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return apiError(400, "Project name cannot be empty", "VALIDATION_ERROR");
      }
      updates.name = body.name.trim();
    }
    if (body.description !== undefined) updates.description = body.description;
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;

    if (Object.keys(updates).length === 0) {
      return apiError(400, "No fields to update", "EMPTY_UPDATE");
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return apiError(500, error.message, "DB_ERROR");
    }

    if (!data) {
      return apiError(404, "Project not found", "NOT_FOUND");
    }

    return apiSuccess(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/projects/:id  — Delete a project
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    // First, unlink any QR codes associated with this project
    const { error: unlinkError } = await supabase
      .from("qr_codes")
      .update({ project_id: null, updated_at: new Date().toISOString() })
      .eq("project_id", id)
      .eq("user_id", user.id);

    if (unlinkError) {
      return apiError(500, unlinkError.message, "DB_ERROR");
    }

    // Then delete the project
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return apiError(500, error.message, "DB_ERROR");
    }

    return apiSuccess({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
