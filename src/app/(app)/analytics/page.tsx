"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Stat card colors
// ---------------------------------------------------------------------------

const STAT_CONFIGS = [
  {
    key: "totalCodes" as const,
    label: "Total Codes",
    icon: QrCode,
    color: "#7C5CFF",
    gradient: "from-[#7C5CFF]/8 via-[#7C5CFF]/3 to-transparent",
    borderColor: "border-[#7C5CFF]/15",
    glowColor: "shadow-[#7C5CFF]/5",
  },
  {
    key: "activeCodes" as const,
    label: "Active Codes",
    icon: Activity,
    color: "#06D6A0",
    gradient: "from-[#06D6A0]/8 via-[#06D6A0]/3 to-transparent",
    borderColor: "border-[#06D6A0]/15",
    glowColor: "shadow-[#06D6A0]/5",
  },
  {
    key: "totalScans" as const,
    label: "Total Scans",
    icon: MousePointerClick,
    color: "#FFB627",
    gradient: "from-[#FFB627]/8 via-[#FFB627]/3 to-transparent",
    borderColor: "border-[#FFB627]/15",
    glowColor: "shadow-[#FFB627]/5",
  },
  {
    key: "uniqueScans" as const,
    label: "Unique Scans",
    icon: Users,
    color: "#FF6B6B",
    gradient: "from-[#FF6B6B]/8 via-[#FF6B6B]/3 to-transparent",
    borderColor: "border-[#FF6B6B]/15",
    glowColor: "shadow-[#FF6B6B]/5",
  },
] as const;

// ---------------------------------------------------------------------------
// Content-type to badge color map
// ---------------------------------------------------------------------------

function contentTypeBadgeColor(type: string): string {
  const map: Record<string, string> = {
    url: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    text: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
    email: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    phone: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    wifi: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    vcard: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    sms: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    geo: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    event: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    app_store: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  };
  return map[type] ?? "bg-muted text-muted-foreground";
}

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

        {/* Stat card skeletons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="gap-0 py-5">
              <CardContent className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#06D6A0] shadow-lg shadow-[#7C5CFF]/20">
          <BarChart3 className="size-4 text-white" />
        </div>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight">
            Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Mission control for all your QR codes
          </p>
        </div>
      </motion.div>

      {/* ---- Stat cards ---- */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STAT_CONFIGS.map((stat) => {
          const Icon = stat.icon;
          const value = data[stat.key];

          return (
            <motion.div
              key={stat.key}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card
                className={`relative gap-0 overflow-hidden border py-5 ${stat.borderColor} shadow-md ${stat.glowColor}`}
              >
                {/* Subtle gradient background */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.gradient}`}
                />

                <CardContent className="relative flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${stat.color}14`,
                      boxShadow: `0 0 12px ${stat.color}18`,
                    }}
                  >
                    <Icon className="size-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                    <AnimatedCounter
                      value={value}
                      className="text-2xl"
                      duration={1200}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ---- Time series chart ---- */}
      <motion.div variants={itemVariants}>
        <ScanTimeSeries
          data={data.scansByDay}
          title="Scan activity (last 30 days)"
        />
      </motion.div>

      {/* ---- Bottom grid: Top Codes + Recent Scans ---- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top QR Codes */}
        <motion.div variants={itemVariants}>
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <QrCode className="size-4 text-[#7C5CFF]" />
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
                      <motion.div
                        key={code.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: idx * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          href={`/qr/${code.id}`}
                          className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          {/* Rank */}
                          <span className="w-5 shrink-0 text-right text-[10px] tabular-nums font-bold text-muted-foreground/50">
                            {idx + 1}
                          </span>

                          {/* Name + badge + bar */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs font-medium text-foreground group-hover:text-[#7C5CFF] transition-colors">
                                {code.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`shrink-0 text-[9px] px-1.5 py-0 capitalize ${contentTypeBadgeColor(code.content_type)}`}
                              >
                                {code.content_type.replace("_", " ")}
                              </Badge>
                            </div>

                            {/* Progress bar */}
                            <div className="relative mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted/40">
                              <motion.div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  background:
                                    "linear-gradient(90deg, #7C5CFF, #06D6A0)",
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidth}%` }}
                                transition={{
                                  duration: 0.7,
                                  delay: idx * 0.06 + 0.2,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>
                          </div>

                          {/* Scan count */}
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                            {code.total_scans.toLocaleString()}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Scans */}
        <motion.div variants={itemVariants}>
          <Card className="h-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-[#06D6A0]" />
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
                  {data.recentScans.map((scan, idx) => {
                    const DeviceIcon = getDeviceIcon(scan.device_type);
                    const locationParts = [scan.city, scan.country].filter(
                      Boolean,
                    );
                    const location =
                      locationParts.length > 0
                        ? locationParts.join(", ")
                        : null;

                    return (
                      <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: idx * 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          href={`/qr/${scan.qr_code_id}`}
                          className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          {/* Device icon */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                            <DeviceIcon className="size-3.5 text-muted-foreground" />
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-foreground group-hover:text-[#06D6A0] transition-colors">
                              {scan.qr_name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              {location && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <Globe className="size-2.5" />
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
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
