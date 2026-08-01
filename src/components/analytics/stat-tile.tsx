import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  /** Rendered inside the value slot — a number, an <AnimatedCounter />, or a date string. */
  value: React.ReactNode;
  className?: string;
}

/**
 * The single stat card used by the dashboard, the account analytics page and
 * the per-code detail view. One treatment, so the same number reads the same
 * way wherever it appears.
 *
 * Deliberately uncoloured: these are four unrelated counts, not a chart series,
 * so a per-metric accent colour would be decoration with nothing to decode. The
 * `--chart-*` tokens stay where they carry meaning — bars, areas, donut cells
 * and their legend swatches.
 */
export function StatTile({ icon: Icon, label, value, className }: StatTileProps) {
  return (
    <Card className={cn("gap-0 py-4", className)}>
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="text-lg font-semibold leading-tight tabular-nums">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
