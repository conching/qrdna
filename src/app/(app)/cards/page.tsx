"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { BusinessCard } from "@/lib/cards/types";

export default function CardsPage() {
  const { user } = useUser();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/v1/cards${qs}`);
      const json = await res.json();
      if (res.ok) {
        setCards(json.data ?? []);
        setTotal(json.meta?.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCards, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchCards, search]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/v1/cards/${id}`, { method: "DELETE" });
    setCards((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  };

  if (user && !user.isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Sparkles className="mb-4 h-12 w-12 text-primary/40" />
        <p className="font-semibold text-lg">Business Cards is a Pro feature</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Create unlimited digital business cards with your own shareable page.
        </p>
        <Button
          className="mt-6 gap-2"
          onClick={() => setUpgradeOpen(true)}
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to Pro
        </Button>
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          featureName="Business Cards"
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0 ? `${total} card${total !== 1 ? "s" : ""}` : "No cards yet"}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/cards/new">
            <Plus className="h-4 w-4" />
            New card
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cards…"
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState hasSearch={!!search} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              onDelete={handleDelete}
              deleting={deleting === card.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card item
// ─────────────────────────────────────────────────────────────────────────────

function CardRow({
  card,
  onDelete,
  deleting,
}: {
  card: BusinessCard;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const accent = card.theme?.accentColor ?? "#7C5CFF";

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      {/* Color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <div className="p-4">
        {/* Avatar + name */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            {card.first_name[0]}{card.last_name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {card.first_name} {card.last_name}
            </p>
            {card.title && (
              <p className="truncate text-xs text-muted-foreground">{card.title}</p>
            )}
            {card.company && (
              <p className="truncate text-xs text-muted-foreground">{card.company}</p>
            )}
          </div>

          {!card.is_active && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Inactive
            </Badge>
          )}
        </div>

        {/* Slug */}
        <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
          /card/{card.slug}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Link href={`/cards/${card.id}`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Link href={`/card/${card.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-1.5 text-xs text-destructive hover:text-destructive"
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete card?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the card for{" "}
                  <strong>
                    {card.first_name} {card.last_name}
                  </strong>{" "}
                  and its analytics. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(card.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <CreditCard className="mb-4 h-12 w-12 text-muted-foreground/40" />
      {hasSearch ? (
        <>
          <p className="font-medium">No cards match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different name or company</p>
        </>
      ) : (
        <>
          <p className="font-medium">No business cards yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first digital business card to share with the world
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link href="/cards/new">
              <Plus className="h-4 w-4" />
              Create first card
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
