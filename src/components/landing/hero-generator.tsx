"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type QRCodeStyling from "qr-code-styling";

import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { createQRCode } from "@/lib/qr/generator";
import { encodeURL } from "@/lib/qr/encoders";
import { downloadBlob, exportQR } from "@/lib/qr/export";
import { templates, type QRTemplate } from "@/lib/qr/templates";
import type { DotStyle, ErrorCorrectionLevel } from "@/lib/qr/types";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { cn } from "@/lib/utils";

/**
 * Edge length the symbol is rendered at, in CSS pixels. qr-code-styling writes
 * a viewBox onto the SVG, so the element scales past this without resampling —
 * the number only decides how the module grid is rounded.
 */
const QR_SIZE = 320;

/**
 * Longest destination the field accepts. Long enough for a URL carrying a full
 * set of UTM parameters, and far below the 2,331 bytes a level-M symbol holds.
 */
const MAX_LENGTH = 300;

/** Byte-mode capacity of a version-40 symbol at each correction level. */
const BYTE_CAPACITY: Record<ErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

/** Share of the codewords a symbol can lose and still decode. */
const RECOVERY: Record<ErrorCorrectionLevel, string> = {
  L: "7%",
  M: "15%",
  Q: "25%",
  H: "30%",
};

/** Corner radius that hints at each dot style on the preset swatches. */
const SWATCH_RADIUS: Record<DotStyle, string> = {
  square: "0px",
  rounded: "3px",
  "extra-rounded": "5px",
  dots: "999px",
  classy: "0 4px 0 4px",
  "classy-rounded": "1px 5px 1px 5px",
};

/** Real templates from the editor, so the hand-off lands on the same style. */
const PRESET_IDS = ["tech", "minimal", "neon", "social", "elegant"] as const;

const ORDERED = PRESET_IDS.map((id) =>
  templates.find((t) => t.id === id),
).filter((t): t is QRTemplate => t !== undefined);

const PRESETS: QRTemplate[] =
  ORDERED.length > 0 ? ORDERED : templates.slice(0, 5);

interface Readout {
  encoded: string;
  modules: number;
  version: number;
  bytes: number;
  level: ErrorCorrectionLevel;
}

/** `#7C5CFF` or a two-stop swatch of the template's gradient. */
function swatchFill(style: QRTemplate["style"]): string {
  const stops = style.gradient?.colorStops;
  if (!stops || stops.length < 2) return style.fgColor;
  return `linear-gradient(135deg, ${stops[0].color}, ${stops[stops.length - 1].color})`;
}

function fileSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "qr-code";
}

export function HeroGenerator() {
  const [value, setValue] = useState("qrdna.io");
  const [presetIndex, setPresetIndex] = useState(0);
  const [readout, setReadout] = useState<Readout | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const preset = PRESETS[presetIndex];
  const destination = useDebounce(value, 160).trim();
  const hasData = destination.length > 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host || !destination) return;

    let cancelled = false;
    const encoded = encodeURL({ url: destination });

    let qr: QRCodeStyling;
    let modules: number;
    try {
      qr = createQRCode(encoded, preset.style, QR_SIZE);
      modules = qr._qr?.getModuleCount() ?? 0;
      // The spec asks for four blank modules around the symbol. Sizing the
      // margin off the measured module count keeps that true at every version
      // instead of guessing a pixel value that drifts as the payload grows.
      const dot = modules > 0 ? Math.floor(QR_SIZE / (modules + 8)) : 0;
      qr.update({ margin: dot * 4 });
    } catch {
      qrRef.current = null;
      return;
    }

    host.replaceChildren();
    qr.append(host);
    qrRef.current = qr;

    // The readout describes the symbol that was actually drawn, so it is
    // written once the SVG resolves rather than alongside the request for it.
    void Promise.resolve(qr._svgDrawingPromise).then(() => {
      if (cancelled) return;
      setReadout({
        encoded,
        modules,
        version: modules > 0 ? (modules - 17) / 4 : 0,
        bytes: new TextEncoder().encode(encoded).length,
        level: preset.style.errorCorrection,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [destination, preset]);

  const handleDownload = useCallback(async () => {
    const qr = qrRef.current;
    if (!qr) return;
    setIsDownloading(true);
    try {
      const blob = await exportQR(qr, "svg");
      downloadBlob(blob, `${fileSlug(destination)}.svg`);
    } catch {
      toast.error("That code could not be written to a file. Try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [destination]);

  /**
   * Carry the field and the chosen style into the editor. Both pages share the
   * one client-side store, so an in-app navigation arrives with the code
   * already loaded; a cold load simply starts empty.
   */
  const handOff = useCallback(() => {
    const store = useQREditorStore.getState();
    store.setContentType("url");
    const typed = value.trim();
    if (typed) store.setInputData({ url: typed });
    store.applyTemplate(preset.style);
  }, [value, preset]);

  return (
    <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-14">
      {/* ---------------------------------------------------------------- */}
      <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
        <h1 className="text-balance font-sans text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.98] font-bold tracking-[-0.035em]">
          Type a link. Print the code.
        </h1>
        <p className="mt-6 max-w-[min(66ch,36rem)] text-base leading-relaxed text-muted-foreground sm:text-lg">
          QR DNA writes styled, correctly encoded QR codes in the browser. Ten
          content types, five export formats, no watermark. An account is for
          keeping and changing codes &mdash; not for making them.
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Specimen. Second in source order so it lands under the headline on  */}
      {/* narrow screens, and is placed into the right column from lg up.     */}
      <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-center">
        <figure className="mx-auto w-full max-w-[26rem] rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="overflow-hidden rounded-xl ring-1 ring-border">
            {hasData ? (
              <div
                ref={containerRef}
                role="img"
                aria-label={`QR code for ${destination}`}
                className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              />
            ) : (
              <p className="flex aspect-square items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
                Enter a destination and the code appears here.
              </p>
            )}
          </div>

          <figcaption className="mt-4">
            {readout && hasData ? (
              <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-5 gap-y-2 font-mono text-xs">
                <dt className="text-muted-foreground">encodes</dt>
                <dd className="truncate" title={readout.encoded}>
                  {readout.encoded}
                </dd>

                <dt className="text-muted-foreground">symbol</dt>
                <dd>
                  version {readout.version} &middot; {readout.modules} &times;{" "}
                  {readout.modules} modules
                </dd>

                <dt className="text-muted-foreground">correction</dt>
                <dd>
                  level {readout.level} &middot; {RECOVERY[readout.level]}{" "}
                  recoverable
                </dd>

                <dt className="text-muted-foreground">payload</dt>
                <dd>
                  {readout.bytes} of{" "}
                  {BYTE_CAPACITY[readout.level].toLocaleString("en-US")} bytes
                </dd>
              </dl>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                vector svg &middot; level {preset.style.errorCorrection}{" "}
                correction &middot; four-module quiet zone
              </p>
            )}
          </figcaption>
        </figure>
      </div>

      {/* ---------------------------------------------------------------- */}
      <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2">
        <div className="max-w-xl">
          <label
            htmlFor="hero-destination"
            className="block text-sm font-medium"
          >
            Destination
          </label>
          <input
            id="hero-destination"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            maxLength={MAX_LENGTH}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="qrdna.io"
            aria-describedby="hero-destination-help"
            className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 font-mono text-base text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <p
            id="hero-destination-help"
            className="mt-2 text-sm text-muted-foreground"
          >
            Encoded as you type. <code className="font-mono">https://</code> is
            added if you leave it out.
          </p>
        </div>

        <div className="mt-7">
          <p id="hero-style-label" className="text-sm font-medium">
            Style
          </p>
          <div
            role="group"
            aria-labelledby="hero-style-label"
            className="mt-2 flex flex-wrap gap-2"
          >
            {PRESETS.map((p, i) => {
              const active = i === presetIndex;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetIndex(i)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full ring-1 ring-border ring-inset"
                    style={{ background: p.style.bgColor }}
                  >
                    <span
                      className="block size-3"
                      style={{
                        background: swatchFill(p.style),
                        borderRadius: SWATCH_RADIUS[p.style.dotStyle],
                      }}
                    />
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={!hasData || isDownloading}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            Download SVG
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/create" onClick={handOff}>
              Open in the editor
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 max-w-[min(65ch,30rem)] text-sm text-muted-foreground">
          A plain vector SVG with a four-module quiet zone, so it holds up at
          any print size. No account, no watermark. PNG, JPEG, WebP and a
          millimetre-sized PDF are in the editor.
        </p>
      </div>
    </div>
  );
}
