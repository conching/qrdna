import type { BusinessCard } from "./types";
import {
  buildVCard as buildVCardCanonical,
  type VCardInput,
  type VCardPhoto,
} from "@/lib/vcard/build";

/**
 * Build a vCard 3.0 string from a BusinessCard record.
 *
 * Escaping, CRLF line endings and octet-correct folding all live in
 * `@/lib/vcard/build` — this module only maps the DB row onto that shape.
 */
export function buildVCard(
  card: BusinessCard,
  photo?: VCardPhoto | null,
): string {
  return buildVCardCanonical(toVCardInput(card, photo));
}

export function toVCardInput(
  card: BusinessCard,
  photo?: VCardPhoto | null,
): VCardInput {
  return {
    firstName: card.first_name,
    lastName: card.last_name,
    organization: card.company ?? undefined,
    title: card.title ?? undefined,
    note: card.bio ?? undefined,
    phones: (card.phones ?? []).map((p) => ({
      number: p.number,
      label: p.label,
    })),
    emails: (card.emails ?? []).map((e) => ({
      address: e.address,
      label: e.label,
    })),
    websites: (card.websites ?? []).map((w) => w.url),
    address: card.address
      ? {
          street: card.address.street ?? undefined,
          city: card.address.city ?? undefined,
          state: card.address.state ?? undefined,
          zip: card.address.zip ?? undefined,
          country: card.address.country ?? undefined,
        }
      : undefined,
    socialLinks: (card.social_links ?? []).map((s) => ({
      platform: s.platform,
      url: s.url,
    })),
    photo: photo ?? null,
  };
}

/**
 * Fetch a remote headshot and return it as an embeddable vCard photo.
 *
 * `PHOTO;VALUE=URI:` is in the spec but iOS and macOS Contacts do not follow
 * the URL — the contact saves without a picture. Embedding the bytes as
 * `ENCODING=b` is the only form that reliably shows a photo after scanning.
 *
 * Returns null on any failure; a contact without a photo beats no contact.
 */
export async function fetchPhotoForVCard(
  url: string | null | undefined,
  maxBytes = 500_000,
): Promise<VCardPhoto | null> {
  if (!url?.trim()) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  try {
    const res = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!/^image\/(jpeg|jpg|png)/i.test(contentType)) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength > maxBytes) return null;

    return {
      type: /png/i.test(contentType) ? "PNG" : "JPEG",
      base64: Buffer.from(buf).toString("base64"),
    };
  } catch {
    return null;
  }
}
