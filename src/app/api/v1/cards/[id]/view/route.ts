import { createServiceClient } from "@/lib/supabase/service";
import { parseUserAgent } from "@/lib/analytics/ua-parser";
import { apiError, apiSuccess } from "@/lib/api/errors";
import type { Json } from "@/types/database";

type Ctx = { params: Promise<{ id: string }> };

function getClientIP(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  return request.headers.get("x-real-ip");
}

// ---------------------------------------------------------------------------
// POST /api/v1/cards/[id]/view  — Log a card view or interaction event
// Body: { event_type: "view" | "vcard_download" | "link_click", event_data?: object }
// Public endpoint — no auth required
// ---------------------------------------------------------------------------

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // Verify card exists and is active
    const { data: card } = await supabase
      .from("business_cards")
      .select("id")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (!card) {
      return apiError(404, "Card not found", "NOT_FOUND");
    }

    const body = (await request.json()) as {
      event_type?: string;
      event_data?: Record<string, unknown>;
    };

    const eventType = body.event_type ?? "view";
    const validTypes = ["view", "vcard_download", "link_click"];
    if (!validTypes.includes(eventType)) {
      return apiError(400, "Invalid event_type", "VALIDATION_ERROR");
    }

    const ip = getClientIP(request);
    const ua = request.headers.get("user-agent") ?? "";
    const parsed = parseUserAgent(ua);

    // Deduplication: "view" events are unique per IP+UA within 24h
    let isUnique = true;
    if (eventType === "view" && ip) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("card_view_events")
        .select("id")
        .eq("card_id", id)
        .eq("event_type", "view")
        .eq("ip_address", ip)
        .eq("user_agent", ua)
        .gte("viewed_at", since)
        .limit(1);

      if (recent && recent.length > 0) {
        isUnique = false;
      }
    }

    await supabase.from("card_view_events").insert({
      card_id: id,
      event_type: eventType,
      event_data: (body.event_data ?? null) as unknown as Json,
      ip_address: ip,
      user_agent: ua,
      device_type: parsed.device_type,
      is_unique: isUnique,
    });

    return apiSuccess({ logged: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
