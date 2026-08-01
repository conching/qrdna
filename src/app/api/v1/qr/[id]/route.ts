import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, dbError, unexpectedError } from "@/lib/api/errors";
import { generateShortCode } from "@/lib/utils/short-code";
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
    return unexpectedError("qr/[id]", err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/qr/:id  — Update a QR code (with auto-versioning)
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
      scheduledRedirects?: Json;
      expiryPageConfig?: Json;
      routingRules?: Json;
    };

    // ------------------------------------------------------------------
    // Fetch current QR code state (needed for auto-versioning)
    // ------------------------------------------------------------------
    const { data: current, error: fetchError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !current) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    // ------------------------------------------------------------------
    // Auto-version: snapshot OLD values before applying destructive edits
    // ------------------------------------------------------------------
    const destinationChanging =
      body.destinationUrl !== undefined &&
      body.destinationUrl !== current.destination_url;
    const staticDataChanging =
      body.staticData !== undefined &&
      JSON.stringify(body.staticData) !== JSON.stringify(current.static_data);

    if (destinationChanging || staticDataChanging) {
      const currentVersionCount =
        (current as Record<string, unknown>).version_count ?? 0;
      const newVersionNumber = (currentVersionCount as number) + 1;

      // Build a human-readable change summary
      const summaryParts: string[] = [];
      if (destinationChanging) {
        summaryParts.push(
          `Destination changed from ${current.destination_url ?? "(empty)"} to ${body.destinationUrl}`,
        );
      }
      if (staticDataChanging) {
        summaryParts.push("Static data updated");
      }

      await supabase.from("qr_code_versions").insert({
        qr_code_id: id,
        version_number: newVersionNumber,
        destination_url: current.destination_url,
        static_data: current.static_data as Json,
        style: current.style as Json,
        change_summary: summaryParts.join("; "),
        changed_by: user.id,
      });

      // Increment version_count on the qr_codes row
      await supabase.rpc("increment_version_count" as never, {
        row_id: id,
      } as never);
    }

    // ------------------------------------------------------------------
    // Build the update payload (only set fields that were provided)
    // ------------------------------------------------------------------
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.destinationUrl !== undefined)
      updates.destination_url = body.destinationUrl;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;
    if (body.style !== undefined) updates.style = body.style;
    if (body.staticData !== undefined) updates.static_data = body.staticData;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.isFavorited !== undefined)
      updates.is_favorited = body.isFavorited;
    if (body.scheduledRedirects !== undefined)
      updates.scheduled_redirects = body.scheduledRedirects;
    if (body.expiryPageConfig !== undefined)
      updates.expiry_page_config = body.expiryPageConfig;
    if (body.routingRules !== undefined)
      updates.routing_rules = body.routingRules;

    // ------------------------------------------------------------------
    // A vCard switched into hosted mode needs somewhere to be served from
    // ------------------------------------------------------------------
    // Only POST used to mint short codes, so a contact card that gained a
    // headshot after it was saved kept `short_code: null` and its QR encoded
    // the /c/0000000 preview placeholder — a scannable code pointing at
    // nothing. Editing content is only reachable now, which is what makes
    // this path live.
    if (body.staticData !== undefined && !current.short_code) {
      const becomesHosted =
        current.content_type === "vcard" &&
        (body.staticData as { hostedContact?: boolean } | null)
          ?.hostedContact === true;
      if (becomesHosted) {
        updates.short_code = generateShortCode();
      }
    }

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
      return dbError("qr/[id]", error);
    }

    if (!data) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    return apiSuccess(data);
  } catch (err) {
    return unexpectedError("qr/[id]", err);
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
      return dbError("qr/[id]", error);
    }

    return apiSuccess({ deleted: true });
  } catch (err) {
    return unexpectedError("qr/[id]", err);
  }
}
