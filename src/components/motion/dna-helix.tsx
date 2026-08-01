"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DNAHelixProps {
  /** Size in pixels. Default: 40 */
  size?: number;
  className?: string;
}

const RUNGS = 6;
const STRAND_COLORS = ["var(--chart-1)", "var(--chart-2)"];
const RUNG_COLOR = "color-mix(in oklab, var(--chart-1) 25%, transparent)";

/**
 * Animated double helix SVG. Can replace a loading spinner.
 * Two sinusoidal strands offset 180 degrees with connecting rungs,
 * animated with a continuous vertical scroll/rotation.
 */
export function DNAHelix({ size = 40, className }: DNAHelixProps) {
  const viewBoxHeight = 80;
  const viewBoxWidth = 40;
  const cx = viewBoxWidth / 2;
  const amplitude = 12;
  const verticalSpacing = viewBoxHeight / RUNGS;

  // Build strand paths and rungs for one "period" of the helix
  function buildStrandPoints(phaseOffset: number) {
    const points: { x: number; y: number }[] = [];
    const steps = RUNGS * 4; // smooth curve
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = t * viewBoxHeight;
      const x = cx + Math.sin(t * Math.PI * 2 + phaseOffset) * amplitude;
      points.push({ x, y });
    }
    return points;
  }

  function pointsToPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return "";
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
    }
    return d;
  }

  const strand1 = buildStrandPoints(0);
  const strand2 = buildStrandPoints(Math.PI);
  const path1 = pointsToPath(strand1);
  const path2 = pointsToPath(strand2);

  // Rungs connect the two strands at regular intervals
  const rungs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < RUNGS; i++) {
    const y = (i + 0.5) * verticalSpacing;
    const x1 = cx + Math.sin(((i + 0.5) / RUNGS) * Math.PI * 2) * amplitude;
    const x2 =
      cx + Math.sin(((i + 0.5) / RUNGS) * Math.PI * 2 + Math.PI) * amplitude;
    rungs.push({ x1, y1: y, x2, y2: y });
  }

  return (
    <motion.div
      className={cn("inline-flex items-center justify-center overflow-hidden", className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    >
      <motion.svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width={size}
        height={size}
        animate={{ y: [0, -viewBoxHeight / 2] }}
        transition={{
          y: {
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {/* Repeat the pattern twice so scrolling loops seamlessly */}
        {[0, viewBoxHeight].map((offsetY) => (
          <g key={offsetY} transform={`translate(0, ${offsetY})`}>
            {/* Rungs */}
            {rungs.map((rung, i) => (
              <line
                key={`rung-${offsetY}-${i}`}
                x1={rung.x1}
                y1={rung.y1}
                x2={rung.x2}
                y2={rung.y2}
                stroke={RUNG_COLOR}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            ))}

            {/* Strand 1 */}
            <path
              d={path1}
              fill="none"
              stroke={STRAND_COLORS[0]}
              strokeWidth={2}
              strokeLinecap="round"
            />

            {/* Strand 2 */}
            <path
              d={path2}
              fill="none"
              stroke={STRAND_COLORS[1]}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        ))}
      </motion.svg>
    </motion.div>
  );
}
