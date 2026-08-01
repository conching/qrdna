import { PUBLIC_BASE_URL, contactUrl } from "@/lib/constants";

/**
 * Where a saved code actually resolves on the public internet.
 *
 * A short code alone does not determine the URL — the path depends on what the
 * code is for:
 *
 *   - **dynamic**  → `/<code>`, a redirect whose destination is editable
 *   - **hosted contact** → `/c/<code>`, which serves a .vcf with the headshot
 *   - **plain static** → nothing. The data lives in the symbol itself; there is
 *     no server-side address to visit.
 *
 * This was previously reconstructed inline in three places, all of which
 * assumed the dynamic form. A hosted contact card therefore displayed and
 * copied `/<code>`, which resolves to NO_DESTINATION because a static code has
 * no destination to redirect to.
 */
export interface CodeUrlInput {
  type: string;
  short_code: string | null;
  content_type: string;
  static_data: unknown;
}

export type CodeUrlKind = "redirect" | "contact";

export interface CodeUrl {
  /** Absolute URL, e.g. https://qrdna.io/c/aBcDeFg */
  href: string;
  /** Without the scheme, for display: qrdna.io/c/aBcDeFg */
  display: string;
  kind: CodeUrlKind;
  /** UI label — "Short URL" undersells a contact link. */
  label: string;
}

function isHostedContact(qr: CodeUrlInput): boolean {
  if (qr.content_type !== "vcard") return false;
  const sd = qr.static_data;
  if (!sd || typeof sd !== "object" || Array.isArray(sd)) return false;
  return (sd as { hostedContact?: unknown }).hostedContact === true;
}

export function publicUrlForCode(qr: CodeUrlInput): CodeUrl | null {
  if (!qr.short_code) return null;

  if (isHostedContact(qr)) {
    const href = contactUrl(qr.short_code);
    return {
      href,
      display: href.replace(/^https?:\/\//, ""),
      kind: "contact",
      label: "Contact link",
    };
  }

  if (qr.type === "dynamic") {
    const base = PUBLIC_BASE_URL.replace(/\/+$/, "");
    const href = `${base}/${qr.short_code}`;
    return {
      href,
      display: href.replace(/^https?:\/\//, ""),
      kind: "redirect",
      label: "Short URL",
    };
  }

  // A static code carries its own data; there is nothing to link to.
  return null;
}
