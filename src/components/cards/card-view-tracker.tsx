"use client";

import { useEffect } from "react";

/**
 * Fires a "view" event to the card analytics endpoint once on mount.
 * Rendered as a tiny client component inside the SSR card page.
 */
export function CardViewTracker({ cardId }: { cardId: string }) {
  useEffect(() => {
    fetch(`/api/v1/cards/${cardId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "view" }),
    }).catch(() => {});
  }, [cardId]);

  return null;
}
