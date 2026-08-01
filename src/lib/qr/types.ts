export type QRContentType =
  | "url" | "text" | "email" | "phone" | "sms"
  | "wifi" | "vcard" | "geo" | "event" | "app_store";

export type DotStyle = "square" | "rounded" | "dots" | "extra-rounded" | "classy" | "classy-rounded";
export type CornerSquareStyle = "square" | "dot" | "extra-rounded";
export type CornerDotStyle = "square" | "dot";
export type GradientType = "linear" | "radial";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QRGradient {
  type: GradientType;
  rotation?: number;
  colorStops: Array<{ offset: number; color: string }>;
}

export interface QRFrameConfig {
  text: string;
  color: string;
  bgColor: string;
  style: "rounded" | "square";
}

export interface QRStyleConfig {
  dotStyle: DotStyle;
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
  fgColor: string;
  bgColor: string;
  gradient?: QRGradient | null;
  logoUrl?: string | null;
  logoSize: number;
  errorCorrection: ErrorCorrectionLevel;
  frame?: QRFrameConfig | null;
}

// Input data types for each QR content type
export interface URLData { url: string }
export interface TextData { text: string }
export interface EmailData { address: string; subject?: string; body?: string }
export interface PhoneData { number: string }
export interface SMSData { number: string; message?: string }
export interface WiFiData { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass"; hidden?: boolean }
export interface VCardPhoneEntry { number: string; label?: string }
export interface VCardEmailEntry { address: string; label?: string }

export interface VCardData {
  firstName: string; lastName: string; organization?: string;
  title?: string;
  /** @deprecated single-value legacy fields, kept so saved records still render */
  phone?: string; email?: string; website?: string;
  /** Multi-value replacements for phone/email/website. */
  phones?: VCardPhoneEntry[];
  emails?: VCardEmailEntry[];
  websites?: string[];
  socialLinks?: Array<{ platform: string; url: string }>;
  street?: string; city?: string; state?: string; zip?: string; country?: string; note?: string;
  /**
   * Headshot as a `data:image/jpeg;base64,...` URL, resized client-side.
   *
   * Never encoded into the QR itself — a QR holds at most 2953 bytes and a
   * usable headshot is 10–30 KB. It is stored alongside the code and served by
   * the hosted .vcf endpoint, which is what actually puts the photo into the
   * scanner's contacts app.
   */
  photoDataUrl?: string | null;
  /**
   * When true the QR encodes a link to the hosted .vcf instead of the raw
   * vCard text, so the contact arrives with its photo. Requires a saved code.
   */
  hostedContact?: boolean;
}
export interface GeoData { latitude: number; longitude: number }
export interface EventData { title: string; location?: string; startDate: string; endDate?: string; description?: string }

export type QRData =
  | { type: "url"; data: URLData }
  | { type: "text"; data: TextData }
  | { type: "email"; data: EmailData }
  | { type: "phone"; data: PhoneData }
  | { type: "sms"; data: SMSData }
  | { type: "wifi"; data: WiFiData }
  | { type: "vcard"; data: VCardData }
  | { type: "geo"; data: GeoData }
  | { type: "event"; data: EventData };

export const DEFAULT_STYLE: QRStyleConfig = {
  dotStyle: "square",
  cornerSquareStyle: "square",
  cornerDotStyle: "square",
  fgColor: "#000000",
  bgColor: "#ffffff",
  gradient: null,
  logoUrl: null,
  logoSize: 0.25,
  errorCorrection: "M",
  frame: null,
};
