import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/errors";
import type { Json } from "@/types/database";

// ---------------------------------------------------------------------------
// GET /api/v1/qr/:id  — Fetch a single QR code
// ---------------------------------------------------------------------------

export async function GET(
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

    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    return apiSuccess(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/qr/:id  — Update a QR code
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
      destinationUrl?: string;
      isActive?: boolean;
      expiresAt?: string | null;
      style?: Json;
      staticData?: Json;
      tags?: string[];
      isFavorited?: boolean;
    };

    // Build the update payload (only set fields that were provided)
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.destinationUrl !== undefined) updates.destination_url = body.destinationUrl;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;
    if (body.style !== undefined) updates.style = body.style;
    if (body.staticData !== undefined) updates.static_data = body.staticData;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.isFavorited !== undefined) updates.is_favorited = body.isFavorited;

    if (Object.keys(updates).length === 0) {
      return apiError(400, "No fields to update", "EMPTY_UPDATE");
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("qr_codes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return apiError(500, error.message, "DB_ERROR");
    }

    if (!data) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    return apiSuccess(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/qr/:id  — Delete a QR code
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

    const { error } = await supabase
      .from("qr_codes")
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
