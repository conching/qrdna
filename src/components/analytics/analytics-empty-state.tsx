"use client";

import { cn } from "@/lib/utils";

interface AnalyticsEmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Empty state with a DNA double helix mark. Shown when there are no scan
 * events yet.
 *
 * The helix used to float, glow and pulse on a loop. It was removed: an empty
 * state has no change to report, so the motion was pure decoration, and the
 * keyframes shipped as an inline <style> block that was duplicated for every
 * instance on the page (this component renders inside several cards at once).
 */
export function AnalyticsEmptyState({
  className,
  title = "No scan data yet",
  description = "Scans will appear here once your QR codes are scanned",
}: AnalyticsEmptyStateProps) {
  // DNA helix parameters
  const width = 120;
  const height = 160;
  const cx = width / 2;
  const amplitude = 28;
  const rungCount = 8;

  // Build two sinusoidal strands and connecting rungs
  const strand1Points: string[] = [];
  const strand2Points: string[] = [];
  const rungs: { x1: number; y1: number; x2: number; y2: number }[] = [];

  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * height;
    const phase = t * Math.PI * 2.5;
    const x1 = cx + Math.sin(phase) * amplitude;
    const x2 = cx + Math.sin(phase + Math.PI) * amplitude;
    strand1Points.push(`${x1},${y}`);
    strand2Points.push(`${x2},${y}`);
  }

  for (let i = 1; i <= rungCount; i++) {
    const t = i / (rungCount + 1);
    const y = t * height;
    const phase = t * Math.PI * 2.5;
    const x1 = cx + Math.sin(phase) * amplitude;
    const x2 = cx + Math.sin(phase + Math.PI) * amplitude;
    rungs.push({ x1, y1: y, x2, y2: y });
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        className,
      )}
    >
      <div className="mb-6">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Connecting rungs */}
          {rungs.map((rung, i) => (
            <line
              key={`rung-${i}`}
              x1={rung.x1}
              y1={rung.y1}
              x2={rung.x2}
              y2={rung.y2}
              stroke="var(--chart-1)"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.35}
            />
          ))}

          {/* Strand 1 - brand purple */}
          <polyline
            points={strand1Points.join(" ")}
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />

          {/* Strand 2 - bioluminescent teal */}
          <polyline
            points={strand2Points.join(" ")}
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />

          {/* Terminal dots */}
          <circle cx={strand1Points[0].split(",").map(Number)[0]} cy={0} r={3} fill="var(--chart-1)" opacity={0.6} />
          <circle cx={strand2Points[0].split(",").map(Number)[0]} cy={0} r={3} fill="var(--chart-2)" opacity={0.6} />
          <circle
            cx={Number(strand1Points[strand1Points.length - 1].split(",")[0])}
            cy={height}
            r={3}
            fill="var(--chart-1)"
            opacity={0.6}
          />
          <circle
            cx={Number(strand2Points[strand2Points.length - 1].split(",")[0])}
            cy={height}
            r={3}
            fill="var(--chart-2)"
            opacity={0.6}
          />
        </svg>
      </div>

      <p className="text-sm font-medium text-foreground/80">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground text-center max-w-[260px]">
        {description}
      </p>
    </div>
  );
}
