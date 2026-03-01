"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  ChevronDown,
  Copy,
  Check,
  Eraser,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

interface UTMBuilderProps {
  baseUrl: string;
  onUrlChange: (url: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

interface UTMPreset {
  label: string;
  params: Partial<UTMParams>;
}

const UTM_PRESETS: UTMPreset[] = [
  {
    label: "QR Code Print Campaign",
    params: {
      utm_source: "qr_code",
      utm_medium: "print",
      utm_campaign: "",
    },
  },
  {
    label: "Email Campaign",
    params: {
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "",
    },
  },
  {
    label: "Social Media",
    params: {
      utm_source: "social",
      utm_medium: "organic_social",
      utm_campaign: "",
    },
  },
];

// ---------------------------------------------------------------------------
// UTM field definitions
// ---------------------------------------------------------------------------

const UTM_FIELDS: {
  key: keyof UTMParams;
  label: string;
  placeholder: string;
  required: boolean;
}[] = [
  {
    key: "utm_source",
    label: "Source",
    placeholder: 'e.g. "qr_code", "flyer", "poster"',
    required: true,
  },
  {
    key: "utm_medium",
    label: "Medium",
    placeholder: 'e.g. "offline", "print", "email"',
    required: true,
  },
  {
    key: "utm_campaign",
    label: "Campaign",
    placeholder: 'e.g. "summer_sale_2026"',
    required: true,
  },
  {
    key: "utm_term",
    label: "Term",
    placeholder: "Keywords / terms (optional)",
    required: false,
  },
  {
    key: "utm_content",
    label: "Content",
    placeholder: "A/B test variant (optional)",
    required: false,
  },
];

const EMPTY_PARAMS: UTMParams = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUrlWithUTM(baseUrl: string, params: UTMParams): string {
  if (!baseUrl.trim()) return "";

  // Collect non-empty params
  const entries = Object.entries(params).filter(
    ([, v]) => v.trim().length > 0,
  );
  if (entries.length === 0) return baseUrl;

  try {
    // Normalise to a full URL so we can use URL API
    const normalised = /^https?:\/\//i.test(baseUrl)
      ? baseUrl
      : `https://${baseUrl}`;
    const url = new URL(normalised);
    for (const [key, value] of entries) {
      url.searchParams.set(key, value.trim());
    }
    return url.toString();
  } catch {
    // If URL parsing fails, fall back to manual string concat
    const qs = entries.map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`).join("&");
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}${qs}`;
  }
}

function hasAnyUTM(params: UTMParams): boolean {
  return Object.values(params).some((v) => v.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UTMBuilder({ baseUrl, onUrlChange, className }: UTMBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [params, setParams] = useState<UTMParams>({ ...EMPTY_PARAMS });
  const [copied, setCopied] = useState(false);

  // Build the full URL whenever params or baseUrl change
  const fullUrl = useMemo(
    () => buildUrlWithUTM(baseUrl, params),
    [baseUrl, params],
  );

  // Notify parent of URL change
  useEffect(() => {
    if (hasAnyUTM(params) && baseUrl.trim()) {
      onUrlChange(fullUrl);
    } else {
      onUrlChange(baseUrl);
    }
  }, [fullUrl, baseUrl, params, onUrlChange]);

  const updateParam = useCallback((key: keyof UTMParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((presetIndex: string) => {
    const idx = parseInt(presetIndex, 10);
    const preset = UTM_PRESETS[idx];
    if (!preset) return;
    setParams((prev) => ({ ...prev, ...preset.params }));
  }, []);

  const clearAll = useCallback(() => {
    setParams({ ...EMPTY_PARAMS });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }, [fullUrl]);

  const showPreview = hasAnyUTM(params) && baseUrl.trim().length > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
          isOpen
            ? "border-[#7C5CFF]/30 bg-[#7C5CFF]/5 text-foreground"
            : "border-border bg-transparent text-muted-foreground hover:border-[#7C5CFF]/20 hover:bg-[#7C5CFF]/5 hover:text-foreground",
        )}
      >
        <FlaskConical className="size-3.5 shrink-0 text-[#7C5CFF]" />
        <span className="flex-1 font-medium">Add UTM tracking</span>
        {hasAnyUTM(params) && (
          <span className="rounded-full bg-[#06D6A0]/15 px-2 py-0.5 text-xs font-medium text-[#06D6A0]">
            Active
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="relative mt-2 rounded-lg border border-border/60 bg-card">
              {/* Gradient left accent */}
              <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-lg bg-gradient-to-b from-[#7C5CFF] to-[#06D6A0]" />

              <div className="space-y-4 p-4 pl-5">
                {/* Preset selector + Clear row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select onValueChange={applyPreset}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Load preset..." />
                      </SelectTrigger>
                      <SelectContent>
                        {UTM_PRESETS.map((preset, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={clearAll}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Eraser className="size-3" />
                    Clear all
                  </Button>
                </div>

                {/* UTM fields */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {UTM_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <Label
                        htmlFor={`utm-${field.key}`}
                        className="text-xs text-muted-foreground"
                      >
                        {field.label}
                        {field.required && (
                          <span className="ml-0.5 text-[#7C5CFF]">*</span>
                        )}
                      </Label>
                      <Input
                        id={`utm-${field.key}`}
                        className="h-8 text-xs"
                        placeholder={field.placeholder}
                        value={params[field.key]}
                        onChange={(e) => updateParam(field.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Live URL preview */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Link2 className="size-3" />
                            Preview URL
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={handleCopy}
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            {copied ? (
                              <>
                                <Check className="size-3 text-[#06D6A0]" />
                                <span className="text-[#06D6A0]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <UTMPreviewUrl url={fullUrl} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// URL Preview with highlighted UTM params
// ---------------------------------------------------------------------------

function UTMPreviewUrl({ url }: { url: string }) {
  // Split the URL at the first "?" to separate base from query string
  const qIdx = url.indexOf("?");
  if (qIdx === -1) {
    return (
      <div className="overflow-x-auto rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed break-all">
        {url}
      </div>
    );
  }

  const base = url.slice(0, qIdx);
  const query = url.slice(qIdx + 1);
  const pairs = query.split("&");

  return (
    <div className="overflow-x-auto rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed break-all">
      <span className="text-muted-foreground">{base}?</span>
      {pairs.map((pair, i) => {
        const isUtm = pair.startsWith("utm_");
        return (
          <span key={i}>
            {i > 0 && <span className="text-muted-foreground">&</span>}
            <span className={isUtm ? "text-[#7C5CFF] font-medium" : "text-muted-foreground"}>
              {pair}
            </span>
          </span>
        );
      })}
    </div>
  );
}
