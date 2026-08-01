"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Clock,
  Globe,
  MousePointerClick,
  QrCode,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { UpgradeModal } from "@/components/billing/upgrade-modal";

import { formatRelativeDate } from "@/lib/utils/format";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { AnimatedCounter } from "@/components/analytics/animated-counter";
import { ScanTimeSeries } from "@/components/analytics/scan-time-series";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { StatTile } from "@/components/analytics/stat-tile";

// ---------------------------------------------------------------------------
// Types matching GET /api/v1/analytics response
// ---------------------------------------------------------------------------

interface TopCode {
  id: string;
  name: string;
  total_scans: number;
  content_type: string;
}

interface RecentScan {
  id: number;
  scanned_at: string;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  qr_code_id: string;
  qr_name: string;
}

interface AccountAnalyticsData {
  totalCodes: number;
  activeCodes: number;
  totalScans: number;
  uniqueScans: number;
  topCodes: TopCode[];
  recentScans: RecentScan[];
  scansByDay: { date: string; scans: number }[];
}

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------

const STAT_CONFIGS = [
  { key: "totalCodes" as const, label: "Total Codes", icon: QrCode },
  { key: "activeCodes" as const, label: "Active Codes", icon: Activity },
  { key: "totalScans" as const, label: "Total Scans", icon: MousePointerClick },
  { key: "uniqueScans" as const, label: "Unique Scans", icon: Users },
] as const;

// ---------------------------------------------------------------------------
// Device icon helper
// ---------------------------------------------------------------------------

function getDeviceIcon(type: string | null) {
  if (!type) return Globe;
  const lower = type.toLowerCase();
  if (lower === "mobile" || lower === "tablet") return Smartphone;
  if (lower === "desktop") return BarChart3;
  return Globe;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const { user } = useUser();
  const [data, setData] = useState<AccountAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/v1/analytics");
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json.error?.message ?? "Failed to fetch analytics");
        }

        setData(json.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load analytics",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  // ------ Pro gate ------
  if (user && !user.isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Sparkles className="mb-4 h-12 w-12 text-primary/40" />
        <p className="font-semibold text-lg">Analytics is a Pro feature</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Unlock scan tracking, device breakdowns, and geographic insights.
        </p>
        <Button
          className="mt-6 gap-2"
          onClick={() => setUpgradeOpen(true)}
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to Pro
        </Button>
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          featureName="Analytics"
        />
      </div>
    );
  }

  // ------ Loading state ------
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Stat card skeletons — must match StatTile's box so the swap doesn't jump */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="gap-0 py-4">
              <CardContent className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart skeleton */}
        <Skeleton className="h-[320px] w-full rounded-xl" />

        {/* Bottom grid skeletons */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ------ Error state ------
  if (error) {
    return (
      <div className="p-6">
        <h1 className="mb-6 font-sans text-2xl font-bold">Analytics</h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  // ------ Empty state (no codes at all) ------
  if (!data || data.totalCodes === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-6 font-sans text-2xl font-bold">Analytics</h1>
        <AnalyticsEmptyState
          title="No QR codes yet"
          description="Create your first QR code to start tracking scans and analytics."
        />
      </div>
    );
  }

  // ------ Main dashboard ------
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-sans text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Across every QR code in your account.
        </p>
      </div>

      {/* ---- Stat cards ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIGS.map((stat) => (
          <StatTile
            key={stat.key}
            icon={stat.icon}
            label={stat.label}
            value={<AnimatedCounter value={data[stat.key]} />}
          />
        ))}
      </div>

      {/* ---- Time series chart ---- */}
      <ScanTimeSeries
        data={data.scansByDay}
        title="Scan activity (last 30 days)"
      />

      {/* ---- Bottom grid: Top Codes + Recent Scans ---- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top QR Codes */}
        <div>
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <QrCode className="size-4 text-muted-foreground" aria-hidden="true" />
                Top QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCodes.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No scan data yet
                </p>
              ) : (
                <div className="space-y-1">
                  {data.topCodes.map((code, idx) => {
                    const maxScans = data.topCodes[0]?.total_scans ?? 1;
                    const barWidth =
                      maxScans > 0
                        ? (code.total_scans / maxScans) * 100
                        : 0;

                    return (
                      <Link
                        key={code.id}
                        href={`/qr/${code.id}`}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        {/* Rank */}
                        <span className="w-5 shrink-0 text-right text-[10px] tabular-nums font-medium text-muted-foreground">
                          {idx + 1}
                        </span>

                        {/* Name + badge + bar */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-medium text-foreground transition-colors group-hover:text-primary">
                              {code.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="shrink-0 px-1.5 py-0 text-[9px] capitalize"
                            >
                              {code.content_type.replace("_", " ")}
                            </Badge>
                          </div>

                          {/* Share-of-top bar */}
                          <div className="relative mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-chart-1"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>

                        {/* Scan count */}
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                          {code.total_scans.toLocaleString()}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <div>
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentScans.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No scans recorded yet
                </p>
              ) : (
                <div className="space-y-1">
                  {data.recentScans.map((scan) => {
                    const DeviceIcon = getDeviceIcon(scan.device_type);
                    const locationParts = [scan.city, scan.country].filter(
                      Boolean,
                    );
                    const location =
                      locationParts.length > 0
                        ? locationParts.join(", ")
                        : null;

                    return (
                      <Link
                        key={scan.id}
                        href={`/qr/${scan.qr_code_id}`}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        {/* Device icon */}
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <DeviceIcon
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground transition-colors group-hover:text-primary">
                            {scan.qr_name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {location && (
                              <span className="flex items-center gap-0.5 truncate">
                                <Globe className="size-2.5" aria-hidden="true" />
                                {location}
                              </span>
                            )}
                            {scan.device_type && (
                              <span className="capitalize">
                                {scan.device_type}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time ago */}
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {formatRelativeDate(scan.scanned_at)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
