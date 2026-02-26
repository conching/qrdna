import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { requirePro } from "@/lib/stripe/tier";

type Ctx = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/cards/[id]/analytics
// ---------------------------------------------------------------------------

export async function GET(request: Request, { params }: Ctx) {
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

    // Verify ownership
    const { data: card } = await supabase
      .from("business_cards")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!card) {
      return apiError(404, "Card not found", "NOT_FOUND");
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, Number(searchParams.get("days") ?? 30)));
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error } = await supabase
      .from("card_view_events")
      .select("event_type, event_data, viewed_at, country, device_type, is_unique")
      .eq("card_id", id)
      .gte("viewed_at", sinceDate)
      .order("viewed_at", { ascending: true });

    if (error) {
      return apiError(500, error.message, "DB_ERROR");
    }

    const rows = events ?? [];

    // Totals
    const pageViews = rows.filter((r) => r.event_type === "view");
    const vcardDownloads = rows.filter((r) => r.event_type === "vcard_download").length;
    const linkClicks = rows.filter((r) => r.event_type === "link_click").length;
    const totalViews = pageViews.length;
    const uniqueViews = pageViews.filter((r) => r.is_unique).length;

    // Time series (grouped by day)
    const daySeries: Record<string, { total: number; unique: number }> = {};
    for (const row of pageViews) {
      const day = row.viewed_at.slice(0, 10);
      if (!daySeries[day]) daySeries[day] = { total: 0, unique: 0 };
      daySeries[day].total++;
      if (row.is_unique) daySeries[day].unique++;
    }
    const timeSeries = Object.entries(daySeries)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    // Geo breakdown
    const geoCounts: Record<string, number> = {};
    for (const row of pageViews) {
      const c = row.country ?? "Unknown";
      geoCounts[c] = (geoCounts[c] ?? 0) + 1;
    }
    const geoBreakdown = Object.entries(geoCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, views]) => ({ country, views }));

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    for (const row of pageViews) {
      const d = row.device_type ?? "unknown";
      deviceCounts[d] = (deviceCounts[d] ?? 0) + 1;
    }
    const deviceBreakdown = Object.entries(deviceCounts).map(([device, views]) => ({
      device,
      views,
    }));

    return apiSuccess({
      summary: { totalViews, uniqueViews, vcardDownloads, linkClicks },
      timeSeries,
      geoBreakdown,
      deviceBreakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
