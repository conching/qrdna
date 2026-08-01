"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * A number that eases to its new value when that value *changes* — when a time
 * range is switched, say, or fresh data arrives.
 *
 * It does not count up on mount. A figure that is already known has not
 * changed, and animating it on first paint only delays reading it.
 *
 * ```tsx
 * <AnimatedCounter value={1234} />  // renders "1,234" immediately
 * ```
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  prefix,
  suffix,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  // Seeded with the first value so the mount pass is a no-op.
  const previousValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const delta = value - startValue;

    if (delta === 0) return;

    const startTime = performance.now();

    function easeOutExpo(t: number): number {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(startValue + delta * eased);

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        previousValue.current = value;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span
      className={cn("tabular-nums tracking-tight", className)}
    >
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}
