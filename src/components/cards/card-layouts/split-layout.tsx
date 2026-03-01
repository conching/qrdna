import Image from "next/image";
import { MapPin } from "lucide-react";
import type { BusinessCard } from "@/lib/cards/types";
import { CardActionButtons } from "./card-action-buttons";
import { CardSocialLinks } from "./card-social-links";

interface Props {
  card: BusinessCard;
}

export function SplitLayout({ card }: Props) {
  const { theme } = card;
  const accent = theme.accentColor;
  // Left panel is primary color; right is bg
  const leftBg = theme.primaryColor;

  return (
    <div
      className="flex min-h-screen w-full flex-col md:flex-row"
      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
    >
      {/* Left panel — identity */}
      <div
        className="flex w-full flex-col items-center justify-center gap-5 px-8 py-12 text-center md:w-2/5 md:min-h-screen"
        style={{ backgroundColor: leftBg }}
      >
        {card.headshot_url ? (
          <div className="h-32 w-32 overflow-hidden rounded-full ring-4 ring-white/20">
            <Image
              src={card.headshot_url}
              alt={`${card.first_name} ${card.last_name}`}
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 text-5xl font-bold text-white">
            {card.first_name[0]}{card.last_name[0]}
          </div>
        )}

        <div className="text-white">
          <h1 className="text-2xl font-bold">
            {card.first_name} {card.last_name}
          </h1>
          {card.pronouns && (
            <p className="text-xs opacity-60">({card.pronouns})</p>
          )}
          {card.title && <p className="mt-1 text-sm font-medium opacity-90">{card.title}</p>}
          {card.company && <p className="text-sm opacity-70">{card.company}</p>}
        </div>

        {card.company_logo_url && (
          <Image
            src={card.company_logo_url}
            alt={card.company ?? "Company"}
            width={80}
            height={32}
            className="h-8 object-contain opacity-60"
          />
        )}
      </div>

      {/* Right panel — details */}
      <div className="flex flex-1 flex-col justify-center gap-6 px-8 py-12">
        {card.bio && (
          <p className="text-sm leading-relaxed opacity-80">{card.bio}</p>
        )}

        {card.address?.city && (
          <p className="flex items-center gap-2 text-sm opacity-60">
            <MapPin className="h-4 w-4" style={{ color: accent }} />
            {[card.address.city, card.address.state, card.address.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}

        <CardActionButtons card={card} accentColor={accent} />
        <CardSocialLinks links={card.social_links ?? []} accentColor={accent} />
      </div>
    </div>
  );
}
