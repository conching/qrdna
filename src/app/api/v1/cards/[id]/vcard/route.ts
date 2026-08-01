import { createServiceClient } from "@/lib/supabase/service";
import { apiError, unexpectedError } from "@/lib/api/errors";
import { buildVCard } from "@/lib/cards/vcard";
import type { BusinessCard } from "@/lib/cards/types";

type Ctx = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/cards/[id]/vcard
// Public endpoint — no auth required (card must be active + public slug known)
// ---------------------------------------------------------------------------

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("business_cards")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return apiError(404, "Card not found", "NOT_FOUND");
    }

    const card = data as unknown as BusinessCard;
    const vcf = buildVCard(card);
    const filename = `${card.first_name}-${card.last_name}.vcf`
      .toLowerCase()
      .replace(/\s+/g, "-");

    return new Response(vcf, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return unexpectedError("cards/[id]/vcard", err);
  }
}
