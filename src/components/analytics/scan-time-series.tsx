"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsEmptyState } from "./analytics-empty-state";

// ---------- types ----------

interface ScanTimeSeriesDataPoint {
  date: string;
  scans: number;
  unique?: number;
}

interface ScanTimeSeriesProps {
  data: ScanTimeSeriesDataPoint[];
  className?: string;
  title?: string;
}

// ---------- palette ----------

const COLORS = {
  scans: "#7C5CFF",
  unique: "#06D6A0",
  grid: "hsl(var(--border) / 0.12)",
  crosshair: "hsl(var(--border) / 0.4)",
} as const;

// ---------- date helper ----------

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------- custom tooltip ----------

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; color?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-[10px] font-medium text-muted-foreground">
        {formatDateLabel(label ?? "")}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">
            {entry.dataKey === "scans" ? "Total" : "Unique"}
          </span>
          <span className="ml-auto font-semibold tabular-nums text-foreground">
            {formatNumber(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- component ----------

export function ScanTimeSeries({
  data,
  className,
  title = "Scans over time",
}: ScanTimeSeriesProps) {
  const hasUnique = useMemo(
    () => data.some((d) => d.unique !== undefined && d.unique !== null),
    [data],
  );

  if (!data.length) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsEmptyState
            title="No scan data"
            description="Time series data will appear once scans are recorded."
          />
        </CardContent>
      </Card>
    );
  }

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
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.scans} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.scans} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillUnique" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.unique} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.unique} stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.grid}
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  dy={6}
                  interval="preserveStartEnd"
                />

                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                  }
                />

                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{
                    stroke: COLORS.crosshair,
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke={COLORS.scans}
                  strokeWidth={2}
                  fill="url(#fillScans)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: "hsl(var(--background))",
                    stroke: COLORS.scans,
                  }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />

                {hasUnique && (
                  <Area
                    type="monotone"
                    dataKey="unique"
                    stroke={COLORS.unique}
                    strokeWidth={2}
                    fill="url(#fillUnique)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: "hsl(var(--background))",
                      stroke: COLORS.unique,
                    }}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 px-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span
                className="inline-block h-1.5 w-4 rounded-full"
                style={{ backgroundColor: COLORS.scans }}
              />
              Total scans
            </div>
            {hasUnique && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span
                  className="inline-block h-1.5 w-4 rounded-full"
                  style={{ backgroundColor: COLORS.unique }}
                />
                Unique visitors
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
