import React from "react";
import Image from "next/image";
import type { BusinessCard } from "@/lib/cards/types";
import { CardActionButtons } from "./card-action-buttons";
import { CardSocialLinks } from "./card-social-links";

interface Props {
  card: BusinessCard;
}

export function CenteredLayout({ card }: Props) {
  const { theme } = card;
  const accent = theme.accentColor;

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center px-4 py-12"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Avatar */}
        {card.headshot_url ? (
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full ring-4 ring-offset-2" style={{ outlineColor: accent } as React.CSSProperties}>
            <Image
              src={card.headshot_url}
              alt={`${card.first_name} ${card.last_name}`}
              width={112}
              height={112}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className="mx-auto flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold"
            style={{ backgroundColor: `${accent}20`, color: accent }}
          >
            {card.first_name[0]}{card.last_name[0]}
          </div>
        )}

        {/* Name + meta */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: theme.textColor }}>
            {card.first_name} {card.last_name}
            {card.pronouns && (
              <span className="ml-2 text-sm font-normal opacity-60">({card.pronouns})</span>
            )}
          </h1>
          {card.title && (
            <p className="mt-1 text-sm font-medium" style={{ color: accent }}>
              {card.title}
            </p>
          )}
          {card.company && (
            <p className="text-sm opacity-70">{card.company}{card.department ? ` · ${card.department}` : ""}</p>
          )}
        </div>

        {/* Bio */}
        {card.bio && (
          <p className="text-sm leading-relaxed opacity-80">{card.bio}</p>
        )}

        {/* CTA buttons */}
        <div className="flex justify-center">
          <CardActionButtons card={card} accentColor={accent} />
        </div>

        {/* Company logo */}
        {card.company_logo_url && (
          <div className="flex justify-center opacity-60">
            <Image
              src={card.company_logo_url}
              alt={card.company ?? "Company logo"}
              width={80}
              height={32}
              className="h-8 object-contain"
            />
          </div>
        )}

        {/* Social links */}
        <div className="flex justify-center">
          <CardSocialLinks links={card.social_links ?? []} accentColor={accent} />
        </div>
      </div>
    </div>
  );
}
