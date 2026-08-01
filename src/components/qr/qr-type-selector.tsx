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
    <div
      role="group"
      aria-label="QR code content type"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      {QR_CONTENT_TYPES.map((type) => {
        const Icon = ICON_MAP[type.icon];
        const isActive = contentType === type.value;

        return (
          <button
            key={type.value}
            type="button"
            // The label and description are block-level children, so the
            // computed accessible name came out empty — ten unnamed buttons in
            // a row. Naming the control explicitly leaves the description as
            // supporting text rather than part of the name.
            aria-label={type.label}
            // Selection is shown visually by a ring and colour; aria-pressed is
            // the non-visual equivalent, without which a screen reader user
            // cannot tell which type is active.
            aria-pressed={isActive}
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
                aria-hidden="true"
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
