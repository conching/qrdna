"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsEmptyState } from "./analytics-empty-state";

// ---------- types ----------

interface CountryDataPoint {
  country: string;
  scans: number;
}

interface CityDataPoint {
  city: string;
  country: string;
  scans: number;
}

interface GeoBreakdownProps {
  countries: CountryDataPoint[];
  cities: CityDataPoint[];
  className?: string;
  title?: string;
  maxRows?: number;
}

// ---------- palette ----------

const BAR_GRADIENT = "linear-gradient(90deg, #7C5CFF, #06D6A0)";

// ---------- row component ----------

function GeoRow({
  rank,
  label,
  sublabel,
  scans,
  maxScans,
  index,
}: {
  rank: number;
  label: string;
  sublabel?: string;
  scans: number;
  maxScans: number;
  index: number;
}) {
  const barWidth = maxScans > 0 ? (scans / maxScans) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex items-center gap-3 py-1.5"
    >
      {/* Rank */}
      <span className="w-5 shrink-0 text-right text-[10px] tabular-nums font-medium text-muted-foreground/60">
        {rank}
      </span>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium text-foreground/90 truncate">
            {label}
          </span>
          {sublabel && (
            <span className="text-[10px] text-muted-foreground/60 truncate">
              {sublabel}
            </span>
          )}
        </div>

        {/* Bar */}
        <div className="relative mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/40">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: BAR_GRADIENT }}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{
              duration: 0.6,
              delay: index * 0.04 + 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>
      </div>

      {/* Count */}
      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
        {formatNumber(scans)}
      </span>
    </motion.div>
  );
}

// ---------- component ----------

export function GeoBreakdown({
  countries,
  cities,
  className,
  title = "Geography",
  maxRows = 10,
}: GeoBreakdownProps) {
  const [tab, setTab] = useState<"countries" | "cities">("countries");

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => b.scans - a.scans).slice(0, maxRows),
    [countries, maxRows],
  );

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => b.scans - a.scans).slice(0, maxRows),
    [cities, maxRows],
  );

  const isEmpty = countries.length === 0 && cities.length === 0;

  if (isEmpty) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsEmptyState
            title="No geographic data"
            description="Location data will appear once scans are recorded."
          />
        </CardContent>
      </Card>
    );
  }

  const activeData = tab === "countries" ? sortedCountries : sortedCities;
  const maxScans = activeData[0]?.scans ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "countries" | "cities")}
            className="w-auto"
          >
            <TabsList className="h-7">
              <TabsTrigger value="countries" className="text-[11px] px-2 py-0.5">
                Countries
              </TabsTrigger>
              <TabsTrigger value="cities" className="text-[11px] px-2 py-0.5">
                Cities
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "countries"
                ? sortedCountries.map((item, idx) => (
                    <GeoRow
                      key={item.country}
                      rank={idx + 1}
                      label={item.country}
                      scans={item.scans}
                      maxScans={maxScans}
                      index={idx}
                    />
                  ))
                : sortedCities.map((item, idx) => (
                    <GeoRow
                      key={`${item.city}-${item.country}`}
                      rank={idx + 1}
                      label={item.city}
                      sublabel={item.country}
                      scans={item.scans}
                      maxScans={maxScans}
                      index={idx}
                    />
                  ))}

              {activeData.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No {tab} data available
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
