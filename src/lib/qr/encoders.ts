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

export function encodeVCard(data: VCardData): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${data.lastName};${data.firstName};;;`,
    `FN:${data.firstName} ${data.lastName}`,
  ];

  if (data.organization) {
    lines.push(`ORG:${data.organization}`);
  }
  if (data.title) {
    lines.push(`TITLE:${data.title}`);
  }
  if (data.phone) {
    lines.push(`TEL;TYPE=CELL:${data.phone}`);
  }
  if (data.email) {
    lines.push(`EMAIL:${data.email}`);
  }
  if (data.website) {
    lines.push(`URL:${data.website}`);
  }
  if (data.street || data.city || data.state || data.zip || data.country) {
    const adr = [
      "", // PO Box
      "", // Extended address
      data.street ?? "",
      data.city ?? "",
      data.state ?? "",
      data.zip ?? "",
      data.country ?? "",
    ].join(";");
    lines.push(`ADR;TYPE=WORK:${adr}`);
  }
  if (data.note) {
    lines.push(`NOTE:${data.note}`);
  }

  lines.push("END:VCARD");
  return lines.join("\n");
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
