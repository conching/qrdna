"use client";

import { MotionConfig } from "framer-motion";

/**
 * Applies the user's `prefers-reduced-motion` setting to every Framer Motion
 * animation in the app.
 *
 * Framer Motion animates through inline styles, so the global CSS override in
 * globals.css cannot reach it. `reducedMotion="user"` makes it skip transform
 * and layout animations while still allowing opacity crossfades, which is the
 * behaviour the WCAG guidance asks for.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
