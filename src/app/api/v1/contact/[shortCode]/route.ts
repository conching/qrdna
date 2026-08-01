import { createServiceClient } from "@/lib/supabase/service";
import { apiError } from "@/lib/api/errors";
import { codeErrorResponse, CODE_ERRORS } from "@/lib/qr/code-response";
import { buildVCard } from "@/lib/vcard/build";
import { toVCardInput } from "@/lib/qr/encoders";
import type { VCardData } from "@/lib/qr/types";

type Ctx = { params: Promise<{ shortCode: string }> };

/**
 * GET /api/v1/contact/:shortCode
 *
 * Serves a saved vCard QR code as a downloadable .vcf, with the headshot
 * embedded. Public — the short code is the capability.
 *
 * This route exists because a photo cannot live inside a QR code: the format
 * tops out at 2953 bytes and a usable headshot is 10–30 KB base64. Pointing the
 * QR at this endpoint is the only way a scan can land a contact *with a
 * picture* in the phone's address book.
 *
 * Reached as `/c/:shortCode` via a middleware rewrite so the encoded URL stays
 * short — every character costs QR modules.
 */
export async function GET(request: Request, { params }: Ctx) {
  try {
    const { shortCode } = await params;
    const supabase = createServiceClient();

    const { data: qr, error } = await supabase
      .from("qr_codes")
      .select("id, name, content_type, static_data, is_active, expires_at")
      .eq("short_code", shortCode)
      .single();

    if (error || !qr || qr.content_type !== "vcard") {
      return codeErrorResponse(request, CODE_ERRORS.contactUnavailable);
    }
    if (!qr.is_active) {
      return codeErrorResponse(request, CODE_ERRORS.inactive);
    }
    if (qr.expires_at && new Date(qr.expires_at) < new Date()) {
      return codeErrorResponse(request, CODE_ERRORS.expired);
    }

    const data = (qr.static_data ?? {}) as unknown as VCardData;
    if (!data.firstName && !data.lastName) {
      return codeErrorResponse(request, CODE_ERRORS.contactUnavailable);
    }

    // Photo included here (unlike the QR payload) — this is the whole point.
    const vcf = buildVCard(toVCardInput(data), { includePhoto: true });

    const filename =
      [data.firstName, data.lastName]
        .filter(Boolean)
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "contact";

    return new Response(vcf, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.vcf"`,
        // Contacts change; a stale cached vCard is worse than a round trip.
        "Cache-Control": "public, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
