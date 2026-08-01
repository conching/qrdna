/**
 * Canonical vCard 3.0 builder (RFC 2426).
 *
 * This is the single implementation used by both QR encoding and the business
 * card module. It previously existed twice — `lib/qr/encoders.ts` had a version
 * with no escaping, LF line endings and no folding, which silently produced
 * broken contacts for anyone whose company name contained a comma.
 *
 * Three things the naive version got wrong and this one does not:
 *  - **Escaping.** `,` `;` `\` and newlines are structural in vCard. "Smith,
 *    Jones & Co" as an ORG value truncates the field without escaping.
 *  - **Line endings.** The spec mandates CRLF. Outlook in particular rejects
 *    LF-only vCards.
 *  - **Folding.** Lines fold at 75 *octets*, not characters — folding on a JS
 *    string index splits multi-byte UTF-8 sequences and corrupts non-ASCII
 *    names.
 */

export interface VCardPhone {
  number: string;
  /** CELL | WORK | HOME | FAX | MAIN — free text is uppercased. */
  label?: string;
}

export interface VCardEmail {
  address: string;
  label?: string;
}

export interface VCardAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface VCardPhoto {
  /** Raw base64 payload, no `data:` prefix. */
  base64: string;
  /** JPEG | PNG */
  type: "JPEG" | "PNG";
}

export interface VCardInput {
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  phones?: VCardPhone[];
  emails?: VCardEmail[];
  websites?: string[];
  address?: VCardAddress;
  note?: string;
  /** Embedded portrait. Omitted from QR-encoded output — see buildVCard opts. */
  photo?: VCardPhoto | null;
  /** Extra X- fields, e.g. social profiles. */
  socialLinks?: Array<{ platform: string; url: string }>;
}

// ---------------------------------------------------------------------------
// Escaping and folding
// ---------------------------------------------------------------------------

/**
 * Escape a vCard *text value* per RFC 2426 §2.4.2.
 * Not for structured separators — those are joined after escaping each part.
 */
export function escapeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

const encoder = new TextEncoder();

/**
 * Fold a content line at 75 octets with a single leading space on
 * continuations (RFC 2426 §2.6).
 *
 * Folding is byte-oriented, so this walks code points and tracks their encoded
 * length rather than slicing the string — otherwise a fold landing inside a
 * multi-byte character produces mojibake in the parsed contact.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let bytes = 0;
  // First line allows 75 octets; continuations allow 74 (the leading space).
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      out.push(current);
      current = char;
      bytes = size;
      limit = 74;
    } else {
      current += char;
      bytes += size;
    }
  }
  if (current) out.push(current);

  return out.map((chunk, i) => (i === 0 ? chunk : ` ${chunk}`)).join("\r\n");
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export interface BuildVCardOptions {
  /**
   * Include the embedded PHOTO property. Defaults to true.
   *
   * Set false for QR-encoded output: a QR code holds at most 2953 bytes and a
   * usable headshot is 10–30 KB base64, so an embedded photo cannot fit. Photos
   * reach the contact via the hosted .vcf endpoint instead.
   */
  includePhoto?: boolean;
  /** Emit a REV timestamp. Off for QR output so the payload stays stable. */
  includeRev?: boolean;
}

export function buildVCard(
  input: VCardInput,
  options: BuildVCardOptions = {},
): string {
  const { includePhoto = true, includeRev = true } = options;

  const first = input.firstName?.trim() ?? "";
  const last = input.lastName?.trim() ?? "";
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  // N is structured: Family;Given;Additional;Prefix;Suffix — escape each part.
  lines.push(`N:${escapeValue(last)};${escapeValue(first)};;;`);

  const fullName = [first, last].filter(Boolean).join(" ");
  lines.push(`FN:${escapeValue(fullName)}`);

  if (input.organization?.trim()) {
    lines.push(`ORG:${escapeValue(input.organization.trim())}`);
  }
  if (input.title?.trim()) {
    lines.push(`TITLE:${escapeValue(input.title.trim())}`);
  }

  for (const phone of input.phones ?? []) {
    if (!phone.number?.trim()) continue;
    const type = (phone.label || "CELL").toUpperCase().replace(/[^A-Z]/g, "");
    lines.push(`TEL;TYPE=${type || "CELL"}:${escapeValue(phone.number.trim())}`);
  }

  for (const email of input.emails ?? []) {
    if (!email.address?.trim()) continue;
    const type = (email.label || "INTERNET")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    lines.push(
      `EMAIL;TYPE=${type || "INTERNET"}:${escapeValue(email.address.trim())}`,
    );
  }

  for (const site of input.websites ?? []) {
    if (!site?.trim()) continue;
    lines.push(`URL:${escapeValue(normalizeUrl(site.trim()))}`);
  }

  const a = input.address;
  if (a && (a.street || a.city || a.state || a.zip || a.country)) {
    const adr = [
      "", // PO box
      "", // extended
      escapeValue(a.street ?? ""),
      escapeValue(a.city ?? ""),
      escapeValue(a.state ?? ""),
      escapeValue(a.zip ?? ""),
      escapeValue(a.country ?? ""),
    ].join(";");
    lines.push(`ADR;TYPE=WORK:${adr}`);
  }

  if (input.note?.trim()) {
    lines.push(`NOTE:${escapeValue(input.note.trim())}`);
  }

  for (const social of input.socialLinks ?? []) {
    if (!social.url?.trim()) continue;
    const platform = social.platform.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${escapeValue(social.url)}`);
  }

  if (includePhoto && input.photo?.base64) {
    // ENCODING=b (not BASE64) is the RFC 2426 spelling and the one iOS and
    // macOS Contacts accept. The value is folded like any other line.
    lines.push(
      `PHOTO;ENCODING=b;TYPE=${input.photo.type}:${input.photo.base64}`,
    );
  }

  if (includeRev) {
    lines.push(`REV:${new Date().toISOString()}`);
  }

  lines.push("END:VCARD");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

function normalizeUrl(url: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// ---------------------------------------------------------------------------
// QR capacity
// ---------------------------------------------------------------------------

/**
 * Maximum payload of a version-40 QR code at each error-correction level, in
 * bytes (ISO/IEC 18004, byte mode).
 *
 * Practical note: version 40 is a 177×177 module grid. Anything approaching
 * these numbers is unscannable by a phone camera at business-card size — the
 * comfortable ceiling for print is roughly a quarter of this.
 */
export const QR_BYTE_CAPACITY: Record<"L" | "M" | "Q" | "H", number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

/** Comfortable payload ceiling for a QR that must scan reliably off paper. */
export function comfortableCapacity(level: "L" | "M" | "Q" | "H"): number {
  return Math.floor(QR_BYTE_CAPACITY[level] * 0.35);
}

export function byteLength(str: string): number {
  return encoder.encode(str).length;
}
