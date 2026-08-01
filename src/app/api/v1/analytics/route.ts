import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, dbError, unexpectedError } from "@/lib/api/errors";
import { requirePro } from "@/lib/stripe/require-pro";

// ---------------------------------------------------------------------------
// GET /api/v1/analytics  — Account-wide analytics
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const block = await requirePro();
    if (block) return block;

    // ---- Fetch all of the user's QR codes ----------------------------------
    const { data: qrCodes, error: qrError } = await supabase
      .from("qr_codes")
      .select("id, name, content_type, is_active, total_scans, unique_scans")
      .eq("user_id", user.id);

    if (qrError) {
      return dbError("analytics", qrError);
    }

    const codes = qrCodes ?? [];

    const totalCodes = codes.length;
    const activeCodes = codes.filter((c) => c.is_active).length;
    const totalScans = codes.reduce((sum, c) => sum + c.total_scans, 0);
    const uniqueScans = codes.reduce((sum, c) => sum + c.unique_scans, 0);

    // ---- Top 5 codes by total_scans ----------------------------------------
    const topCodes = [...codes]
      .sort((a, b) => b.total_scans - a.total_scans)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        total_scans: c.total_scans,
        content_type: c.content_type,
      }));

    // ---- Recent scans (last 10 across all codes) ---------------------------
    const qrIds = codes.map((c) => c.id);

    let recentScans: Array<{
      id: number;
      scanned_at: string;
      country: string | null;
      city: string | null;
      device_type: string | null;
      browser: string | null;
      qr_code_id: string;
      qr_name: string;
    }> = [];

    if (qrIds.length > 0) {
      const { data: recent } = await supabase
        .from("scan_events")
        .select("id, scanned_at, country, city, device_type, browser, qr_code_id")
        .in("qr_code_id", qrIds)
        .order("scanned_at", { ascending: false })
        .limit(10);

      if (recent) {
        // Build a quick lookup for QR names
        const nameMap = new Map(codes.map((c) => [c.id, c.name]));
        recentScans = recent.map((r) => ({
          ...r,
          qr_name: nameMap.get(r.qr_code_id) ?? "Unknown",
        }));
      }
    }

    // ---- Scans by day (last 30 days) ---------------------------------------
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    let scansByDay: Array<{ date: string; scans: number }> = [];

    if (qrIds.length > 0) {
      const { data: dayEvents } = await supabase
        .from("scan_events")
        .select("scanned_at")
        .in("qr_code_id", qrIds)
        .gte("scanned_at", thirtyDaysAgo)
        .order("scanned_at", { ascending: true });

      if (dayEvents) {
        const dayMap = new Map<string, number>();
        for (const evt of dayEvents) {
          const date = evt.scanned_at.slice(0, 10);
          dayMap.set(date, (dayMap.get(date) ?? 0) + 1);
        }
        scansByDay = Array.from(dayMap.entries()).map(([date, scans]) => ({
          date,
          scans,
        }));
      }
    }

    return apiSuccess({
      totalCodes,
      activeCodes,
      totalScans,
      uniqueScans,
      topCodes,
      recentScans,
      scansByDay,
    });
  } catch (err) {
    return unexpectedError("analytics", err);
  }
}
