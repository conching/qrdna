"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsEmptyState } from "./analytics-empty-state";

// ---------- types ----------

interface BrowserDataPoint {
  browser: string;
  scans: number;
}

interface OsDataPoint {
  os: string;
  scans: number;
}

interface BrowserOsChartProps {
  browsers: BrowserDataPoint[];
  os: OsDataPoint[];
  className?: string;
  title?: string;
}

// ---------- palette ----------

const PALETTE = [
  "#7C5CFF",
  "#06D6A0",
  "#FFB627",
  "#FF6B6B",
  "#66A3FF",
  "#C77DFF",
  "#4ECDC4",
  "#FF8A65",
] as const;

function getColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

// ---------- custom tooltip ----------

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { fill?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: entry.payload?.fill }}
        />
        <span className="text-muted-foreground">{entry.name}</span>
        <span className="ml-auto font-semibold tabular-nums text-foreground">
          {formatNumber(entry.value as number)}
        </span>
      </div>
    </div>
  );
}

// ---------- donut sub-component ----------

interface DonutProps {
  data: { name: string; value: number }[];
  label: string;
}

function Donut({ data, label }: DonutProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data],
  );

  if (!data.length) {
    return (
      <div className="flex flex-col items-center">
        <p className="mb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xs text-muted-foreground/60">No data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="relative h-[160px] w-[160px]">
        {/* Center label overlay (absolutely positioned over the donut hole) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums text-foreground">
            {formatNumber(total)}
          </span>
          <span className="text-[9px] text-muted-foreground">total</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              animationDuration={900}
              animationEasing="ease-out"
              label={false}
            >
              {data.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={getColor(i)}
                  style={{
                    filter: `drop-shadow(0 0 3px ${getColor(i)}44)`,
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-[200px]">
        {data.map((entry, i) => (
          <div
            key={entry.name}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getColor(i) }}
            />
            <span className="truncate max-w-[80px]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- main component ----------

export function BrowserOsChart({
  browsers,
  os,
  className,
  title = "Browsers & OS",
}: BrowserOsChartProps) {
  const browserData = useMemo(
    () =>
      [...browsers]
        .sort((a, b) => b.scans - a.scans)
        .map((b) => ({ name: b.browser, value: b.scans })),
    [browsers],
  );

  const osData = useMemo(
    () =>
      [...os]
        .sort((a, b) => b.scans - a.scans)
        .map((o) => ({ name: o.os, value: o.scans })),
    [os],
  );

  const isEmpty = browsers.length === 0 && os.length === 0;

  if (isEmpty) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsEmptyState
            title="No browser or OS data"
            description="Browser and OS breakdown will appear once scans are recorded."
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Donut data={browserData} label="Browsers" />
            <Donut data={osData} label="Operating Systems" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
