import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { requirePro } from "@/lib/stripe/require-pro";

// ---------------------------------------------------------------------------
// GET /api/v1/qr/:id/analytics  — Per-QR analytics
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

    const block = await requirePro();
    if (block) return block;

    // ---- Verify ownership and get summary ----------------------------------
    const { data: qr, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, total_scans, unique_scans, last_scan_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (qrError || !qr) {
      return apiError(404, "QR code not found", "NOT_FOUND");
    }

    // ---- Parse query params ------------------------------------------------
    const { searchParams } = new URL(request.url);
    const days = Math.min(
      365,
      Math.max(1, Number(searchParams.get("days") ?? 30)),
    );

    const sinceDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000,
    ).toISOString();

    // ---- Fetch scan events for the period ----------------------------------
    const { data: events, error: eventsError } = await supabase
      .from("scan_events")
      .select("scanned_at, country, city, device_type, browser, os, referrer, is_unique")
      .eq("qr_code_id", qr.id)
      .gte("scanned_at", sinceDate)
      .order("scanned_at", { ascending: true });

    if (eventsError) {
      return apiError(500, eventsError.message, "DB_ERROR");
    }

    const rows = events ?? [];

    // ---- Time series (grouped by day) --------------------------------------
    const dayMap = new Map<string, { scans: number; unique: number }>();
    for (const row of rows) {
      const date = row.scanned_at.slice(0, 10); // YYYY-MM-DD
      const entry = dayMap.get(date) ?? { scans: 0, unique: 0 };
      entry.scans += 1;
      if (row.is_unique) entry.unique += 1;
      dayMap.set(date, entry);
    }
    const timeSeries = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      scans: v.scans,
      unique: v.unique,
    }));

    // ---- Aggregate helpers --------------------------------------------------
    function topN<K extends string>(
      key: K,
      limit: number,
    ): Array<Record<K, string> & { scans: number }> {
      const map = new Map<string, number>();
      for (const row of rows) {
        const val = (row as Record<string, unknown>)[key] as string | null;
        if (!val) continue;
        map.set(val, (map.get(val) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, scans]) => ({ [key]: name, scans }) as Record<K, string> & { scans: number });
    }

    // ---- Countries ----------------------------------------------------------
    const countries = topN("country", 10);

    // ---- Cities (include country) -------------------------------------------
    const cityMap = new Map<string, { city: string; country: string; scans: number }>();
    for (const row of rows) {
      if (!row.city) continue;
      const key = `${row.city}|${row.country ?? ""}`;
      const entry = cityMap.get(key) ?? {
        city: row.city,
        country: row.country ?? "",
        scans: 0,
      };
      entry.scans += 1;
      cityMap.set(key, entry);
    }
    const cities = Array.from(cityMap.values())
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10);

    // ---- Devices, browsers, OS, referrers -----------------------------------
    const devices = topN("device_type", 10);
    const browsers = topN("browser", 10);
    const operatingSystems = topN("os", 10);
    const referrers = topN("referrer", 10);

    return apiSuccess({
      summary: {
        total_scans: qr.total_scans,
        unique_scans: qr.unique_scans,
        last_scan_at: qr.last_scan_at,
      },
      timeSeries,
      countries,
      cities,
      devices,
      browsers,
      os: operatingSystems,
      referrers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
