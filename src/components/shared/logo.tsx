import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <span
      className={cn(
        "font-sans font-bold tracking-tight select-none",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <span className="text-primary">QR</span>
      <span className="text-foreground">{" "}DNA</span>
    </span>
  );
}
