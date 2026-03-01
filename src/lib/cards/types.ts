// ─────────────────────────────────────────────────────────────────────────────
// Business Card domain types
// ─────────────────────────────────────────────────────────────────────────────

export interface CardPhone {
  label: "mobile" | "work" | "home" | "fax" | "other";
  number: string;
}

export interface CardEmail {
  label: "work" | "personal" | "other";
  address: string;
}

export interface CardWebsite {
  label: string;
  url: string;
}

export interface CardAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface CardSocialLink {
  platform:
    | "linkedin"
    | "twitter"
    | "instagram"
    | "github"
    | "youtube"
    | "tiktok"
    | "facebook"
    | "other";
  url: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────────────────────────────────────

export type CardLayout = "centered" | "left-aligned" | "split" | "minimal";
export type CardFont = "inter" | "space-grotesk" | "playfair" | "mono";

export interface CardTheme {
  layout: CardLayout;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  font: CardFont;
  darkMode: boolean;
}

export const DEFAULT_THEME: CardTheme = {
  layout: "centered",
  primaryColor: "#7C5CFF",
  bgColor: "#0A0A0B",
  textColor: "#FFFFFF",
  accentColor: "#06D6A0",
  font: "inter",
  darkMode: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Card row (matches DB schema)
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessCard {
  id: string;
  user_id: string;
  qr_code_id: string | null;
  slug: string;
  first_name: string;
  last_name: string;
  pronouns: string | null;
  title: string | null;
  company: string | null;
  department: string | null;
  bio: string | null;
  phones: CardPhone[];
  emails: CardEmail[];
  websites: CardWebsite[];
  address: CardAddress | null;
  social_links: CardSocialLink[];
  headshot_url: string | null;
  company_logo_url: string | null;
  theme: CardTheme;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create / update payloads (API contract)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateCardPayload {
  first_name: string;
  last_name: string;
  pronouns?: string;
  title?: string;
  company?: string;
  department?: string;
  bio?: string;
  phones?: CardPhone[];
  emails?: CardEmail[];
  websites?: CardWebsite[];
  address?: CardAddress;
  social_links?: CardSocialLink[];
  headshot_url?: string;
  company_logo_url?: string;
  theme?: Partial<CardTheme>;
  slug?: string; // optional override; auto-generated if absent
}

export type UpdateCardPayload = Partial<Omit<CreateCardPayload, "slug">> & {
  slug?: string;
  is_active?: boolean;
};
