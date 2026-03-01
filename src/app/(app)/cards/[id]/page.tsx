import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { BusinessCard } from "@/lib/cards/types";
import { CardForm } from "@/components/cards/card-form";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit business card — QR DNA" };

export default async function EditCardPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data } = await supabase
    .from("business_cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();

  const card = data as unknown as BusinessCard;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit business card</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {card.first_name} {card.last_name}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href={`/card/${card.slug}`} target="_blank">
            <ExternalLink className="h-4 w-4" />
            Preview
          </Link>
        </Button>
      </div>
      <CardForm card={card} />
    </div>
  );
}
