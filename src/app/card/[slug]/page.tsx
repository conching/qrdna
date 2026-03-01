import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import type { BusinessCard } from "@/lib/cards/types";
import { CenteredLayout } from "@/components/cards/card-layouts/centered-layout";
import { LeftAlignedLayout } from "@/components/cards/card-layouts/left-aligned-layout";
import { SplitLayout } from "@/components/cards/card-layouts/split-layout";
import { MinimalLayout } from "@/components/cards/card-layouts/minimal-layout";
import { CardViewTracker } from "@/components/cards/card-view-tracker";

type Props = { params: Promise<{ slug: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────────────────

async function getCard(slug: string): Promise<BusinessCard | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("business_cards")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data as BusinessCard | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Open Graph metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCard(slug);

  if (!card) {
    return { title: "Card not found" };
  }

  const fullName = `${card.first_name} ${card.last_name}`;
  const description = [card.title, card.company, card.bio]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 160);

  return {
    title: fullName,
    description,
    openGraph: {
      title: fullName,
      description,
      type: "profile",
      ...(card.headshot_url && { images: [{ url: card.headshot_url }] }),
    },
    twitter: {
      card: "summary",
      title: fullName,
      description,
      ...(card.headshot_url && { images: [card.headshot_url] }),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function CardPage({ params }: Props) {
  const { slug } = await params;
  const card = await getCard(slug);

  if (!card) {
    notFound();
  }

  const layout = card.theme?.layout ?? "centered";

  return (
    <>
      <CardViewTracker cardId={card.id} />

      {layout === "centered" && <CenteredLayout card={card} />}
      {layout === "left-aligned" && <LeftAlignedLayout card={card} />}
      {layout === "split" && <SplitLayout card={card} />}
      {layout === "minimal" && <MinimalLayout card={card} />}
    </>
  );
}

// Static params generation is opt-in for ISR — skip for now (dynamic SSR is fine)
export const dynamic = "force-dynamic";
