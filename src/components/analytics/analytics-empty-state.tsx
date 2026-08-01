import { cn } from "@/lib/utils";
import { DNAHelix } from "@/components/motion/dna-helix";

interface AnalyticsEmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Empty state with a slowly turning DNA double helix.
 *
 * The earlier version floated, glowed and pulsed on a loop, and shipped its
 * keyframes as an inline <style> duplicated per instance. This turns instead of
 * throbbing: one shared keyframe, one transform, and the rotation is the real
 * projection of a helix rather than decoration bolted onto a static drawing.
 */
export function AnalyticsEmptyState({
  className,
  title = "No scan data yet",
  description = "Scans will appear here once your QR codes are scanned",
}: AnalyticsEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16",
        className,
      )}
    >
      <div className="mb-6">
        <DNAHelix />
      </div>

      <p className="text-sm font-medium text-foreground/80">{title}</p>
      <p className="mt-1 max-w-[260px] text-center text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
