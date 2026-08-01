import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, dbError, unexpectedError } from "@/lib/api/errors";
import { parseBody, createQRSchema } from "@/lib/api/schemas";
import { generateShortCode } from "@/lib/utils/short-code";
import { DEFAULT_STYLE } from "@/lib/qr/types";
import type { Json } from "@/types/database";
import { requirePro } from "@/lib/stripe/require-pro";

// ---------------------------------------------------------------------------
// POST /api/v1/qr  — Create a new QR code
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const parsed = await parseBody(request, createQRSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const qrType = body.type;

    // Dynamic QR codes require Pro
    if (qrType === "dynamic") {
      const block = await requirePro();
      if (block) return block;
    }

    // A hosted contact card is static, but still needs a short code: the QR
    // encodes /c/<code>, which serves the .vcf with the headshot embedded.
    // Without this the photo has nowhere to be served from.
    const needsContactCode =
      body.contentType === "vcard" &&
      (body.staticData as { hostedContact?: boolean } | undefined)
        ?.hostedContact === true;

    const shortCode =
      qrType === "dynamic" || needsContactCode ? generateShortCode() : null;

    const { data, error } = await supabase
      .from("qr_codes")
      .insert({
        user_id: user.id,
        name: body.name,
        content_type: body.contentType,
        type: qrType,
        destination_url: body.destinationUrl ?? null,
        static_data: (body.staticData ?? null) as Json,
        short_code: shortCode,
        // `qr_codes.style` is NOT NULL, but the schema treats style as
        // optional — so any caller that left it out got an opaque 500 rather
        // than a code with default styling. The editor always sends one, which
        // is why only the API surface was affected.
        style: (body.style ?? DEFAULT_STYLE) as unknown as Json,
        project_id: body.projectId ?? null,
        tags: body.tags,
        // Omitted means "publish immediately", which is what creating from
        // scratch does. Duplicating passes false.
        ...(body.isActive === undefined ? {} : { is_active: body.isActive }),
      })
      .select()
      .single();

    if (error) {
      return dbError("qr", error);
    }

    return apiSuccess(data, undefined);
  } catch (err) {
    return unexpectedError("qr", err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/qr  — List QR codes for the authenticated user
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type") as "static" | "dynamic" | null;
    const search = searchParams.get("search");
    const favorited = searchParams.get("favorited");
    const sort = searchParams.get("sort") ?? "created_at";
    const order = searchParams.get("order") ?? "desc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the base query
    let query = supabase
      .from("qr_codes")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    // Apply optional filters
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    if (type) {
      query = query.eq("type", type);
    }
    if (favorited === "true") {
      query = query.eq("is_favorited", true);
    }
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Apply sorting
    const ascending = order === "asc";
    const validSorts = ["created_at", "updated_at", "name", "total_scans"];
    const sortColumn = validSorts.includes(sort) ? sort : "created_at";
    query = query.order(sortColumn, { ascending });

    // Apply pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return dbError("qr", error);
    }

    const total = count ?? 0;
    const hasMore = from + limit < total;

    return apiSuccess(data, { page, limit, total, hasMore });
  } catch (err) {
    return unexpectedError("qr", err);
  }
}
