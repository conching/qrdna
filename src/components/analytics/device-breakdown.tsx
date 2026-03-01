"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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

const DEVICE_COLORS: Record<string, string> = {
  mobile: "#7C5CFF",
  tablet: "#06D6A0",
  desktop: "#FFB627",
  other: "#FF6B6B",
};

function getDeviceColor(type: string): string {
  return DEVICE_COLORS[type.toLowerCase()] ?? DEVICE_COLORS.other;
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
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.map((item, idx) => {
            const Icon = getDeviceIcon(item.device_type);
            const color = getDeviceColor(item.device_type);
            const pct = total > 0 ? (item.scans / total) * 100 : 0;
            const barWidth = maxScans > 0 ? (item.scans / maxScans) * 100 : 0;
            const label =
              item.device_type.charAt(0).toUpperCase() +
              item.device_type.slice(1);

            return (
              <motion.div
                key={item.device_type}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group"
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor: `${color}14`,
                      color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Label and bar */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground/90 truncate">
                        {label}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          {formatNumber(item.scans)}
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{
                          duration: 0.7,
                          delay: idx * 0.08 + 0.2,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                      {/* Glow effect */}
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full blur-sm opacity-40"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{
                          duration: 0.7,
                          delay: idx * 0.08 + 0.2,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
