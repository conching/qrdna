import { createServiceClient } from "@/lib/supabase/service";
import { parseUserAgent } from "@/lib/analytics/ua-parser";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { codeErrorResponse, CODE_ERRORS } from "@/lib/qr/code-response";
import { contactUrl } from "@/lib/constants";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Advanced feature type interfaces
// ---------------------------------------------------------------------------

interface ScheduleRule {
  days: string[]; // ["mon","tue","wed","thu","fri","sat","sun"]
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  destination: string; // URL
  timezone: string; // "America/New_York"
}

interface ScheduledRedirects {
  rules: ScheduleRule[];
  defaultDestination: string;
  isActive: boolean;
}

interface ExpiryPageConfig {
  isEnabled: boolean;
  title: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface RoutingRule {
  type: "device" | "language" | "country";
  condition: { deviceType?: string; language?: string; country?: string };
  destination: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the client IP address from standard proxy headers. */
function getClientIP(request: Request): string | null {
  // x-forwarded-for may contain a comma-separated list; take the first one
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // Cloudflare header
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  // Vercel / generic
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return null;
}

/**
 * Evaluate scheduled redirect rules to determine the active destination.
 * Uses Intl.DateTimeFormat to get the current day/time in each rule's timezone.
 * Returns the matching rule's destination, or the defaultDestination.
 */
function evaluateScheduledRedirects(config: ScheduledRedirects): string {
  if (!config.isActive || !config.rules?.length) {
    return config.defaultDestination;
  }

  const now = new Date();

  for (const rule of config.rules) {
    const tz = rule.timezone || "UTC";

    // Get the current day name (lowercase 3-letter) in the rule's timezone
    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: tz,
    });
    const currentDay = dayFormatter.format(now).toLowerCase(); // "mon", "tue", etc.

    // Check if today matches one of the rule's days
    if (!rule.days.includes(currentDay)) {
      continue;
    }

    // Get the current time (HH:MM) in the rule's timezone
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    });
    const currentTime = timeFormatter.format(now); // "09:30", "14:05", etc.

    // Compare times as strings (works for HH:MM 24h format)
    if (currentTime >= rule.startTime && currentTime <= rule.endTime) {
      return rule.destination;
    }
  }

  return config.defaultDestination;
}

/**
 * Evaluate routing rules to override the destination based on device, language,
 * or country detection from request headers.
 */
function evaluateRoutingRules(
  rules: RoutingRule[],
  deviceType: string | null,
  acceptLanguage: string | null,
  _country: string | null, // from geo headers like cf-ipcountry
): string | null {
  if (!rules?.length) return null;

  // Parse the primary language from Accept-Language (e.g. "en-US,en;q=0.9" -> "en")
  const primaryLang = acceptLanguage
    ? acceptLanguage.split(",")[0].split("-")[0].trim().toLowerCase()
    : null;

  for (const rule of rules) {
    switch (rule.type) {
      case "device": {
        if (
          rule.condition.deviceType &&
          deviceType?.toLowerCase() === rule.condition.deviceType.toLowerCase()
        ) {
          return rule.destination;
        }
        break;
      }
      case "language": {
        if (
          rule.condition.language &&
          primaryLang === rule.condition.language.toLowerCase()
        ) {
          return rule.destination;
        }
        break;
      }
      case "country": {
        if (
          rule.condition.country &&
          _country?.toLowerCase() === rule.condition.country.toLowerCase()
        ) {
          return rule.destination;
        }
        break;
      }
    }
  }

  return null;
}

/**
 * Build a branded expiry HTML page from the ExpiryPageConfig.
 */
function buildExpiryPage(config: ExpiryPageConfig): string {
  const bg = config.backgroundColor || "#1a1a2e";
  const text = config.textColor || "#ffffff";

  const buttonHtml =
    config.buttonText && config.buttonUrl
      ? `<a href="${escapeHtml(config.buttonUrl)}" style="
          display: inline-block;
          margin-top: 24px;
          padding: 12px 32px;
          background: #7C5CFF;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
        ">${escapeHtml(config.buttonText)}</a>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${bg};
      color: ${text};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: center;
      padding: 24px;
    }
    .container {
      max-width: 480px;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      opacity: 0.85;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(config.title)}</h1>
    <p>${escapeHtml(config.message)}</p>
    ${buttonHtml}
  </div>
</body>
</html>`;
}

/** Minimal HTML entity escaping for safe insertion into the expiry page. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

type ScanResult =
  | {
      ok: true;
      destination_url: string | null;
      is_unique: boolean;
      /**
       * Set when the code is a hosted contact card. Its data is served from
       * /c/<code>, so a visit to the bare short link is answered with the
       * contact rather than an error — which also rescues any link that was
       * shared in the root form before the two were told apart.
       */
       contact_short_code?: string | null;
    }
  | { ok: false; response: Response };

// ---------------------------------------------------------------------------
// Shared scan-logging logic (used by both GET and POST)
// ---------------------------------------------------------------------------

async function recordScan(
  request: Request,
  shortCode: string,
): Promise<ScanResult> {
  const supabase = createServiceClient();

  // 1. Look up the QR code by short_code (include advanced feature columns)
  const { data: qr, error: qrError } = await supabase
    .from("qr_codes")
    .select(
      "id, short_code, content_type, static_data, destination_url, is_active, expires_at, scheduled_redirects, expiry_page_config, routing_rules",
    )
    .eq("short_code", shortCode)
    .single();

  if (qrError || !qr) {
    return {
      ok: false,
      response: codeErrorResponse(request, CODE_ERRORS.notFound),
    };
  }

  // 2. Check inactive / expired -- serve branded expiry page if configured
  const isExpired = qr.expires_at && new Date(qr.expires_at) < new Date();
  const isInactive = !qr.is_active;

  if (isInactive || isExpired) {
    const expiryConfig = qr.expiry_page_config as unknown as ExpiryPageConfig | null;

    if (expiryConfig?.isEnabled) {
      const html = buildExpiryPage(expiryConfig);
      return {
        ok: false,
        response: new Response(html, {
          status: 410,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      };
    }

    return {
      ok: false,
      response: codeErrorResponse(
        request,
        isExpired ? CODE_ERRORS.expired : CODE_ERRORS.inactive,
      ),
    };
  }

  // 3. A hosted contact card has no destination to redirect to; its payload is
  //    the .vcf. Hand the caller the short code so GET can serve it.
  const sd = qr.static_data;
  const isHostedContact =
    qr.content_type === "vcard" &&
    !!sd &&
    typeof sd === "object" &&
    !Array.isArray(sd) &&
    (sd as { hostedContact?: unknown }).hostedContact === true;

  // 4. Determine destination URL
  //    Priority: scheduled redirects -> base destination_url
  let destinationUrl = qr.destination_url;

  // 3a. Evaluate scheduled redirects
  const schedConfig = qr.scheduled_redirects as unknown as ScheduledRedirects | null;
  if (schedConfig?.isActive) {
    destinationUrl = evaluateScheduledRedirects(schedConfig);
  }

  // 4. Parse request metadata
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get("user-agent") ?? null;
  const referrer = request.headers.get("referer") ?? null;
  const acceptLanguage = request.headers.get("accept-language") ?? null;
  const { device_type, os, browser } = parseUserAgent(userAgent);

  // 3b. Evaluate routing rules (after UA parsing, may override destination)
  const routingRules = qr.routing_rules as unknown as RoutingRule[] | null;
  if (routingRules?.length) {
    // Try to get country from Cloudflare/Vercel geo headers
    const country =
      request.headers.get("cf-ipcountry") ??
      request.headers.get("x-vercel-ip-country") ??
      null;

    const routedDest = evaluateRoutingRules(
      routingRules,
      device_type,
      acceptLanguage,
      country,
    );
    if (routedDest) {
      destinationUrl = routedDest;
    }
  }

  // 5. Determine uniqueness (same IP + user_agent within last 24 hours)
  let isUnique = true;

  if (ipAddress && userAgent) {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const { count } = await supabase
      .from("scan_events")
      .select("id", { count: "exact", head: true })
      .eq("qr_code_id", qr.id)
      .eq("ip_address", ipAddress)
      .eq("user_agent", userAgent)
      .gte("scanned_at", twentyFourHoursAgo);

    if (count && count > 0) {
      isUnique = false;
    }
  }

  // 6. Insert scan event
  const { error: insertError } = await supabase.from("scan_events").insert({
    qr_code_id: qr.id,
    ip_address: ipAddress,
    user_agent: userAgent,
    referrer,
    device_type,
    os,
    browser,
    is_unique: isUnique,
  });

  if (insertError) {
    console.error("[scan] Failed to insert scan event:", insertError.message);
    // Continue with redirect even if logging failed -- user experience first
  }

  // 7. Atomically increment counters on qr_codes
  //    Try RPC first (atomic), fall back to read-modify-write if RPC doesn't exist yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpcResult = await (supabase.rpc as any)("increment_scan_counters", {
    qr_id: qr.id,
    is_unique_scan: isUnique,
  });

  if (rpcResult.error) {
    // Fallback: read-modify-write (race-prone but works without the RPC)
    const { data: current } = await supabase
      .from("qr_codes")
      .select("total_scans, unique_scans")
      .eq("id", qr.id)
      .single();

    if (current) {
      const updates: Record<string, unknown> = {
        total_scans: current.total_scans + 1,
        last_scan_at: new Date().toISOString(),
      };
      if (isUnique) {
        updates.unique_scans = current.unique_scans + 1;
      }
      await supabase.from("qr_codes").update(updates).eq("id", qr.id);
    }
  }

  return {
    ok: true,
    destination_url: destinationUrl,
    is_unique: isUnique,
    contact_short_code: isHostedContact ? qr.short_code : null,
  };
}

// ---------------------------------------------------------------------------
// GET /api/v1/scan/:shortCode  -- Browser redirect (302)
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  try {
    const { shortCode } = await params;
    const result = await recordScan(request, shortCode);

    if (!result.ok) return result.response;

    // A contact card scanned via its bare short link: send the visitor to the
    // .vcf rather than reporting a missing destination it was never meant to
    // have. The scan is already logged above, so analytics are unaffected.
    if (result.contact_short_code) {
      return NextResponse.redirect(
        contactUrl(result.contact_short_code),
        302,
      );
    }

    if (!result.destination_url) {
      return codeErrorResponse(request, CODE_ERRORS.noDestination);
    }

    return NextResponse.redirect(result.destination_url, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/scan/:shortCode  -- Scan logging for redirect service
// ---------------------------------------------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  try {
    const { shortCode } = await params;
    const result = await recordScan(request, shortCode);

    if (!result.ok) return result.response;

    return apiSuccess({
      destination_url: result.destination_url,
      is_unique: result.is_unique,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
