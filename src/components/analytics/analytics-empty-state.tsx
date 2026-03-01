"use client";

import { cn } from "@/lib/utils";

interface AnalyticsEmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Empty state with an animated DNA double helix that gently pulses.
 * Shown when there are no scan events yet.
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
  const verticalSpacing = height / (rungCount + 1);

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
      {/* CSS keyframes for the helix animation */}
      <style>{`
        @keyframes helix-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes helix-rung-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.7; }
        }
        @keyframes helix-glow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(124, 92, 255, 0.3)); }
          50% { filter: drop-shadow(0 0 8px rgba(124, 92, 255, 0.5)); }
        }
        .helix-container {
          animation: helix-float 3s ease-in-out infinite, helix-glow 3s ease-in-out infinite;
        }
        .helix-rung {
          animation: helix-rung-pulse 2.4s ease-in-out infinite;
        }
      `}</style>

      <div className="helix-container mb-6">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Glow backdrop */}
          <defs>
            <radialGradient id="helix-bg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx={cx}
            cy={height / 2}
            rx={amplitude + 20}
            ry={height / 2 + 10}
            fill="url(#helix-bg-glow)"
          />

          {/* Connecting rungs */}
          {rungs.map((rung, i) => (
            <line
              key={`rung-${i}`}
              x1={rung.x1}
              y1={rung.y1}
              x2={rung.x2}
              y2={rung.y2}
              stroke="#7C5CFF"
              strokeWidth={2}
              strokeLinecap="round"
              className="helix-rung"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}

          {/* Strand 1 - brand purple */}
          <polyline
            points={strand1Points.join(" ")}
            stroke="#7C5CFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />

          {/* Strand 2 - bioluminescent teal */}
          <polyline
            points={strand2Points.join(" ")}
            stroke="#06D6A0"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />

          {/* Terminal dots */}
          <circle cx={strand1Points[0].split(",").map(Number)[0]} cy={0} r={3} fill="#7C5CFF" opacity={0.6} />
          <circle cx={strand2Points[0].split(",").map(Number)[0]} cy={0} r={3} fill="#06D6A0" opacity={0.6} />
          <circle
            cx={Number(strand1Points[strand1Points.length - 1].split(",")[0])}
            cy={height}
            r={3}
            fill="#7C5CFF"
            opacity={0.6}
          />
          <circle
            cx={Number(strand2Points[strand2Points.length - 1].split(",")[0])}
            cy={height}
            r={3}
            fill="#06D6A0"
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
