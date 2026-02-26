import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      Pro
    </span>
  );
}
