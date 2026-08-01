"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsEmptyState } from "./analytics-empty-state";

// ---------- types ----------

interface DeviceDataPoint {
  device_type: string;
  scans: number;
}

interface DeviceBreakdownProps {
  data: DeviceDataPoint[];
  className?: string;
  title?: string;
}

// ---------- palette ----------
//
// One chart-series token per device class, used as a bar fill and a chip tint.
// The label, the percentage and the count are all present as text, so the
// colour is a second channel rather than the only one.

const DEVICE_COLORS: Record<string, string> = {
  mobile: "var(--chart-1)",
  tablet: "var(--chart-2)",
  desktop: "var(--chart-3)",
  other: "var(--chart-5)",
};

function getDeviceColor(type: string): string {
  return DEVICE_COLORS[type.toLowerCase()] ?? DEVICE_COLORS.other;
}

/** A faint wash of a series colour, for the icon chip behind each device. */
function tint(color: string, percent: number): string {
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`;
}

// ---------- custom SVG icons (not lucide) ----------

function MobileIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="2"
        width="10"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="8"
        y1="15"
        x2="12"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="3"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 17h6M10 14v3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnknownDeviceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8.5 8a1.5 1.5 0 0 1 3 0c0 .83-.67 1.17-1.5 1.5M10 12.5v.01"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const DEVICE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  mobile: MobileIcon,
  tablet: TabletIcon,
  desktop: DesktopIcon,
};

function getDeviceIcon(type: string): React.FC<{ className?: string }> {
  return DEVICE_ICONS[type.toLowerCase()] ?? UnknownDeviceIcon;
}

// ---------- component ----------

export function DeviceBreakdown({
  data,
  className,
  title = "Devices",
}: DeviceBreakdownProps) {
  const { sorted, total } = useMemo(() => {
    const t = data.reduce((sum, d) => sum + d.scans, 0);
    const s = [...data].sort((a, b) => b.scans - a.scans);
    return { sorted: s, total: t };
  }, [data]);

  if (!data.length) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsEmptyState
            title="No device data"
            description="Device breakdown will appear once scans are recorded."
          />
        </CardContent>
      </Card>
    );
  }

  const maxScans = sorted[0]?.scans ?? 1;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((item) => {
          const Icon = getDeviceIcon(item.device_type);
          const color = getDeviceColor(item.device_type);
          const pct = total > 0 ? (item.scans / total) * 100 : 0;
          const barWidth = maxScans > 0 ? (item.scans / maxScans) * 100 : 0;
          const label =
            item.device_type.charAt(0).toUpperCase() +
            item.device_type.slice(1);

          return (
            <div key={item.device_type} className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: tint(color, 12), color }}
              >
                <Icon className="size-4" />
              </div>

              {/* Label and bar */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-xs font-medium text-foreground">
                    {label}
                  </span>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-foreground">
                      {formatNumber(item.scans)}
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: color, width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
