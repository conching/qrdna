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
export interface VCardData {
  firstName: string; lastName: string; organization?: string;
  title?: string; phone?: string; email?: string; website?: string;
  street?: string; city?: string; state?: string; zip?: string; country?: string; note?: string;
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
