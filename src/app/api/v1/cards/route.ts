import { createClient } from "@/lib/supabase/server";
import { apiError, apiSuccess, dbError, unexpectedError } from "@/lib/api/errors";
import { generateCardSlug } from "@/lib/cards/slug";
import { DEFAULT_THEME } from "@/lib/cards/types";
import type { CreateCardPayload } from "@/lib/cards/types";
import type { Json } from "@/types/database";
import { requirePro } from "@/lib/stripe/require-pro";

// ---------------------------------------------------------------------------
// POST /api/v1/cards  — Create a new business card
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

    const block = await requirePro();
    if (block) return block;

    const body = (await request.json()) as CreateCardPayload;

    if (!body.first_name?.trim() || !body.last_name?.trim()) {
      return apiError(400, "first_name and last_name are required", "VALIDATION_ERROR");
    }

    const slug = body.slug?.trim() || generateCardSlug(body.first_name, body.last_name);

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("business_cards")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return apiError(409, "Slug already in use — try a different one", "SLUG_CONFLICT");
    }

    const theme = { ...DEFAULT_THEME, ...(body.theme ?? {}) };

    const { data, error } = await supabase
      .from("business_cards")
      .insert({
        user_id: user.id,
        slug,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        pronouns: body.pronouns ?? null,
        title: body.title ?? null,
        company: body.company ?? null,
        department: body.department ?? null,
        bio: body.bio ?? null,
        phones: (body.phones ?? []) as unknown as Json,
        emails: (body.emails ?? []) as unknown as Json,
        websites: (body.websites ?? []) as unknown as Json,
        address: (body.address ?? null) as unknown as Json,
        social_links: (body.social_links ?? []) as unknown as Json,
        headshot_url: body.headshot_url ?? null,
        company_logo_url: body.company_logo_url ?? null,
        theme: theme as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      return dbError("cards", error);
    }

    return apiSuccess(data, undefined);
  } catch (err) {
    return unexpectedError("cards", err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/cards  — List business cards for the authenticated user
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
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("per_page") ?? 25)));
    const search = searchParams.get("search") ?? "";
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("business_cards")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return dbError("cards", error);
    }

    return apiSuccess(data ?? [], {
      page,
      per_page: perPage,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (err) {
    return unexpectedError("cards", err);
  }
}
