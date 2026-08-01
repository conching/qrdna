import type {
  URLData,
  TextData,
  EmailData,
  PhoneData,
  SMSData,
  WiFiData,
  VCardData,
  GeoData,
  EventData,
  QRData,
} from "./types";
import {
  buildVCard,
  type VCardInput,
  type VCardPhoto,
} from "@/lib/vcard/build";

export function encodeURL(data: URLData): string {
  const url = data.url.trim();
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

export function encodeText(data: TextData): string {
  return data.text;
}

export function encodeEmail(data: EmailData): string {
  const params: string[] = [];
  if (data.subject) {
    params.push(`subject=${encodeURIComponent(data.subject)}`);
  }
  if (data.body) {
    params.push(`body=${encodeURIComponent(data.body)}`);
  }
  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${data.address}${query}`;
}

export function encodePhone(data: PhoneData): string {
  return `tel:${data.number}`;
}

export function encodeSMS(data: SMSData): string {
  const message = data.message ?? "";
  return `smsto:${data.number}:${message}`;
}

export function encodeWiFi(data: WiFiData): string {
  const escaped = (str: string) =>
    str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/"/g, '\\"');

  const hidden = data.hidden ? "true" : "false";
  return `WIFI:T:${data.encryption};S:${escaped(data.ssid)};P:${escaped(data.password)};H:${hidden};;`;
}

/**
 * Normalise the editor's VCardData (which carries both the legacy single-value
 * fields and the newer multi-value arrays) into the canonical builder input.
 */
/** Case- and whitespace-insensitive key used to drop duplicate entries. */
const dedupeKey = (value: string) => value.trim().toLowerCase();

/** Keep the first occurrence of each key, preserving order. */
function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function toVCardInput(data: VCardData): VCardInput {
  // The multi-value arrays and the legacy scalars are merged, then deduped:
  // a record saved before multi-value support may carry both, and emitting the
  // same number twice produces a visibly duplicated contact on the phone.
  const phones = dedupeBy(
    [
      ...(data.phones ?? []),
      ...(data.phone ? [{ number: data.phone, label: "CELL" }] : []),
    ].filter((p) => p.number?.trim()),
    (p) => dedupeKey(p.number),
  );

  const emails = dedupeBy(
    [
      ...(data.emails ?? []),
      ...(data.email ? [{ address: data.email, label: "INTERNET" }] : []),
    ].filter((e) => e.address?.trim()),
    (e) => dedupeKey(e.address),
  );

  const websites = dedupeBy(
    [
      ...(data.websites ?? []),
      ...(data.website ? [data.website] : []),
    ].filter((w) => w?.trim()),
    dedupeKey,
  );

  return {
    firstName: data.firstName,
    lastName: data.lastName,
    organization: data.organization,
    title: data.title,
    phones,
    emails,
    websites,
    address: {
      street: data.street,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
    },
    note: data.note,
    socialLinks: data.socialLinks ?? [],
    photo: parsePhotoDataUrl(data.photoDataUrl),
  };
}

const PHOTO_DATA_URL_RE = /^data:image\/(jpeg|jpg|png);base64,(.+)$/i;

/** Split a `data:image/jpeg;base64,...` URL into the builder's photo shape. */
export function parsePhotoDataUrl(
  dataUrl: string | null | undefined,
): VCardPhoto | null {
  if (!dataUrl) return null;
  const match = dataUrl.trim().match(PHOTO_DATA_URL_RE);
  if (!match) return null;
  return {
    type: match[1].toLowerCase() === "png" ? "PNG" : "JPEG",
    base64: match[2],
  };
}

/**
 * Encode a vCard for embedding directly in a QR code.
 *
 * The photo is deliberately excluded — see VCardData.photoDataUrl. REV is
 * omitted too so the same contact always produces the same QR payload rather
 * than a new one on every keystroke.
 */
export function encodeVCard(data: VCardData): string {
  return buildVCard(toVCardInput(data), {
    includePhoto: false,
    includeRev: false,
  });
}

export function encodeGeo(data: GeoData): string {
  return `geo:${data.latitude},${data.longitude}`;
}

function formatDateToICal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function encodeEvent(data: EventData): string {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `SUMMARY:${data.title}`,
    `DTSTART:${formatDateToICal(data.startDate)}`,
  ];

  if (data.endDate) {
    lines.push(`DTEND:${formatDateToICal(data.endDate)}`);
  }
  if (data.location) {
    lines.push(`LOCATION:${data.location}`);
  }
  if (data.description) {
    lines.push(`DESCRIPTION:${data.description}`);
  }

  lines.push("END:VEVENT");
  return lines.join("\n");
}

export function encodeQRData(qrData: QRData): string {
  switch (qrData.type) {
    case "url":
      return encodeURL(qrData.data);
    case "text":
      return encodeText(qrData.data);
    case "email":
      return encodeEmail(qrData.data);
    case "phone":
      return encodePhone(qrData.data);
    case "sms":
      return encodeSMS(qrData.data);
    case "wifi":
      return encodeWiFi(qrData.data);
    case "vcard":
      return encodeVCard(qrData.data);
    case "geo":
      return encodeGeo(qrData.data);
    case "event":
      return encodeEvent(qrData.data);
    default: {
      const _exhaustive: never = qrData;
      throw new Error(`Unknown QR data type: ${(_exhaustive as QRData).type}`);
    }
  }
}
