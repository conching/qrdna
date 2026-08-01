"use client";

import Link from "next/link";
import {
  BarChart3,
  Copy,
  Edit,
  MoreHorizontal,
  Power,
  Star,
  Trash2,
} from "lucide-react";

import type { QRCodeRow } from "@/types/database";
import type { Json } from "@/types/database";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils/format";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStyleColors(style: Json | null): {
  fgColor: string;
  bgColor: string;
} {
  if (
    style &&
    typeof style === "object" &&
    !Array.isArray(style)
  ) {
    const s = style as Record<string, unknown>;
    return {
      fgColor: typeof s.fgColor === "string" ? s.fgColor : "#000000",
      bgColor: typeof s.bgColor === "string" ? s.bgColor : "#ffffff",
    };
  }
  return { fgColor: "#000000", bgColor: "#ffffff" };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QRCodeCardProps {
  qrCode: QRCodeRow;
  onFavoriteToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleActive?: (id: string, next: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QRCodeCard({
  qrCode,
  onFavoriteToggle,
  onDelete,
  onDuplicate,
  onToggleActive,
}: QRCodeCardProps) {
  const { fgColor, bgColor } = getStyleColors(qrCode.style);

  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md"
      )}
    >
      {/* ---- Clickable card body (navigates to detail) ---- */}
      <Link
        href={`/qr/${qrCode.id}`}
        className="flex flex-col gap-3 p-4 pb-3"
      >
        {/* Thumbnail + meta row */}
        <div className="flex items-start gap-3">
          {/* QR thumbnail indicator */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
            style={{ backgroundColor: bgColor }}
          >
            {/* Simple 3x3 dot grid to hint at QR pattern */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="2" width="6" height="6" rx="1" fill={fgColor} />
              <rect x="16" y="2" width="6" height="6" rx="1" fill={fgColor} />
              <rect x="2" y="16" width="6" height="6" rx="1" fill={fgColor} />
              <rect x="10" y="10" width="4" height="4" rx="0.5" fill={fgColor} />
              <rect x="17" y="17" width="3" height="3" rx="0.5" fill={fgColor} />
              <rect x="10" y="3" width="3" height="3" rx="0.5" fill={fgColor} />
              <rect x="3" y="10" width="3" height="3" rx="0.5" fill={fgColor} />
            </svg>
          </div>

          {/* Name + badges */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {qrCode.name}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant={qrCode.type === "dynamic" ? "default" : "outline"}
                className="text-[10px] leading-none"
              >
                {qrCode.type}
              </Badge>
              <Badge variant="secondary" className="text-[10px] leading-none">
                {qrCode.content_type}
              </Badge>
            </div>
          </div>

          {/* Active status dot */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "mt-1 block h-2.5 w-2.5 shrink-0 rounded-full",
                    qrCode.is_active ? "bg-green-500" : "bg-gray-300"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="left">
                {qrCode.is_active ? "Active" : "Inactive"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BarChart3 className="size-3" />
            {qrCode.total_scans} scans
          </span>
          <span className="text-border">|</span>
          <span>{formatRelativeDate(qrCode.created_at)}</span>
        </div>
      </Link>

      {/* ---- Action bar ---- */}
      <div className="flex items-center justify-between border-t px-3 py-2">
        {/* Favorite */}
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-yellow-500"
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.(qrCode.id);
          }}
        >
          <Star
            className={cn(
              "size-3.5",
              qrCode.is_favorited && "fill-yellow-400 text-yellow-400"
            )}
          />
          <span className="sr-only">
            {qrCode.is_favorited ? "Unfavorite" : "Favorite"}
          </span>
        </Button>

        {/* Dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href={`/qr/${qrCode.id}`}>
                <Edit className="mr-2 size-3.5" />
                Edit
              </Link>
            </DropdownMenuItem>
            {/* Rendered only when wired up. An item with no handler looks
                identical to one that is broken, which is how these two sat
                dead in the menu — omitting them fails visibly instead. */}
            {onDuplicate && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(qrCode.id);
                }}
              >
                <Copy className="mr-2 size-3.5" />
                Duplicate
              </DropdownMenuItem>
            )}
            {onToggleActive && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(qrCode.id, !qrCode.is_active);
                }}
              >
                <Power className="mr-2 size-3.5" />
                {qrCode.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(qrCode.id);
              }}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
