import type { QRContentType } from "@/lib/qr/types";

// ---------------------------------------------------------------------------
// App meta
// ---------------------------------------------------------------------------

export const APP_NAME = "QR DNA";

export const SHORT_DOMAIN =
  process.env.NEXT_PUBLIC_SHORT_DOMAIN ?? "qrdna.io";

export const SHORT_CODE_LENGTH = 7;

/**
 * Public base used when a QR encodes a link back to us. Prefers the short
 * domain because every character costs QR modules.
 */
export const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? `https://${SHORT_DOMAIN}`;

/** URL a vCard QR points at when the contact is served as a .vcf with photo. */
export function contactUrl(shortCode: string): string {
  return `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/c/${shortCode}`;
}

// ---------------------------------------------------------------------------
// Logo / image constraints
// ---------------------------------------------------------------------------

/** Maximum logo file size in bytes (2 MB) */
export const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export const SUPPORTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
] as const;

// ---------------------------------------------------------------------------
// Tier limits
// ---------------------------------------------------------------------------

export interface TierLimits {
  dynamicCodes: number;
  scansPerMonth: number;
  businessCards: number;
  projects: number;
  analyticsHistoryDays: number;
  exportFormats: string[];
}

export const TIER_LIMITS: Record<"free" | "pro" | "team", TierLimits> = {
  free: {
    dynamicCodes: 5,
    scansPerMonth: 1_000,
    businessCards: 1,
    projects: 1,
    analyticsHistoryDays: 7,
    exportFormats: ["png", "svg"],
  },
  pro: {
    dynamicCodes: 100,
    scansPerMonth: 50_000,
    businessCards: 10,
    projects: 20,
    analyticsHistoryDays: 365,
    exportFormats: ["png", "svg", "pdf", "eps"],
  },
  team: {
    dynamicCodes: 500,
    scansPerMonth: 250_000,
    businessCards: 50,
    projects: 100,
    analyticsHistoryDays: 730,
    exportFormats: ["png", "svg", "pdf", "eps"],
  },
} as const;

// ---------------------------------------------------------------------------
// QR content type definitions
// ---------------------------------------------------------------------------

export interface QRContentTypeOption {
  value: QRContentType;
  label: string;
  icon: string;
  description: string;
}

export const QR_CONTENT_TYPES: QRContentTypeOption[] = [
  {
    value: "url",
    label: "URL",
    icon: "Link",
    description: "Link to any website or web page",
  },
  {
    value: "text",
    label: "Text",
    icon: "Type",
    description: "Plain text message",
  },
  {
    value: "email",
    label: "Email",
    icon: "Mail",
    description: "Pre-filled email with address, subject, and body",
  },
  {
    value: "phone",
    label: "Phone",
    icon: "Phone",
    description: "Phone number for quick dialing",
  },
  {
    value: "sms",
    label: "SMS",
    icon: "MessageSquare",
    description: "Pre-filled SMS with number and message",
  },
  {
    value: "wifi",
    label: "Wi-Fi",
    icon: "Wifi",
    description: "Auto-connect to a Wi-Fi network",
  },
  {
    value: "vcard",
    label: "vCard",
    icon: "Contact",
    description: "Digital contact card",
  },
  {
    value: "geo",
    label: "Location",
    icon: "MapPin",
    description: "Geographic coordinates on a map",
  },
  {
    value: "event",
    label: "Event",
    icon: "CalendarDays",
    description: "Calendar event with date, time, and details",
  },
  {
    value: "app_store",
    label: "App Store",
    icon: "Smartphone",
    description: "Link to an app on the App Store or Play Store",
  },
] as const;
