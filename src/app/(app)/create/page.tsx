"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type QRCodeStyling from "qr-code-styling";
import { LogIn, Save, Loader2, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRPreview } from "@/components/qr/qr-preview";
import { QRTypeSelector } from "@/components/qr/qr-type-selector";
import { QRDataForm } from "@/components/qr/qr-data-forms";
import { QRStylePanel } from "@/components/qr/qr-style-panel";
import { QRLogoUpload } from "@/components/qr/qr-logo-upload";
import { QRTemplateBrowser } from "@/components/qr/qr-template-browser";
import { QRExportDialog } from "@/components/qr/qr-export-dialog";
import { UTMBuilder } from "@/components/qr/utm-builder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { useProjects } from "@/components/layout/project-sidebar";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { ProBadge } from "@/components/billing/pro-badge";

export default function CreatePage() {
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [qrInstance, setQRInstance] = useState<QRCodeStyling | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [qrType, setQrType] = useState<"static" | "dynamic">("static");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [utmEnrichedUrl, setUtmEnrichedUrl] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const { user: profile } = useUser();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();

  const name = useQREditorStore((s) => s.name);
  const setName = useQREditorStore((s) => s.setName);
  const contentType = useQREditorStore((s) => s.contentType);
  const inputData = useQREditorStore((s) => s.inputData);

  const handleQRInstanceChange = useCallback(
    (qr: QRCodeStyling | null) => setQRInstance(qr),
    [],
  );

  const handleUtmUrlChange = useCallback((url: string) => {
    setUtmEnrichedUrl(url);
  }, []);

  const handleSave = useCallback(async () => {
    const { contentType, inputData, style, name } =
      useQREditorStore.getState();

    const resolvedName =
      name.trim() || `QR Code - ${contentType}`;

    // Build the API payload
    const payload: Record<string, unknown> = {
      name: resolvedName,
      contentType,
      type: qrType,
      style,
      ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
    };

    // When UTM params are active and content type is URL, use the enriched URL
    const effectiveUrl =
      contentType === "url" && utmEnrichedUrl ? utmEnrichedUrl : null;

    if (qrType === "static") {
      payload.staticData = effectiveUrl
        ? { ...inputData, url: effectiveUrl }
        : inputData;
    } else {
      // Dynamic QR codes only support URL content type
      const url = effectiveUrl
        ?? (typeof inputData.url === "string" ? inputData.url.trim() : "");
      if (!url) {
        toast.error("A destination URL is required for dynamic QR codes.");
        return;
      }
      payload.destinationUrl =
        /^https?:\/\//i.test(url) ? url : `https://${url}`;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const envelope = await res.json();

      if (!res.ok || envelope.error) {
        if (envelope.error?.code === "UPGRADE_REQUIRED") {
          setUpgradeOpen(true);
          return;
        }
        const msg = envelope.error?.message ?? "Failed to save QR code.";
        toast.error(msg);
        return;
      }

      toast.success("QR code saved!");
      router.push(`/qr/${envelope.data.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [qrType, selectedProjectId, router, utmEnrichedUrl]);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Preview panel — collapsible on mobile, right side on desktop */}
      <div className="border-b bg-muted/30 lg:relative lg:order-2 lg:w-[400px] lg:border-b-0 lg:border-l">
        {/* Mobile: collapsible preview */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setPreviewExpanded(!previewExpanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Eye className="size-4" />
              QR Preview
            </span>
            {previewExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {previewExpanded && (
            <div className="flex items-center justify-center p-4">
              <QRPreview onQRInstanceChange={handleQRInstanceChange} />
            </div>
          )}
        </div>
        {/* Desktop: always visible */}
        <div className="hidden lg:flex lg:h-full lg:items-center lg:justify-center lg:p-8">
          <QRPreview onQRInstanceChange={handleQRInstanceChange} />
        </div>
      </div>

      {/* Form panel — scrollable */}
      <div className="min-h-0 flex-1 lg:order-1">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-sans text-xl font-bold sm:text-2xl">
                Create QR Code
              </h1>
              <div className="flex items-center gap-2">
                {!isLoading && user && (
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        Save
                      </>
                    )}
                  </Button>
                )}
                <QRExportDialog qrInstance={qrInstance} />
              </div>
            </div>

            {/* Save to account CTA for anonymous users */}
            {!isLoading && !user && (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Sign in to save & manage your QR codes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Track scans, edit destinations, and more.
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/login?redirectTo=/create">
                    <LogIn className="mr-1.5 size-3.5" />
                    Sign in
                  </Link>
                </Button>
              </div>
            )}

            {/* Name & QR type — shown only for authenticated users */}
            {!isLoading && user && (
              <section className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="qr-name" className="text-sm text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    id="qr-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My QR Code"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">
                    QR Type
                  </Label>
                  <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setQrType("static")}
                      className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                        qrType === "static"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:text-foreground"
                      }`}
                    >
                      Static
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (profile && !profile.isPro) {
                          setUpgradeOpen(true);
                          return;
                        }
                        if (contentType !== "url") {
                          toast.info(
                            "Dynamic QR codes only support URL content. Switching to URL type.",
                          );
                        }
                        setQrType("dynamic");
                      }}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                        qrType === "dynamic"
                          ? "bg-background text-foreground shadow-sm"
                          : "hover:text-foreground"
                      }`}
                    >
                      Dynamic
                      {profile && !profile.isPro && (
                        <ProBadge className="text-[9px]" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {qrType === "static"
                      ? "Data is encoded directly in the QR code image."
                      : "Scans go through a redirect URL you can change later (URL only)."}
                  </p>
                </div>

                {/* Project selector */}
                {!projectsLoading && projects.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">
                      Project
                    </Label>
                    <Select
                      value={selectedProjectId ?? "none"}
                      onValueChange={(v) =>
                        setSelectedProjectId(v === "none" ? null : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: p.color ?? "#7C5CFF",
                                }}
                              />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </section>
            )}

            {/* QR Type Selection */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Content Type
              </h2>
              <QRTypeSelector />
            </section>

            {/* Data Input */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Content
              </h2>
              <QRDataForm />

              {/* UTM Builder — shown only for URL content type */}
              {contentType === "url" && (
                <UTMBuilder
                  baseUrl={(inputData.url as string) ?? ""}
                  onUrlChange={handleUtmUrlChange}
                />
              )}
            </section>

            {/* Styling Tabs */}
            <Tabs defaultValue="style" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="style" className="flex-1">
                  Style
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex-1">
                  Templates
                </TabsTrigger>
                <TabsTrigger value="logo" className="flex-1">
                  Logo
                </TabsTrigger>
              </TabsList>
              <TabsContent value="style" className="mt-4">
                <QRStylePanel />
              </TabsContent>
              <TabsContent value="templates" className="mt-4">
                <QRTemplateBrowser />
              </TabsContent>
              <TabsContent value="logo" className="mt-4">
                <QRLogoUpload />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName="Dynamic QR codes"
      />
    </div>
  );
}
