import Image from "next/image";
import { MapPin, Building2 } from "lucide-react";
import type { BusinessCard } from "@/lib/cards/types";
import { CardActionButtons } from "./card-action-buttons";
import { CardSocialLinks } from "./card-social-links";

interface Props {
  card: BusinessCard;
}

export function LeftAlignedLayout({ card }: Props) {
  const { theme } = card;
  const accent = theme.accentColor;

  return (
    <div
      className="flex min-h-screen w-full flex-col px-4 py-12"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Header: avatar + name side by side */}
        <div className="flex items-start gap-5">
          {card.headshot_url ? (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={card.headshot_url}
                alt={`${card.first_name} ${card.last_name}`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              {card.first_name[0]}{card.last_name[0]}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.textColor }}>
              {card.first_name} {card.last_name}
              {card.pronouns && (
                <span className="ml-2 text-xs font-normal opacity-60">({card.pronouns})</span>
              )}
            </h1>
            {card.title && (
              <p className="mt-1 text-sm font-semibold" style={{ color: accent }}>
                {card.title}
              </p>
            )}
            {(card.company || card.department) && (
              <p className="mt-0.5 flex items-center gap-1 text-sm opacity-70">
                <Building2 className="h-3.5 w-3.5" />
                {card.company}{card.department ? ` · ${card.department}` : ""}
              </p>
            )}
            {card.address?.city && (
              <p className="mt-0.5 flex items-center gap-1 text-xs opacity-50">
                <MapPin className="h-3 w-3" />
                {[card.address.city, card.address.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full opacity-20" style={{ backgroundColor: theme.textColor }} />

        {/* Bio */}
        {card.bio && (
          <p className="text-sm leading-relaxed opacity-80">{card.bio}</p>
        )}

        {/* Actions */}
        <CardActionButtons card={card} accentColor={accent} />

        {/* Social */}
        <CardSocialLinks links={card.social_links ?? []} accentColor={accent} />

        {/* Company logo */}
        {card.company_logo_url && (
          <div className="opacity-50">
            <Image
              src={card.company_logo_url}
              alt={card.company ?? "Company logo"}
              width={80}
              height={32}
              className="h-8 object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
