import type { BusinessCard } from "./types";

/**
 * Build a vCard 3.0 string from a BusinessCard record.
 * https://www.rfc-editor.org/rfc/rfc2426
 */
export function buildVCard(card: BusinessCard): string {
  const lines: string[] = [];

  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");
  lines.push(`N:${escape(card.last_name)};${escape(card.first_name)};;;`);
  lines.push(`FN:${escape(`${card.first_name} ${card.last_name}`)}`);

  if (card.title) lines.push(`TITLE:${escape(card.title)}`);
  if (card.company) lines.push(`ORG:${escape(card.company)}`);
  if (card.bio) lines.push(`NOTE:${escape(card.bio)}`);

  for (const phone of card.phones ?? []) {
    const type = phone.label.toUpperCase();
    lines.push(`TEL;TYPE=${type}:${phone.number}`);
  }

  for (const email of card.emails ?? []) {
    const type = email.label.toUpperCase();
    lines.push(`EMAIL;TYPE=${type}:${email.address}`);
  }

  for (const site of card.websites ?? []) {
    lines.push(`URL:${site.url}`);
  }

  const addr = card.address;
  if (addr) {
    const adr = [
      "",
      "",
      escape(addr.street ?? ""),
      escape(addr.city ?? ""),
      escape(addr.state ?? ""),
      escape(addr.zip ?? ""),
      escape(addr.country ?? ""),
    ].join(";");
    lines.push(`ADR;TYPE=WORK:${adr}`);
  }

  if (card.headshot_url) {
    lines.push(`PHOTO;VALUE=URI:${card.headshot_url}`);
  }

  // social links as X- extension fields
  for (const social of card.social_links ?? []) {
    const platform = social.platform.toUpperCase().replace(/-/g, "_");
    lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${social.url}`);
  }

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  // vCard lines must be wrapped at 75 octets
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Fold long lines per RFC 2426 §2.6 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

/** Escape special vCard characters */
function escape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}
