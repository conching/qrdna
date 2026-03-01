"use client";

import { ExternalLink } from "lucide-react";
import type { CardSocialLink } from "@/lib/cards/types";

const PLATFORM_LABELS: Record<CardSocialLink["platform"], string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  instagram: "Instagram",
  github: "GitHub",
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  other: "Link",
};

interface CardSocialLinksProps {
  links: CardSocialLink[];
  accentColor: string;
  onLinkClick?: (platform: string, url: string) => void;
}

export function CardSocialLinks({ links, accentColor, onLinkClick }: CardSocialLinksProps) {
  if (!links.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ borderColor: `${accentColor}50`, color: accentColor }}
          onClick={() => onLinkClick?.(link.platform, link.url)}
        >
          {PLATFORM_LABELS[link.platform]}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  );
}
