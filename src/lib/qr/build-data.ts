import type { QRContentType, QRData, VCardData } from "./types";
import type { QRInputValue } from "@/stores/qr-editor-store";
import { contactUrl } from "@/lib/constants";

export type QRInputMap = Record<string, QRInputValue>;

const str = (v: QRInputValue | undefined): string =>
  typeof v === "string" ? v : "";

const bool = (v: QRInputValue | undefined): boolean => v === true;

function objArray(v: QRInputValue | undefined): Array<Record<string, string>> {
  return Array.isArray(v) && typeof v[0] !== "string"
    ? (v as Array<Record<string, string>>)
    : [];
}

function strArray(v: QRInputValue | undefined): string[] {
  return Array.isArray(v) && (v.length === 0 || typeof v[0] === "string")
    ? (v as string[])
    : [];
}

/** Pull the vCard shape out of the editor's loose input map. */
export function toVCardData(input: QRInputMap): VCardData {
  return {
    firstName: str(input.firstName),
    lastName: str(input.lastName),
    organization: str(input.organization),
    title: str(input.title),
    phone: str(input.phone),
    email: str(input.email),
    website: str(input.website),
    phones: objArray(input.phones)
      .filter((p) => p.number?.trim())
      .map((p) => ({ number: p.number, label: p.label })),
    emails: objArray(input.emails)
      .filter((e) => e.address?.trim())
      .map((e) => ({ address: e.address, label: e.label })),
    websites: strArray(input.websites).filter((w) => w?.trim()),
    socialLinks: objArray(input.socialLinks)
      .filter((s) => s.url?.trim() && s.platform?.trim())
      .map((s) => ({ platform: s.platform, url: s.url })),
    street: str(input.street),
    city: str(input.city),
    state: str(input.state),
    zip: str(input.zip),
    country: str(input.country),
    note: str(input.note),
    photoDataUrl: str(input.photoDataUrl) || null,
    hostedContact: bool(input.hostedContact),
  };
}

/**
 * Turn the editor state into the tagged QRData union the encoders accept.
 * Returns null when there is not yet enough input to render a code.
 *
 * `shortCode` is only used by hosted contact cards: when a vCard has a photo,
 * the QR encodes a link to the .vcf rather than the contact text, because a
 * photo cannot fit inside a QR code. Before the code is saved there is no short
 * code yet, so a placeholder of the right length keeps the preview honest about
 * the size the final code will be.
 */
export function buildQRData(
  contentType: QRContentType,
  input: QRInputMap,
  shortCode?: string | null,
): QRData | null {
  switch (contentType) {
    case "url":
    case "app_store": {
      const url = str(input.url);
      if (!url.trim()) return null;
      return { type: "url", data: { url } };
    }
    case "text": {
      const text = str(input.text);
      if (!text.trim()) return null;
      return { type: "text", data: { text } };
    }
    case "email": {
      const address = str(input.address);
      if (!address.trim()) return null;
      return {
        type: "email",
        data: {
          address,
          subject: str(input.subject),
          body: str(input.body),
        },
      };
    }
    case "phone": {
      const number = str(input.number);
      if (!number.trim()) return null;
      return { type: "phone", data: { number } };
    }
    case "sms": {
      const number = str(input.number);
      if (!number.trim()) return null;
      return {
        type: "sms",
        data: { number, message: str(input.message) },
      };
    }
    case "wifi": {
      const ssid = str(input.ssid);
      if (!ssid.trim()) return null;
      return {
        type: "wifi",
        data: {
          ssid,
          password: str(input.password),
          encryption: (str(input.encryption) || "WPA") as
            | "WPA"
            | "WEP"
            | "nopass",
          hidden: bool(input.hidden),
        },
      };
    }
    case "vcard": {
      const data = toVCardData(input);
      if (!data.firstName?.trim() && !data.lastName?.trim()) return null;

      if (data.hostedContact) {
        // PLACEHOLDER_CODE is exactly SHORT_CODE_LENGTH characters, so the
        // preview renders at the same QR version the saved code will use.
        return {
          type: "url",
          data: { url: contactUrl(shortCode || PLACEHOLDER_CODE) },
        };
      }
      return { type: "vcard", data };
    }
    case "geo": {
      const latitude = Number(input.latitude) || 0;
      const longitude = Number(input.longitude) || 0;
      if (latitude === 0 && longitude === 0) return null;
      return { type: "geo", data: { latitude, longitude } };
    }
    case "event": {
      const title = str(input.title);
      const startDate = str(input.startDate);
      if (!title.trim() || !startDate.trim()) return null;
      return {
        type: "event",
        data: {
          title,
          location: str(input.location),
          startDate,
          endDate: str(input.endDate),
          description: str(input.description),
        },
      };
    }
    default:
      return null;
  }
}

/** Stand-in short code used for previewing an unsaved hosted contact. */
export const PLACEHOLDER_CODE = "0000000";
