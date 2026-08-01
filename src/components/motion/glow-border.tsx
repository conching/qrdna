"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GlowBorderProps {
  /** When true, the glow is always active. When false, activates on hover. Default: false (hover-activated). */
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Inject the glow keyframe once globally
let glowStyleInjected = false;
const ANIM_NAME = "qrdna-glow-spin";

function ensureGlowStyle() {
  if (glowStyleInjected || typeof document === "undefined") return;
  glowStyleInjected = true;

  const style = document.createElement("style");
  style.textContent = [
    `@keyframes ${ANIM_NAME} {`,
    "  from { transform: rotate(0deg); }",
    "  to { transform: rotate(360deg); }",
    "}",
  ].join("\n");
  document.head.appendChild(style);
}

/**
 * Animated gradient border that cycles through brand colors.
 *
 * Uses an oversized conic-gradient background that rotates via CSS transform,
 * clipped by the wrapper's overflow-hidden + border-radius. The inner content
 * sits on top with a solid background to create the "border" effect.
 */
export function GlowBorder({
  active = false,
  children,
  className,
}: GlowBorderProps) {
  const [hovered, setHovered] = useState(false);
  const isGlowing = active || hovered;
  const hasInjected = useRef(false);

  useEffect(() => {
    if (!hasInjected.current) {
      ensureGlowStyle();
      hasInjected.current = true;
    }
  }, []);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl p-px",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Spinning gradient background (the "border") */}
      <div
        className={cn(
          "absolute inset-[-50%] transition-opacity duration-300",
          isGlowing ? "opacity-100" : "opacity-0",
        )}
        style={{
          background:
            "conic-gradient(from 0deg, var(--chart-1), var(--chart-2), var(--chart-3), var(--chart-5), var(--chart-1))",
          animation: isGlowing
            ? `${ANIM_NAME} 3s linear infinite`
            : "none",
        }}
        aria-hidden="true"
      />

      {/* Inner content, on the card surface so it masks the gradient in both
          themes. This was hardcoded to #141416 — the dark-mode card colour —
          which meant a dark plate stamped onto the light theme. */}
      <div className="relative rounded-[11px] bg-card">{children}</div>
    </div>
  );
}
