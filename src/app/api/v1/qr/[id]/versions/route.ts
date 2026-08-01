import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, dbError, unexpectedError } from "@/lib/api/errors";
import type { Json } from "@/types/database";

// ---------------------------------------------------------------------------
// GET /api/v1/qr/:id/versions  — List all versions for a QR code
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

    // Verify the user owns this QR code
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (qrError || !qrCode) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    // Fetch all versions sorted newest-first
    const { data: versions, error: versionsError } = await supabase
      .from("qr_code_versions")
      .select("*")
      .eq("qr_code_id", id)
      .order("version_number", { ascending: false });

    if (versionsError) {
      return dbError("qr/[id]/versions", versionsError);
    }

    return apiSuccess(versions ?? []);
  } catch (err) {
    return unexpectedError("qr/[id]/versions", err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/qr/:id/versions  — Revert to a specific version
// ---------------------------------------------------------------------------

export async function POST(
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

    const body = (await request.json()) as { versionId: string };

    if (!body.versionId) {
      return apiError(400, "versionId is required", "MISSING_FIELD");
    }

    // Fetch the target version row
    const { data: version, error: versionError } = await supabase
      .from("qr_code_versions")
      .select("*")
      .eq("id", body.versionId)
      .eq("qr_code_id", id)
      .single();

    if (versionError || !version) {
      return apiError(404, "Version not found", "NOT_FOUND");
    }

    // Verify the user owns the parent QR code
    const { data: current, error: qrError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (qrError || !current) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    // -------------------------------------------------------------------
    // Snapshot the CURRENT state before reverting (so the revert itself
    // is recorded as a version entry)
    // -------------------------------------------------------------------
    const currentVersionCount =
      (current as Record<string, unknown>).version_count ?? 0;
    const newVersionNumber = (currentVersionCount as number) + 1;

    await supabase.from("qr_code_versions").insert({
      qr_code_id: id,
      version_number: newVersionNumber,
      destination_url: current.destination_url,
      static_data: current.static_data as Json,
      style: current.style as Json,
      change_summary: `Reverted to version ${version.version_number}`,
      changed_by: user.id,
    });

    // Increment version_count
    await supabase.rpc("increment_version_count" as never, {
      row_id: id,
    } as never);

    // -------------------------------------------------------------------
    // Apply the version's data onto the QR code
    // -------------------------------------------------------------------
    const updates: Record<string, unknown> = {
      destination_url: version.destination_url,
      static_data: version.static_data,
      style: version.style,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await supabase
      .from("qr_codes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return dbError("qr/[id]/versions", updateError);
    }

    return apiSuccess(updated);
  } catch (err) {
    return unexpectedError("qr/[id]/versions", err);
  }
}
