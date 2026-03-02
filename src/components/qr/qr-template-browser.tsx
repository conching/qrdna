"use client";

import { useMemo } from "react";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { templates, type QRTemplate } from "@/lib/qr/templates";
import type { DotStyle, QRStyleConfig } from "@/lib/qr/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function dotBorderRadius(dotStyle: DotStyle): string {
  switch (dotStyle) {
    case "square":
    case "classy":
      return "0";
    case "rounded":
    case "classy-rounded":
      return "2px";
    case "dots":
      return "50%";
    case "extra-rounded":
      return "3px";
  }
}

const SWATCH_PATTERN = [
  [1, 1, 1, 0, 1, 0],
  [1, 0, 1, 0, 0, 1],
  [1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 1],
  [1, 0, 1, 1, 0, 1],
  [0, 1, 0, 1, 1, 0],
] as const;

function TemplateSwatch({ template }: { template: QRTemplate }) {
  const { fgColor, bgColor, dotStyle } = template.style;
  const radius = dotBorderRadius(dotStyle);

  return (
    <div
      className="size-[60px] shrink-0 rounded-md border p-1"
      style={{ backgroundColor: bgColor }}
    >
      <div className="grid h-full w-full grid-cols-6 grid-rows-6 gap-[2px]">
        {SWATCH_PATTERN.flat().map((filled, i) => (
          <div
            key={i}
            style={{
              backgroundColor: filled ? fgColor : "transparent",
              borderRadius: filled ? radius : "0",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function isActiveTemplate(
  template: QRTemplate,
  currentStyle: QRStyleConfig,
): boolean {
  const t = template.style;
  return (
    t.dotStyle === currentStyle.dotStyle &&
    t.cornerSquareStyle === currentStyle.cornerSquareStyle &&
    t.cornerDotStyle === currentStyle.cornerDotStyle &&
    t.fgColor.toLowerCase() === currentStyle.fgColor.toLowerCase() &&
    t.bgColor.toLowerCase() === currentStyle.bgColor.toLowerCase() &&
    t.errorCorrection === currentStyle.errorCorrection &&
    // Compare gradients
    (t.gradient == null) === (currentStyle.gradient == null) &&
    (t.gradient == null || (
      t.gradient?.type === currentStyle.gradient?.type &&
      t.gradient?.rotation === currentStyle.gradient?.rotation &&
      t.gradient?.colorStops[0]?.color === currentStyle.gradient?.colorStops[0]?.color &&
      t.gradient?.colorStops[1]?.color === currentStyle.gradient?.colorStops[1]?.color
    ))
  );
}

export function QRTemplateBrowser() {
  const { style, applyTemplate } = useQREditorStore();

  const activeId = useMemo(() => {
    const match = templates.find((t) => isActiveTemplate(t, style));
    return match?.id ?? null;
  }, [style]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => applyTemplate(template.style)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent",
            activeId === template.id
              ? "ring-2 ring-primary border-primary"
              : "border-border",
          )}
        >
          <TemplateSwatch template={template} />
          <span className="text-xs font-medium">{template.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {template.category}
          </Badge>
        </button>
      ))}
    </div>
  );
}
