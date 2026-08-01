import { cn } from "@/lib/utils";

interface DNAHelixProps {
  width?: number;
  height?: number;
  /** Vertical distance covered by one full turn, in user units. */
  wavelength?: number;
  /** Seconds per rotation. */
  duration?: number;
  /** Render the strands without motion. */
  still?: boolean;
  className?: string;
}

/**
 * A double helix that rotates about its vertical axis.
 *
 * ## Why translation reads as rotation
 *
 * A point on the strand sits at `x = cx + A·sin(θ)`, `z = A·cos(θ)`, with
 * `θ = 2πy/λ`. Rotating the helix adds a constant to θ, which is the same thing
 * as sliding the whole waveform along y. So a seamless vertical translation of
 * exactly one wavelength *is* one full turn — the barber-pole illusion, except
 * here it is not an illusion, it is the correct projection.
 *
 * That is worth doing properly rather than applying `rotateY` to a flat SVG,
 * which would squash the drawing instead of turning the object.
 *
 * ## Depth
 *
 * Sine waves alone look flat. What sells the form is occlusion: each strand is
 * nearer the viewer where `cos(θ) > 0`, and the two alternate. The strands are
 * therefore split at every quarter-turn and drawn back-to-front, so the strand
 * behind genuinely passes under the rungs and the strand in front.
 *
 * Rung length needs no special handling — it is the distance between the two
 * strand positions, `2A·|sin θ|`, which collapses to nothing exactly where the
 * strands cross. The foreshortening falls out of the geometry.
 *
 * ## Cost
 *
 * The keyframes live in globals.css, not in an inline <style>: this renders in
 * seven places and more than one can be on screen at once. The animation is a
 * single compositor-friendly transform on one <g>, and
 * `prefers-reduced-motion` is honoured by the global rule in globals.css, which
 * freezes it on a frame identical to the first.
 */
export function DNAHelix({
  width = 120,
  height = 160,
  wavelength = 64,
  duration = 9,
  still = false,
  className,
}: DNAHelixProps) {
  const cx = width / 2;
  const amplitude = width * 0.23;
  const k = (2 * Math.PI) / wavelength;

  // One extra wavelength above and below, so the loop never exposes an end.
  const yStart = -wavelength;
  const yEnd = height + wavelength;
  const step = 2;

  type Pt = { x: number; y: number };

  /** Split a strand into runs of consistent depth, nearest-last. */
  function arcs(phaseOffset: number): { front: boolean; pts: Pt[] }[] {
    const out: { front: boolean; pts: Pt[] }[] = [];
    let run: Pt[] = [];
    let runFront: boolean | null = null;

    for (let y = yStart; y <= yEnd; y += step) {
      const theta = k * y + phaseOffset;
      const pt = { x: cx + Math.sin(theta) * amplitude, y };
      const front = Math.cos(theta) > 0;

      if (runFront === null) runFront = front;

      if (front !== runFront) {
        // Carry the boundary point into both runs so the arcs meet.
        run.push(pt);
        out.push({ front: runFront, pts: run });
        run = [pt];
        runFront = front;
      } else {
        run.push(pt);
      }
    }
    if (run.length > 1 && runFront !== null) {
      out.push({ front: runFront, pts: run });
    }
    return out;
  }

  const d = (pts: Pt[]) =>
    pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");

  const strands = [
    { arcs: arcs(0), color: "var(--chart-1)" },
    { arcs: arcs(Math.PI), color: "var(--chart-2)" },
  ];

  // Five per turn, which leaves four once the one that lands on a crossing is
  // dropped, at two different widths. Eight per turn read as a fence rather
  // than a ladder — dense enough that the bulges filled in as solid blocks.
  const rungs: { x1: number; x2: number; y: number; depth: number }[] = [];
  for (let y = yStart; y <= yEnd; y += wavelength / 5) {
    const theta = k * y;
    const dx = Math.sin(theta) * amplitude;
    // Near a crossing the rung is edge-on; drawing it leaves a stray dot.
    if (Math.abs(dx) < amplitude * 0.15) continue;
    rungs.push({ x1: cx + dx, x2: cx - dx, y, depth: Math.abs(Math.sin(theta)) });
  }

  const layer = (front: boolean) =>
    strands.map((s, si) =>
      s.arcs
        .filter((a) => a.front === front)
        .map((a, ai) => (
          <path
            key={`${front ? "f" : "b"}-${si}-${ai}`}
            d={d(a.pts)}
            fill="none"
            stroke={s.color}
            strokeWidth={front ? 3 : 1.75}
            strokeLinecap="round"
            // The gap between these two is what makes the near strand read as
            // near; at 0.4 the back strand competed with the front.
            opacity={front ? 0.95 : 0.26}
          />
        )),
    );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <clipPath id="dna-clip">
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </defs>

      <g clipPath="url(#dna-clip)">
        <g
          className={cn(!still && "animate-dna-twirl")}
          style={
            still
              ? undefined
              : ({
                  "--dna-wavelength": `${wavelength}px`,
                  animationDuration: `${duration}s`,
                } as React.CSSProperties)
          }
        >
          {/* Back half of both strands. */}
          {layer(false)}

          {/* Rungs sit between the two halves, so the near strand covers them. */}
          {rungs.map((r, i) => (
            <line
              key={`rung-${i}`}
              x1={r.x1}
              y1={r.y}
              x2={r.x2}
              y2={r.y}
              stroke="var(--chart-1)"
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.15 + r.depth * 0.3}
            />
          ))}

          {/* Near half, drawn last so it occludes. */}
          {layer(true)}
        </g>
      </g>
    </svg>
  );
}
