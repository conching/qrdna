"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Check,
  ClipboardCopy,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  MousePointerClick,
  Pencil,
  QrCode,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";
import type QRCodeStyling from "qr-code-styling";

import type { QRCodeRow } from "@/types/database";
import type { QRStyleConfig, QRContentType } from "@/lib/qr/types";
import { DEFAULT_STYLE } from "@/lib/qr/types";
import { createQRCode, updateQRCode } from "@/lib/qr/generator";
import { buildQRData, type QRInputMap } from "@/lib/qr/build-data";
import { encodeQRData } from "@/lib/qr/encoders";
import { exportQR, downloadBlob, getFileExtension } from "@/lib/qr/export";
import type { ExportFormat } from "@/lib/qr/export";
import { publicUrlForCode } from "@/lib/qr/public-url";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils/format";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { QRContentEditor } from "@/components/qr/qr-content-editor";
import { AnimatedCounter } from "@/components/analytics/animated-counter";
import { ScanTimeSeries } from "@/components/analytics/scan-time-series";
import { DeviceBreakdown } from "@/components/analytics/device-breakdown";
import { GeoBreakdown } from "@/components/analytics/geo-breakdown";
import { BrowserOsChart } from "@/components/analytics/browser-os-chart";
import { ReferrerList } from "@/components/analytics/referrer-list";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { StatTile } from "@/components/analytics/stat-tile";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QR_PREVIEW_SIZE = 280;

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "pdf", label: "PDF" },
  { value: "svg", label: "SVG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

const SIZE_OPTIONS = [512, 1024, 2048, 4096] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the data string to embed in the QR code from stored fields.
 *
 * This used to look for a `static_data.encoded` field that nothing ever wrote,
 * then fall through to the literal string "https://qrdna.io". The effect was
 * that every static code — vCard, Wi-Fi, text, email, geo — rendered and
 * exported a QR pointing at the marketing homepage instead of its own content.
 * Codes printed from that output are unrecoverable; they have to be reissued.
 *
 * The stored `static_data` is the same shape the editor produces, so the real
 * encoder can rebuild the payload from it. Passing `short_code` matters for
 * hosted contact cards: it is what turns the payload into /c/<code> rather than
 * a placeholder.
 */
function resolveQRDataString(qr: QRCodeRow, draft?: QRInputMap | null): string {
  // Dynamic codes encode their public link; the destination lives server-side.
  if (qr.type === "dynamic") {
    const link = publicUrlForCode(qr);
    if (link) return link.href;
  }

  // While the content editor is open, render what the user is typing rather
  // than what was last saved — otherwise the preview and the export silently
  // disagree with the form above them.
  const source =
    draft ??
    (qr.static_data &&
    typeof qr.static_data === "object" &&
    !Array.isArray(qr.static_data)
      ? (qr.static_data as QRInputMap)
      : null);

  if (source) {
    const data = buildQRData(
      qr.content_type as QRContentType,
      source,
      qr.short_code,
    );
    if (data) return encodeQRData(data);
  }

  // Nothing encodable. Return empty so the preview shows its "no content"
  // state rather than silently producing a scannable but wrong code.
  return qr.destination_url ?? "";
}

/** Parse the stored style JSON back into QRStyleConfig. */
function resolveStyle(qr: QRCodeRow): QRStyleConfig {
  if (qr.style && typeof qr.style === "object" && !Array.isArray(qr.style)) {
    return { ...DEFAULT_STYLE, ...(qr.style as Partial<QRStyleConfig>) };
  }
  return { ...DEFAULT_STYLE };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QRDetailViewProps {
  initialData: QRCodeRow;
}

export function QRDetailView({ initialData }: QRDetailViewProps) {
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Local state derived from initialData
  // ---------------------------------------------------------------------------
  const [qr, setQR] = useState<QRCodeRow>(initialData);
  const [name, setName] = useState(qr.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState(qr.destination_url ?? "");
  const [isActive, setIsActive] = useState(qr.is_active);
  const [expiresAt, setExpiresAt] = useState(qr.expires_at ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copiedShortUrl, setCopiedShortUrl] = useState(false);

  // Export dialog state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportSize, setExportSize] = useState(1024);
  const [exportQuality, setExportQuality] = useState(0.92);
  const [exportFilename, setExportFilename] = useState(qr.name || "qrcode");
  const [isExporting, setIsExporting] = useState(false);

  // Unsaved content-editor state, mirrored here so the preview and export
  // render the draft rather than the last saved row.
  const [draftData, setDraftData] = useState<QRInputMap | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Name input ref for auto-focus
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // QR code preview
  // ---------------------------------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);
  const appendedRef = useRef(false);

  const style = resolveStyle(qr);
  const qrDataString = resolveQRDataString(qr, draftData);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!qrInstanceRef.current) {
      qrInstanceRef.current = createQRCode(qrDataString, style, QR_PREVIEW_SIZE);
      // Clear container before appending
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      qrInstanceRef.current.append(containerRef.current);
      appendedRef.current = true;
    } else {
      updateQRCode(qrInstanceRef.current, qrDataString, style, QR_PREVIEW_SIZE);
    }
  }, [qrDataString, style]);

  // ---------------------------------------------------------------------------
  // API helpers
  // ---------------------------------------------------------------------------

  const saveField = useCallback(
    async (fields: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/v1/qr/${qr.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message ?? "Failed to save changes");
        }

        setQR(json.data);
        toast.success("Changes saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    },
    [qr.id],
  );

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  const handleNameSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === qr.name) {
      setName(qr.name);
      setIsEditingName(false);
      return;
    }
    setIsEditingName(false);
    saveField({ name: trimmed });
  }, [name, qr.name, saveField]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleNameSave();
      } else if (e.key === "Escape") {
        setName(qr.name);
        setIsEditingName(false);
      }
    },
    [handleNameSave, qr.name],
  );

  const handleDestinationSave = useCallback(() => {
    if (destinationUrl === (qr.destination_url ?? "")) return;
    saveField({ destinationUrl });
  }, [destinationUrl, qr.destination_url, saveField]);

  const handleActiveToggle = useCallback(
    (checked: boolean) => {
      setIsActive(checked);
      saveField({ isActive: checked });
    },
    [saveField],
  );

  const handleExpiresAtSave = useCallback(() => {
    const value = expiresAt || null;
    if (value === (qr.expires_at ?? null)) return;
    saveField({ expiresAt: value });
  }, [expiresAt, qr.expires_at, saveField]);

  const handleCopyShortUrl = useCallback(async () => {
    const link = publicUrlForCode(qr);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.href);
      setCopiedShortUrl(true);
      toast.success(`${link.label} copied`);
      setTimeout(() => setCopiedShortUrl(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [qr]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/qr/${qr.id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to delete");
      }

      toast.success("QR code deleted");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }, [qr.id, router]);

  const handleDuplicate = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${qr.name} (copy)`,
          contentType: qr.content_type,
          type: qr.type,
          // Omitted rather than sent as null: a static code has no
          // destination, and the schema accepts undefined, not null.
          ...(qr.destination_url ? { destinationUrl: qr.destination_url } : {}),
          ...(qr.static_data ? { staticData: qr.static_data } : {}),
          ...(qr.style ? { style: qr.style } : {}),
          tags: qr.tags ?? [],
          // A copy starts out holding the original's details. Publishing it
          // straight away would put a live contact link into the world before
          // its owner had a chance to change a single field.
          isActive: false,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to duplicate");
      }

      toast.success("Duplicated as a draft — edit the details, then publish.");
      router.push(`/qr/${json.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    }
  }, [qr, router]);

  const handlePublishToggle = useCallback(
    async (next: boolean) => {
      setIsPublishing(true);
      try {
        const res = await fetch(`/api/v1/qr/${qr.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: next }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message ?? "Failed to update");
        }
        setQR(json.data);
        setIsActive(next);
        toast.success(next ? "Published" : "Unpublished");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      } finally {
        setIsPublishing(false);
      }
    },
    [qr.id],
  );

  const handleDraftChange = useCallback((data: QRInputMap) => {
    setDraftData(data);
  }, []);

  const handleContentSaved = useCallback((row: QRCodeRow) => {
    setQR(row);
    setDraftData(null);
  }, []);

  const handleExport = useCallback(async () => {
    if (!qrInstanceRef.current) {
      toast.error("QR code is not ready");
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportQR(qrInstanceRef.current, exportFormat, {
        size: exportSize,
        quality: exportQuality,
      });
      const ext = getFileExtension(exportFormat);
      downloadBlob(blob, `${exportFilename}.${ext}`);
      toast.success(`Exported as ${ext.toUpperCase()}`);
      setExportOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, exportSize, exportQuality, exportFilename]);

  // Focus name input when editing
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const isDynamic = qr.type === "dynamic";
  // A hosted contact card lives at /c/<code>, a dynamic code at /<code>, and a
  // plain static code nowhere at all — the helper is the only thing that knows.
  const publicLink = publicUrlForCode(qr);
  const shortUrl = publicLink?.display ?? null;
  const showQualitySlider = exportFormat === "jpeg" || exportFormat === "webp";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* ----------------------------------------------------------------- */}
      {/* Right panel — QR preview (sticky on desktop, top on mobile)       */}
      {/* ----------------------------------------------------------------- */}
      <div className="sticky top-0 z-10 flex shrink-0 flex-col items-center justify-center gap-4 border-b bg-muted/30 p-4 lg:relative lg:order-2 lg:w-[400px] lg:border-b-0 lg:border-l lg:p-8">
        {/* Phone frame mockup */}
        <div className="relative rounded-2xl border-2 border-border bg-background p-6 shadow-lg">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
          <div
            className="flex items-center justify-center overflow-hidden rounded-xl bg-white"
            style={{ width: QR_PREVIEW_SIZE, height: QR_PREVIEW_SIZE }}
          >
            <div ref={containerRef} className="flex items-center justify-center" />
          </div>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-muted" />
        </div>

        {/* Export button below preview */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogTrigger asChild>
            <Button className="w-full max-w-[280px]">
              <Download className="mr-2 size-4" />
              Export QR Code
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export QR Code</DialogTitle>
            </DialogHeader>

            {/* Short URL in export dialog */}
            {shortUrl && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                <code className="flex-1 truncate text-sm font-medium">
                  {shortUrl}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyShortUrl();
                  }}
                >
                  {copiedShortUrl ? (
                    <Check className="size-3.5 text-success" />
                  ) : (
                    <ClipboardCopy className="size-3.5" />
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-4 pt-2">
              {/* Format */}
              <div className="space-y-1.5">
                <Label htmlFor="detail-export-format">Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as ExportFormat)}
                >
                  <SelectTrigger id="detail-export-format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div className="space-y-1.5">
                <Label htmlFor="detail-export-size">Size</Label>
                <Select
                  value={String(exportSize)}
                  onValueChange={(v) => setExportSize(Number(v))}
                >
                  <SelectTrigger id="detail-export-size" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} x {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality */}
              {showQualitySlider && (
                <div className="space-y-1.5">
                  <Label>Quality ({Math.round(exportQuality * 100)}%)</Label>
                  <Slider
                    min={0.5}
                    max={1}
                    step={0.01}
                    value={[exportQuality]}
                    onValueChange={([val]) => setExportQuality(val)}
                  />
                </div>
              )}

              {/* Filename */}
              <div className="space-y-1.5">
                <Label htmlFor="detail-export-filename">Filename</Label>
                <Input
                  id="detail-export-filename"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  placeholder="qrcode"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 size-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Short URL — prominent below export */}
        {shortUrl && (
          <div className="w-full max-w-[280px] space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-xs text-muted-foreground">{publicLink?.label ?? "Short URL"}</p>
            <div className="flex items-center justify-center gap-1.5">
              {/* --primary is 3.76:1 on the dark card — fine for a bar, short
                  of AA for text. The link reads in --foreground and takes its
                  affordance from the underline instead. */}
              <a
                href={publicLink?.href ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-foreground underline underline-offset-2 decoration-primary/50 hover:decoration-primary"
              >
                {shortUrl}
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={handleCopyShortUrl}
              >
                {copiedShortUrl ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <ClipboardCopy className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Left panel — details form (scrollable)                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="min-h-0 flex-1 overflow-y-auto lg:order-1">
        <div className="space-y-6 p-4 sm:p-6">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>

          {/* --------------------------------------------------------------- */}
          {/* Header — Name + badges                                          */}
          {/* --------------------------------------------------------------- */}
          <div className="space-y-2">
            {/* Editable name */}
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <Input
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  className="h-auto text-xl font-bold sm:text-2xl"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="group flex items-center gap-2 text-left"
                >
                  <h1 className="font-sans text-xl font-bold sm:text-2xl">
                    {qr.name}
                  </h1>
                  <Pencil className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              {isSaving && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {qr.type}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {qr.content_type.replace("_", " ")}
              </Badge>
              {/* Status carries a text label and a dot, never colour alone. */}
              <Badge variant={isActive ? "secondary" : "destructive"}>
                <span
                  className={cn(
                    "mr-1.5 size-1.5 rounded-full",
                    isActive ? "bg-success" : "bg-current",
                  )}
                  aria-hidden="true"
                />
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Dates */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Created {formatRelativeDate(qr.created_at)}</span>
              <span>Updated {formatRelativeDate(qr.updated_at)}</span>
            </div>
          </div>

          <Separator />

          {/* --------------------------------------------------------------- */}
          {/* Publish state                                                   */}
          {/* --------------------------------------------------------------- */}
          {/*
            A duplicate arrives here unpublished. Until it is published a
            hosted contact link returns "inactive" rather than handing a
            stranger the original person's details.
          */}
          {!isActive ? (
            <div
              className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4"
              data-testid="publish-panel"
            >
              <div>
                <p className="text-sm font-medium">Not published</p>
                <p className="text-xs text-muted-foreground">
                  {publicLink
                    ? `${publicLink.label} is not live yet. Edit the details below, then publish.`
                    : "Edit the details below, then publish when it is ready."}
                </p>
              </div>
              <Button
                onClick={() => handlePublishToggle(true)}
                disabled={isPublishing}
                data-testid="publish-button"
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 size-4" />
                )}
                Publish
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Published{publicLink ? ` at ${publicLink.display}` : ""}.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePublishToggle(false)}
                disabled={isPublishing}
                data-testid="unpublish-button"
              >
                Unpublish
              </Button>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* Content editor — static codes carry their data in the symbol    */}
          {/* --------------------------------------------------------------- */}
          {!isDynamic && (
            <>
              <QRContentEditor
                qr={qr}
                onDraftChange={handleDraftChange}
                onSaved={handleContentSaved}
              />
              <Separator />
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* Dynamic QR settings                                             */}
          {/* --------------------------------------------------------------- */}
          {isDynamic && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dynamic QR Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Short URL */}
                  {shortUrl && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        {publicLink?.label ?? "Short URL"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate font-mono">{shortUrl}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyShortUrl}
                          className="shrink-0"
                        >
                          {copiedShortUrl ? (
                            <Check className="size-4 text-success" />
                          ) : (
                            <ClipboardCopy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Destination URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="destination-url">Destination URL</Label>
                    <Input
                      id="destination-url"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      onBlur={handleDestinationSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleDestinationSave();
                      }}
                      placeholder="https://example.com"
                    />
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="active-toggle">Active</Label>
                      <p className="text-xs text-muted-foreground">
                        When inactive, scans will not redirect
                      </p>
                    </div>
                    <Switch
                      id="active-toggle"
                      checked={isActive}
                      onCheckedChange={handleActiveToggle}
                    />
                  </div>

                  {/* Expires at */}
                  <div className="space-y-1.5">
                    <Label htmlFor="expires-at">Expires at (optional)</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={expiresAt ? expiresAt.slice(0, 16) : ""}
                      onChange={(e) =>
                        setExpiresAt(
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        )
                      }
                      onBlur={handleExpiresAtSave}
                    />
                  </div>
                </CardContent>
              </Card>

              <Separator />
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* Scan Analytics section                                           */}
          {/* --------------------------------------------------------------- */}
          <QRAnalyticsSection qrId={qr.id} qr={qr} />

          <Separator />

          {/* --------------------------------------------------------------- */}
          {/* Actions section                                                 */}
          {/* --------------------------------------------------------------- */}
          <div className="flex flex-wrap gap-3">
            {/* Duplicate */}
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="mr-2 size-4" />
              Duplicate
            </Button>

            {/* Delete */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete QR Code</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &ldquo;{qr.name}&rdquo;?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics data types (matches /api/v1/qr/:id/analytics response)
// ---------------------------------------------------------------------------

interface AnalyticsData {
  summary: {
    total_scans: number;
    unique_scans: number;
    last_scan_at: string | null;
    /** Crawler hits in the window, excluded from every figure above. */
    bot_scans: number;
  };
  timeSeries: { date: string; scans: number; unique: number }[];
  countries: { country: string; scans: number }[];
  cities: { city: string; country: string; scans: number }[];
  devices: { device_type: string; scans: number }[];
  browsers: { browser: string; scans: number }[];
  os: { os: string; scans: number }[];
  referrers: { referrer: string; scans: number }[];
}

type TimeRange = "7" | "30" | "90";

// ---------------------------------------------------------------------------
// QRAnalyticsSection — real analytics with tabbed charts
// ---------------------------------------------------------------------------

function QRAnalyticsSection({
  qrId,
  qr,
}: {
  qrId: string;
  qr: QRCodeRow;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<TimeRange>("30");
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  // Fetch analytics data
  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/qr/${qrId}/analytics?days=${days}`);
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json.error?.message ?? "Failed to fetch analytics");
        }

        setData(json.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load analytics",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [qrId, days]);

  // CSV export handler
  const handleExportCSV = useCallback(async () => {
    setIsExportingCSV(true);
    try {
      const res = await fetch(`/api/v1/qr/${qrId}/analytics/export`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "scans-export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export CSV",
      );
    } finally {
      setIsExportingCSV(false);
    }
  }, [qrId]);

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scan Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[260px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scan Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary ?? {
    total_scans: qr.total_scans,
    unique_scans: qr.unique_scans,
    last_scan_at: qr.last_scan_at,
    // The row's counters carry no bot figure; only the analytics call does.
    bot_scans: 0,
  };

  const hasData =
    (data?.timeSeries?.length ?? 0) > 0 || summary.total_scans > 0;

  return (
    <div className="space-y-4">
      {/* Header with time range and export */}
      <div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Scan Analytics
              </CardTitle>

              <div className="flex items-center gap-2">
                {/* Time range selector */}
                <Select
                  value={days}
                  onValueChange={(v) => setDays(v as TimeRange)}
                >
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <Calendar className="mr-1.5 size-3 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                {/* Export CSV */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleExportCSV}
                  disabled={isExportingCSV}
                >
                  {isExportingCSV ? (
                    <Loader2 className="mr-1.5 size-3 animate-spin" />
                  ) : (
                    <Download className="mr-1.5 size-3" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Summary stats — same tile as the dashboard and the account
                analytics page, so the same number reads the same everywhere. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile
                icon={MousePointerClick}
                label="Total Scans"
                value={<AnimatedCounter value={summary.total_scans} />}
              />
              <StatTile
                icon={Users}
                label="Unique Scans"
                value={<AnimatedCounter value={summary.unique_scans} />}
              />
              <StatTile
                icon={QrCode}
                label="Last Scan"
                value={
                  <span className="text-sm font-medium">
                    {formatRelativeDate(summary.last_scan_at)}
                  </span>
                }
              />
            </div>

            {/*
              Crawler hits are excluded from every number above. Saying so is
              the difference between "my scans aren't being counted" and "the
              three hits from pasting this into Slack were link previews".
            */}
            {summary.bot_scans > 0 && (
              <p
                className="text-xs text-muted-foreground"
                data-testid="bot-scan-note"
              >
                {summary.total_scans.toLocaleString()}{" "}
                {summary.total_scans === 1 ? "scan" : "scans"},{" "}
                {summary.bot_scans.toLocaleString()}{" "}
                {summary.bot_scans === 1 ? "link preview" : "link previews"}{" "}
                not counted — automated fetches by chat and social apps, not
                people.
              </p>
            )}

            {/* Tabbed chart interface */}
            {hasData ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-3 w-full justify-start">
                  <TabsTrigger value="overview" className="gap-1.5 text-xs">
                    <BarChart3 className="size-3" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="geography" className="gap-1.5 text-xs">
                    <Globe className="size-3" />
                    Geography
                  </TabsTrigger>
                  <TabsTrigger value="devices" className="gap-1.5 text-xs">
                    <Smartphone className="size-3" />
                    Devices
                  </TabsTrigger>
                  <TabsTrigger value="sources" className="gap-1.5 text-xs">
                    <Link2 className="size-3" />
                    Sources
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <ScanTimeSeries
                    data={data?.timeSeries ?? []}
                    title={`Scans over ${days} days`}
                  />
                </TabsContent>

                <TabsContent value="geography">
                  <GeoBreakdown
                    countries={data?.countries ?? []}
                    cities={data?.cities ?? []}
                  />
                </TabsContent>

                <TabsContent value="devices" className="space-y-4">
                  <DeviceBreakdown data={data?.devices ?? []} />
                  <BrowserOsChart
                    browsers={data?.browsers ?? []}
                    os={data?.os ?? []}
                  />
                </TabsContent>

                <TabsContent value="sources">
                  <ReferrerList data={data?.referrers ?? []} />
                </TabsContent>
              </Tabs>
            ) : (
              <AnalyticsEmptyState
                title="No scans recorded yet"
                description="Analytics data will appear here once your QR code receives its first scan."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
