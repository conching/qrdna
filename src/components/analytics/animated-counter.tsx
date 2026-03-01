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
 * A number that counts up from 0 to the target value with eased animation.
 * Uses requestAnimationFrame for smooth 60fps rendering.
 *
 * ```tsx
 * <AnimatedCounter value={1234} />  // renders "1,234" after counting up
 * ```
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  prefix,
  suffix,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
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
      className={cn(
        "tabular-nums font-bold tracking-tight transition-colors",
        className,
      )}
    >
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}
