import { nanoid } from "nanoid";

/**
 * Convert a string to a URL-safe slug fragment.
 * e.g. "Jane O'Brien" → "jane-obrien"
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip non-alphanumeric
    .trim()
    .replace(/[\s]+/g, "-") // spaces to hyphens
    .replace(/-{2,}/g, "-") // collapse multiple hyphens
    .slice(0, 30); // cap length
}

/**
 * Generate a unique card slug from a name.
 * Format: `firstname-lastname-xxxx` (6-char random suffix for collision safety)
 *
 * e.g. generateCardSlug("Jane", "Smith") → "jane-smith-k3f9h1"
 */
export function generateCardSlug(firstName: string, lastName: string): string {
  const base = slugify(`${firstName} ${lastName}`);
  const suffix = nanoid(6).toLowerCase().replace(/[^a-z0-9]/g, "x");
  return `${base}-${suffix}`;
}
