"use client";

import {
  Link,
  Type,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  Contact,
  MapPin,
  CalendarDays,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { QR_CONTENT_TYPES } from "@/lib/constants";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Link,
  Type,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  Contact,
  MapPin,
  CalendarDays,
  Smartphone,
};

export function QRTypeSelector() {
  const contentType = useQREditorStore((s) => s.contentType);
  const setContentType = useQREditorStore((s) => s.setContentType);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {QR_CONTENT_TYPES.map((type) => {
        const Icon = ICON_MAP[type.icon];
        const isActive = contentType === type.value;

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => setContentType(type.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all hover:bg-accent/50",
              isActive
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "border-border",
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "size-5",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
            )}
            <div>
              <p
                className={cn(
                  "text-sm font-medium leading-tight",
                  isActive ? "text-primary" : "text-foreground",
                )}
              >
                {type.label}
              </p>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                {type.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
