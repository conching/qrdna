"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsEmptyState } from "./analytics-empty-state";

// ---------- types ----------

interface ReferrerDataPoint {
  referrer: string;
  scans: number;
}

interface ReferrerListProps {
  data: ReferrerDataPoint[];
  className?: string;
  title?: string;
  maxRows?: number;
}

// ---------- helpers ----------

/**
 * Extract a clean domain name from a full URL or referrer string.
 * Falls back to the original string if parsing fails.
 */
function extractDomain(referrer: string): string {
  if (!referrer || referrer === "direct" || referrer === "(direct)") {
    return "Direct / None";
  }

  try {
    // Add protocol if missing so URL constructor works
    const urlStr = referrer.startsWith("http")
      ? referrer
      : `https://${referrer}`;
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, "");
  } catch {
    // If URL parsing fails, try simple extraction
    const cleaned = referrer.replace(/^https?:\/\/(www\.)?/, "");
    // Truncate at first slash
    const slashIdx = cleaned.indexOf("/");
    return slashIdx > 0 ? cleaned.slice(0, slashIdx) : cleaned;
  }
}

// ---------- component ----------

export function ReferrerList({
  data,
  className,
  title = "Top referrers",
  maxRows = 10,
}: ReferrerListProps) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.scans - a.scans).slice(0, maxRows),
    [data, maxRows],
  );

  if (!data.length) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsEmptyState
            title="No referrer data"
            description="Referrer information will appear once scans are recorded."
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
      <CardContent className="space-y-1">
        {sorted.map((item, idx) => {
          const domain = extractDomain(item.referrer);
          const barWidth = maxScans > 0 ? (item.scans / maxScans) * 100 : 0;

          return (
            <div
              key={item.referrer}
              className="flex items-center gap-3 py-1.5"
            >
              {/* Rank */}
              <span className="w-5 shrink-0 text-right text-[10px] font-medium tabular-nums text-muted-foreground">
                {idx + 1}
              </span>

              {/* Domain + bar */}
              <div className="min-w-0 flex-1">
                <span
                  className="block max-w-[200px] truncate text-xs font-medium text-foreground"
                  title={item.referrer}
                >
                  {domain}
                </span>

                <div className="relative mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-chart-1"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Count */}
              <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                {formatNumber(item.scans)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
