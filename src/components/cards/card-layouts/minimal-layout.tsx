import Image from "next/image";
import type { BusinessCard } from "@/lib/cards/types";
import { CardActionButtons } from "./card-action-buttons";
import { CardSocialLinks } from "./card-social-links";

interface Props {
  card: BusinessCard;
}

export function MinimalLayout({ card }: Props) {
  const { theme } = card;
  const accent = theme.accentColor;

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center px-6"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      <div className="w-full max-w-xs space-y-5">
        {/* Thin accent bar */}
        <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: accent }} />

        {/* Name */}
        <div>
          <h1 className="text-3xl font-light tracking-tight">
            {card.first_name}{" "}
            <span className="font-semibold">{card.last_name}</span>
          </h1>
          {card.pronouns && (
            <span className="text-xs opacity-40">({card.pronouns})</span>
          )}
        </div>

        {/* Role */}
        {(card.title || card.company) && (
          <div className="space-y-0.5">
            {card.title && (
              <p className="text-sm" style={{ color: accent }}>{card.title}</p>
            )}
            {card.company && (
              <p className="text-xs opacity-50">{card.company}</p>
            )}
          </div>
        )}

        {/* Headshot (small, inline for minimal) */}
        {card.headshot_url && (
          <div className="h-14 w-14 overflow-hidden rounded-lg">
            <Image
              src={card.headshot_url}
              alt={`${card.first_name} ${card.last_name}`}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Bio */}
        {card.bio && (
          <p className="text-xs leading-relaxed opacity-60">{card.bio}</p>
        )}

        {/* Divider */}
        <div className="h-px opacity-10" style={{ backgroundColor: theme.textColor }} />

        {/* Actions */}
        <CardActionButtons card={card} accentColor={accent} />

        {/* Social */}
        <CardSocialLinks links={card.social_links ?? []} accentColor={accent} />
      </div>
    </div>
  );
}
