import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, dbError, unexpectedError } from "@/lib/api/errors";
import type { UpdateCardPayload } from "@/lib/cards/types";

type Ctx = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/cards/[id]
// ---------------------------------------------------------------------------

export async function GET(_request: Request, { params }: Ctx) {
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
      .from("business_cards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return apiError(404, "Card not found", "NOT_FOUND");
    }

    return apiSuccess(data);
  } catch (err) {
    return unexpectedError("cards/[id]", err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/cards/[id]
// ---------------------------------------------------------------------------

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("business_cards")
      .select("id, slug, theme")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return apiError(404, "Card not found", "NOT_FOUND");
    }

    const body = (await request.json()) as UpdateCardPayload;

    // If slug is changing, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const { data: conflict } = await supabase
        .from("business_cards")
        .select("id")
        .eq("slug", body.slug)
        .maybeSingle();

      if (conflict) {
        return apiError(409, "Slug already in use", "SLUG_CONFLICT");
      }
    }

    // Merge theme if partial update
    const updatedTheme =
      body.theme !== undefined
        ? { ...(existing.theme as object), ...body.theme }
        : undefined;

    const updateData: Record<string, unknown> = {};
    const fields: (keyof UpdateCardPayload)[] = [
      "first_name", "last_name", "pronouns", "title", "company", "department",
      "bio", "phones", "emails", "websites", "address", "social_links",
      "headshot_url", "company_logo_url", "slug", "is_active",
    ];
    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    if (updatedTheme !== undefined) {
      updateData.theme = updatedTheme;
    }

    const { data, error } = await supabase
      .from("business_cards")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return dbError("cards/[id]", error);
    }

    return apiSuccess(data);
  } catch (err) {
    return unexpectedError("cards/[id]", err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/cards/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_request: Request, { params }: Ctx) {
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
      .from("business_cards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return dbError("cards/[id]", error);
    }

    return apiSuccess({ deleted: true });
  } catch (err) {
    return unexpectedError("cards/[id]", err);
  }
}
