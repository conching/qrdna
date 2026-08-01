import { createClient } from "@/lib/supabase/server";
import { apiError, dbError, unexpectedError } from "@/lib/api/errors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape a CSV field value (wrap in quotes if it contains commas, quotes, or newlines). */
function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Sanitize a filename by stripping non-alphanumeric chars (keep hyphens/underscores). */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
}

// ---------------------------------------------------------------------------
// GET /api/v1/qr/:id/analytics/export  — CSV export of scan events
// ---------------------------------------------------------------------------

export async function GET(
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

    // ---- Verify ownership ---------------------------------------------------
    const { data: qr, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (qrError || !qr) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    // ---- Parse date range from query params ---------------------------------
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from"); // ISO date string
    const to = searchParams.get("to"); // ISO date string

    // ---- Build query --------------------------------------------------------
    let query = supabase
      .from("scan_events")
      .select(
        "scanned_at, country, city, region, device_type, os, browser, referrer, is_unique",
      )
      .eq("qr_code_id", qr.id)
      .order("scanned_at", { ascending: false });

    if (from) {
      query = query.gte("scanned_at", new Date(from).toISOString());
    }
    if (to) {
      // Include the entire "to" day by adding a day
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("scanned_at", toDate.toISOString());
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      return dbError("qr/[id]/analytics/export", eventsError);
    }

    const rows = events ?? [];

    // ---- Build CSV ----------------------------------------------------------
    const CSV_COLUMNS = [
      "scanned_at",
      "country",
      "city",
      "region",
      "device_type",
      "os",
      "browser",
      "referrer",
      "is_unique",
    ] as const;

    const header = CSV_COLUMNS.join(",");
    const csvRows = rows.map((row) =>
      CSV_COLUMNS.map((col) => {
        const value = row[col];
        if (typeof value === "boolean") return value ? "true" : "false";
        return csvEscape(value as string | null);
      }).join(","),
    );

    const csv = [header, ...csvRows].join("\n");

    // ---- Return CSV response ------------------------------------------------
    const today = new Date().toISOString().slice(0, 10);
    const filename = `scans-${sanitizeFilename(qr.name)}-${today}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return unexpectedError("qr/[id]/analytics/export", err);
  }
}
