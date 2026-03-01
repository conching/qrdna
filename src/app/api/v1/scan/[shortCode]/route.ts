import { createServiceClient } from "@/lib/supabase/service";
import { parseUserAgent } from "@/lib/analytics/ua-parser";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { NextResponse } from "next/server";

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

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

type ScanResult =
  | { ok: true; destination_url: string | null; is_unique: boolean }
  | { ok: false; response: Response };

// ---------------------------------------------------------------------------
// Shared scan-logging logic (used by both GET and POST)
// ---------------------------------------------------------------------------

async function recordScan(
  request: Request,
  shortCode: string,
): Promise<ScanResult> {
  const supabase = createServiceClient();

  // 1. Look up the QR code by short_code
  const { data: qr, error: qrError } = await supabase
    .from("qr_codes")
    .select("id, destination_url, is_active, expires_at")
    .eq("short_code", shortCode)
    .single();

  if (qrError || !qr) {
    return { ok: false, response: apiError(404, "QR code not found", "NOT_FOUND") };
  }

  if (!qr.is_active) {
    return { ok: false, response: apiError(404, "QR code is inactive", "INACTIVE") };
  }

  if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
    return { ok: false, response: apiError(404, "QR code has expired", "EXPIRED") };
  }

  // 2. Parse request metadata
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get("user-agent") ?? null;
  const referrer = request.headers.get("referer") ?? null;
  const { device_type, os, browser } = parseUserAgent(userAgent);

  // 3. Determine uniqueness (same IP + user_agent within last 24 hours)
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

  // 4. Insert scan event
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
    // Continue with redirect even if logging failed — user experience first
  }

  // 5. Atomically increment counters on qr_codes
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

  return { ok: true, destination_url: qr.destination_url, is_unique: isUnique };
}

// ---------------------------------------------------------------------------
// GET /api/v1/scan/:shortCode  — Browser redirect (302)
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  try {
    const { shortCode } = await params;
    const result = await recordScan(request, shortCode);

    if (!result.ok) return result.response;

    if (!result.destination_url) {
      return apiError(404, "No destination URL configured", "NO_DESTINATION");
    }

    return NextResponse.redirect(result.destination_url, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/scan/:shortCode  — Scan logging for redirect service
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
