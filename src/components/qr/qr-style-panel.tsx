"use client";

import { useCallback } from "react";
import { useQREditorStore } from "@/stores/qr-editor-store";
import type {
  DotStyle,
  CornerSquareStyle,
  CornerDotStyle,
  ErrorCorrectionLevel,
  QRGradient,
} from "@/lib/qr/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Dot style visual previews
// ---------------------------------------------------------------------------

const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "extra-rounded", label: "Extra Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Extra Rounded" },
];

const CORNER_DOT_STYLES: { value: CornerDotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

const EC_LEVELS: {
  value: ErrorCorrectionLevel;
  label: string;
  description: string;
}[] = [
  { value: "L", label: "Low", description: "~7% recovery" },
  { value: "M", label: "Medium", description: "~15% recovery" },
  { value: "Q", label: "Quartile", description: "~25% recovery" },
  { value: "H", label: "High", description: "~30% recovery" },
];

// ---------------------------------------------------------------------------
// Mini-grid renderers for style preview buttons
// ---------------------------------------------------------------------------

function DotStylePreview({ style }: { style: DotStyle }) {
  const cells = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1],
    [0, 2], [1, 2], [2, 2],
  ];
  const size = 8;
  const gap = 1.5;
  const total = size * 3 + gap * 2;

  function dotPath(x: number, y: number): string {
    const px = x * (size + gap);
    const py = y * (size + gap);
    const s = size;
    const r = size / 2;
    const cr = size * 0.2; // corner radius for rounded

    switch (style) {
      case "square":
        return `M${px},${py}h${s}v${s}h${-s}z`;
      case "rounded":
        return `M${px + cr},${py}h${s - 2 * cr}a${cr},${cr},0,0,1,${cr},${cr}v${s - 2 * cr}a${cr},${cr},0,0,1,${-cr},${cr}h${-(s - 2 * cr)}a${cr},${cr},0,0,1,${-cr},${-cr}v${-(s - 2 * cr)}a${cr},${cr},0,0,1,${cr},${-cr}z`;
      case "dots":
        return `M${px + r},${py}a${r},${r},0,1,1,0,${s}a${r},${r},0,1,1,0,${-s}z`;
      case "extra-rounded": {
        const er = size * 0.4;
        return `M${px + er},${py}h${s - 2 * er}a${er},${er},0,0,1,${er},${er}v${s - 2 * er}a${er},${er},0,0,1,${-er},${er}h${-(s - 2 * er)}a${er},${er},0,0,1,${-er},${-er}v${-(s - 2 * er)}a${er},${er},0,0,1,${er},${-er}z`;
      }
      case "classy":
        // Square with bottom-right corner rounded
        return `M${px},${py}h${s}v${s - r}a${r},${r},0,0,1,${-r},${r}h${-(s - r)}z`;
      case "classy-rounded": {
        // Rounded with bottom-right extra rounded
        const br = size * 0.35;
        return `M${px + cr},${py}h${s - 2 * cr}a${cr},${cr},0,0,1,${cr},${cr}v${s - cr - br}a${br},${br},0,0,1,${-br},${br}h${-(s - cr - br)}a${cr},${cr},0,0,1,${-cr},${-cr}v${-(s - 2 * cr)}a${cr},${cr},0,0,1,${cr},${-cr}z`;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      className="size-7"
      fill="currentColor"
    >
      {cells.map(([x, y]) => (
        <path key={`${x}-${y}`} d={dotPath(x, y)} />
      ))}
    </svg>
  );
}

function CornerSquarePreview({ style }: { style: CornerSquareStyle }) {
  const rounding =
    style === "square"
      ? "rounded-none"
      : style === "dot"
        ? "rounded-full"
        : "rounded-md";

  return (
    <div className="flex items-center justify-center">
      <div className={cn("size-6 border-[2.5px] border-current", rounding)} />
    </div>
  );
}

function CornerDotPreview({ style }: { style: CornerDotStyle }) {
  const rounding = style === "square" ? "rounded-none" : "rounded-full";

  return (
    <div className="flex items-center justify-center">
      <div className={cn("size-4 bg-current", rounding)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color input with hex text field
// ---------------------------------------------------------------------------

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-28 shrink-0 text-xs">{label}</Label>
      <label className="relative shrink-0">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div
          className="size-10 rounded-md border cursor-pointer"
          style={{ backgroundColor: value }}
        />
      </label>
      <Input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
        }}
        className="h-9 w-24 font-mono text-xs"
        maxLength={7}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function QRStylePanel() {
  const { style, setStyle } = useQREditorStore();

  const gradientEnabled = !!style.gradient;

  const toggleGradient = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        setStyle({
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: style.fgColor },
              { offset: 1, color: "#7C5CFF" },
            ],
          },
        });
      } else {
        setStyle({ gradient: null });
      }
    },
    [setStyle, style.fgColor],
  );

  const updateGradient = useCallback(
    (partial: Partial<QRGradient>) => {
      if (!style.gradient) return;
      setStyle({ gradient: { ...style.gradient, ...partial } });
    },
    [setStyle, style.gradient],
  );

  const updateGradientStop = useCallback(
    (index: number, color: string) => {
      if (!style.gradient) return;
      const stops = [...style.gradient.colorStops];
      stops[index] = { ...stops[index], color };
      setStyle({ gradient: { ...style.gradient, colorStops: stops } });
    },
    [setStyle, style.gradient],
  );

  return (
    <div className="space-y-4">
      {/* ---- Dot Style ---- */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Dot Style</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DOT_STYLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={`Dot style: ${label}`}
              aria-pressed={style.dotStyle === value}
              onClick={() => setStyle({ dotStyle: value })}
              className={cn(
                "flex h-14 items-center justify-center rounded-md border transition-colors hover:bg-accent",
                style.dotStyle === value
                  ? "ring-2 ring-primary border-primary"
                  : "border-border",
              )}
            >
              <DotStylePreview style={value} />
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* ---- Corner Square Style ---- */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Corner Square Style</h3>
        <div className="flex gap-2">
          {CORNER_SQUARE_STYLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={`Corner square style: ${label}`}
              aria-pressed={style.cornerSquareStyle === value}
              onClick={() => setStyle({ cornerSquareStyle: value })}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-md border transition-colors hover:bg-accent",
                style.cornerSquareStyle === value
                  ? "ring-2 ring-primary border-primary"
                  : "border-border",
              )}
            >
              <CornerSquarePreview style={value} />
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* ---- Corner Dot Style ---- */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Corner Dot Style</h3>
        <div className="flex gap-2">
          {CORNER_DOT_STYLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={`Corner dot style: ${label}`}
              aria-pressed={style.cornerDotStyle === value}
              onClick={() => setStyle({ cornerDotStyle: value })}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-md border transition-colors hover:bg-accent",
                style.cornerDotStyle === value
                  ? "ring-2 ring-primary border-primary"
                  : "border-border",
              )}
            >
              <CornerDotPreview style={value} />
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* ---- Colors ---- */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Colors</h3>
        <div className="space-y-3">
          <ColorPicker
            label="Foreground"
            value={style.fgColor}
            onChange={(color) => setStyle({ fgColor: color })}
          />
          {style.bgColor !== "transparent" && (
            <ColorPicker
              label="Background"
              value={style.bgColor}
              onChange={(color) => setStyle({ bgColor: color })}
            />
          )}
          <div className="flex items-center gap-3">
            <Label className="w-28 shrink-0 text-xs">Transparent</Label>
            <Switch
              aria-label="Transparent background"
              checked={style.bgColor === "transparent"}
              onCheckedChange={(checked) => {
                setStyle({ bgColor: checked ? "transparent" : "#FFFFFF" });
              }}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ---- Gradient ---- */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Gradient</h3>
          <Switch
            aria-label="Use a gradient fill"
            checked={gradientEnabled}
            onCheckedChange={toggleGradient}
          />
        </div>

        {gradientEnabled && style.gradient && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <Label className="w-28 shrink-0 text-xs">Type</Label>
              <Select
                value={style.gradient.type}
                onValueChange={(v) =>
                  updateGradient({ type: v as "linear" | "radial" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {style.gradient.type === "linear" && (
              <div className="flex items-center gap-3">
                <Label className="w-28 shrink-0 text-xs">
                  Rotation ({style.gradient.rotation ?? 0}&deg;)
                </Label>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[style.gradient.rotation ?? 0]}
                  onValueChange={([v]) => updateGradient({ rotation: v })}
                  className="flex-1"
                />
              </div>
            )}

            <ColorPicker
              label="Color Stop 1"
              value={style.gradient.colorStops[0]?.color ?? style.fgColor}
              onChange={(c) => updateGradientStop(0, c)}
            />
            <ColorPicker
              label="Color Stop 2"
              value={style.gradient.colorStops[1]?.color ?? "#7C5CFF"}
              onChange={(c) => updateGradientStop(1, c)}
            />
          </div>
        )}
      </section>

      <Separator />

      {/* ---- Error Correction ---- */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Error Correction</h3>
        <Select
          value={style.errorCorrection}
          onValueChange={(v) =>
            setStyle({ errorCorrection: v as ErrorCorrectionLevel })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EC_LEVELS.map(({ value, label, description }) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  {label}
                  <span className="text-muted-foreground text-xs">
                    {description}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
    </div>
  );
}
