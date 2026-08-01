"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  MousePointerClick,
  Plus,
  QrCode,
  Search,
} from "lucide-react";

import { toast } from "sonner";

import type { QRCodeRow } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { formatNumber } from "@/lib/utils/format";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { QRCodeCard } from "@/components/qr/qr-code-card";
import { StatTile } from "@/components/analytics/stat-tile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TypeFilter = "all" | "static" | "dynamic";
type SortOption = "newest" | "oldest" | "most-scans" | "name-az";

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [codes, setCodes] = useState<QRCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Project filter from URL
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<QRCodeRow | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  // ---------- Data fetching ----------

  useEffect(() => {
    let cancelled = false;

    async function fetchCodes() {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      let query = supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error: fetchError } = await query;

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setCodes((data as QRCodeRow[]) ?? []);
      setLoading(false);
    }

    fetchCodes();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ---------- Derived stats ----------

  const stats = useMemo(() => {
    const totalCodes = codes.length;
    const activeCodes = codes.filter((c) => c.is_active).length;
    const totalScans = codes.reduce((sum, c) => sum + c.total_scans, 0);
    return { totalCodes, activeCodes, totalScans };
  }, [codes]);

  // ---------- Filtered + sorted codes ----------

  const filteredCodes = useMemo(() => {
    let result = [...codes];

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((c) => c.type === typeFilter);
    }

    // Search filter (name, content_type, tags)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.content_type.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sort) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        break;
      case "most-scans":
        result.sort((a, b) => b.total_scans - a.total_scans);
        break;
      case "name-az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [codes, typeFilter, search, sort]);

  // ---------- Handlers ----------

  async function handleFavoriteToggle(id: string) {
    const target = codes.find((c) => c.id === id);
    if (!target) return;

    // Optimistic update
    setCodes((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, is_favorited: !c.is_favorited } : c
      )
    );

    try {
      const res = await fetch(`/api/v1/qr/${id}/favorite`, {
        method: "PATCH",
      });
      if (!res.ok) {
        // Revert on failure
        setCodes((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, is_favorited: target.is_favorited }
              : c
          )
        );
      }
    } catch {
      // Revert on network error
      setCodes((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, is_favorited: target.is_favorited }
            : c
        )
      );
    }
  }

  async function handleDuplicate(id: string) {
    const source = codes.find((c) => c.id === id);
    if (!source) return;

    try {
      const res = await fetch("/api/v1/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${source.name} (copy)`,
          contentType: source.content_type,
          type: source.type,
          // Omitted rather than sent as null: a static code has no
          // destination, and the schema accepts undefined, not null.
          ...(source.destination_url
            ? { destinationUrl: source.destination_url }
            : {}),
          ...(source.static_data ? { staticData: source.static_data } : {}),
          ...(source.style ? { style: source.style } : {}),
          tags: source.tags ?? [],
          // The copy carries the original's details, so it arrives unpublished
          // and stays that way until the user has edited it and said so.
          isActive: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not duplicate that code.");
        return;
      }
      // A duplicated dynamic or contact code gets its own short code, so the
      // copy is a genuinely new record rather than a second pointer.
      setCodes((prev) => [json.data as QRCodeRow, ...prev]);
      toast.success(`Duplicated as a draft — "${json.data.name}".`);
    } catch {
      toast.error("Network error — nothing was duplicated.");
    }
  }

  async function handleToggleActive(id: string, next: boolean) {
    const previous = codes;
    setCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: next } : c)),
    );

    try {
      const res = await fetch(`/api/v1/qr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        setCodes(previous);
        toast.error("Could not change that code's status.");
        return;
      }
      toast.success(next ? "Code reactivated." : "Code deactivated.");
    } catch {
      setCodes(previous);
      toast.error("Network error — nothing was changed.");
    }
  }

  /** Opens the confirmation dialog. The actual delete runs in confirmDelete. */
  function handleDelete(id: string) {
    const target = codes.find((c) => c.id === id);
    if (target) setPendingDelete(target);
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);

    const previous = codes;
    setCodes((prev) => prev.filter((c) => c.id !== target.id));

    try {
      const res = await fetch(`/api/v1/qr/${target.id}`, { method: "DELETE" });
      if (!res.ok) {
        setCodes(previous);
        toast.error(`Could not delete "${target.name}". Nothing was changed.`);
        return;
      }
      toast.success(`Deleted "${target.name}".`);
    } catch {
      setCodes(previous);
      toast.error("Network error — the code was not deleted.");
    }
  }

  // ---------- Sub-components ----------

  const hasFiltersApplied = search.trim() !== "" || typeFilter !== "all";

  return (
    <div className="p-6">
      {/* ---- Header ---- */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-sans text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" />
            Create QR Code
          </Link>
        </Button>
      </div>

      {/* ---- Stats row ---- */}
      {!loading && codes.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Same icon, label and treatment as the analytics page — a metric
              should not change appearance depending on which page shows it. */}
          <StatTile
            icon={QrCode}
            label="Total Codes"
            value={formatNumber(stats.totalCodes)}
          />
          <StatTile
            icon={Activity}
            label="Active Codes"
            value={formatNumber(stats.activeCodes)}
          />
          <StatTile
            icon={MousePointerClick}
            label="Total Scans"
            value={formatNumber(stats.totalScans)}
          />
        </div>
      )}

      {/* ---- Filter bar ---- */}
      {!loading && codes.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search QR codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type filter */}
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TypeFilter)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="dynamic">Dynamic</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as SortOption)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-scans">Most Scans</SelectItem>
              <SelectItem value="name-az">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ---- Loading state ---- */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ---- Error state ---- */}
      {!loading && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load QR codes: {error}
        </div>
      )}

      {/* ---- Empty state (no codes at all) ---- */}
      {!loading && !error && codes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <QrCode className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-sans text-lg font-semibold">
            No QR codes yet
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first QR code to get started.
          </p>
          <Button asChild>
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              Create QR Code
            </Link>
          </Button>
        </div>
      )}

      {/* ---- Empty search / filter results ---- */}
      {!loading &&
        !error &&
        codes.length > 0 &&
        filteredCodes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <Search className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="mb-2 font-sans text-lg font-semibold">
              No matching QR codes
            </h2>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {hasFiltersApplied
                ? "Try adjusting your search or filters."
                : "No QR codes match the current criteria."}
            </p>
            {hasFiltersApplied && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

      {/* ---- QR code card grid ---- */}
      {!loading && !error && filteredCodes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCodes.map((qrCode) => (
            <QRCodeCard
              key={qrCode.id}
              qrCode={qrCode}
              onFavoriteToggle={handleFavoriteToggle}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* ---- Delete confirmation ----
          Deliberately not window.confirm: a dynamic code may already be
          printed on physical material, so the dialog names the code and spells
          out what breaks. */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{pendingDelete?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.type === "dynamic" ? (
                <>
                  This code is dynamic, so anything already printed with it will
                  stop working immediately
                  {pendingDelete.total_scans > 0 && (
                    <> — it has been scanned {formatNumber(pendingDelete.total_scans)} times</>
                  )}
                  . This cannot be undone.
                </>
              ) : (
                <>
                  This removes the code and its history from your account.
                  Anything already printed keeps working, because a static code
                  carries its own data. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 p-4 pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t px-3 py-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-5" />
      </div>
    </Card>
  );
}
