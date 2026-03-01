"use client";

import { Phone, Mail, Globe, MapPin, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BusinessCard } from "@/lib/cards/types";

interface CardActionButtonsProps {
  card: BusinessCard;
  accentColor: string;
}

export function CardActionButtons({ card, accentColor }: CardActionButtonsProps) {
  const primaryPhone = card.phones?.[0];
  const primaryEmail = card.emails?.[0];
  const primaryWebsite = card.websites?.[0];

  const logEvent = (eventType: string, eventData?: Record<string, unknown>) => {
    fetch(`/api/v1/cards/${card.id}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: eventType, event_data: eventData }),
    }).catch(() => {});
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card.first_name} ${card.last_name}`,
          text: card.title ?? "",
          url,
        });
      } catch {
        // dismissed
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
    logEvent("link_click", { action: "share" });
  };

  const handleVCardDownload = () => {
    logEvent("vcard_download");
    window.location.href = `/api/v1/cards/${card.id}/vcard`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {primaryPhone && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2"
          style={{ borderColor: accentColor, color: accentColor }}
          onClick={() => logEvent("link_click", { action: "call", number: primaryPhone.number })}
        >
          <a href={`tel:${primaryPhone.number}`}>
            <Phone className="h-4 w-4" />
            Call
          </a>
        </Button>
      )}

      {primaryEmail && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2"
          style={{ borderColor: accentColor, color: accentColor }}
          onClick={() => logEvent("link_click", { action: "email", address: primaryEmail.address })}
        >
          <a href={`mailto:${primaryEmail.address}`}>
            <Mail className="h-4 w-4" />
            Email
          </a>
        </Button>
      )}

      {primaryWebsite && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2"
          style={{ borderColor: accentColor, color: accentColor }}
          onClick={() => logEvent("link_click", { action: "website", url: primaryWebsite.url })}
        >
          <a href={primaryWebsite.url} target="_blank" rel="noopener noreferrer">
            <Globe className="h-4 w-4" />
            Website
          </a>
        </Button>
      )}

      {card.address?.city && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2"
          style={{ borderColor: accentColor, color: accentColor }}
          onClick={() => logEvent("link_click", { action: "map" })}
        >
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              [card.address?.street, card.address?.city, card.address?.country]
                .filter(Boolean)
                .join(", "),
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin className="h-4 w-4" />
            Map
          </a>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        style={{ borderColor: accentColor, color: accentColor }}
        onClick={handleVCardDownload}
      >
        <Download className="h-4 w-4" />
        Save Contact
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        style={{ color: accentColor }}
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
