/**
 * Lightweight user-agent parser using simple regex patterns.
 * No external dependencies.
 */

export interface ParsedUA {
  /** "mobile" | "tablet" | "desktop" */
  device_type: string;
  /** Operating system name, e.g. "iOS", "Android", "Windows", "macOS", "Linux" */
  os: string;
  /** Browser name, e.g. "Chrome", "Safari", "Firefox", "Edge" */
  browser: string;
}

// ---------------------------------------------------------------------------
// Device type detection
// ---------------------------------------------------------------------------

const MOBILE_RE =
  /Mobile|iP(hone|od)|Android.*Mobile|BB10|BlackBerry|webOS|Opera M(obi|ini)/i;
const TABLET_RE = /iPad|Android(?!.*Mobile)|Tablet|Silk|Kindle|PlayBook/i;

function detectDevice(ua: string): string {
  if (TABLET_RE.test(ua)) return "tablet";
  if (MOBILE_RE.test(ua)) return "mobile";
  return "desktop";
}

// ---------------------------------------------------------------------------
// OS detection
// ---------------------------------------------------------------------------

function detectOS(ua: string): string {
  // Order matters: check more specific patterns first
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/CrOS/.test(ua)) return "Chrome OS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  if (/Ubuntu/.test(ua)) return "Ubuntu";
  if (/FreeBSD/.test(ua)) return "FreeBSD";
  return "Unknown";
}

// ---------------------------------------------------------------------------
// Browser detection
// ---------------------------------------------------------------------------

function detectBrowser(ua: string): string {
  // Order matters: many browsers include "Chrome" or "Safari" in their UA,
  // so check for more specific ones first.
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/UCBrowser|UCWEB/i.test(ua)) return "UC Browser";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  if (/Edg(e|A|iOS)?\//.test(ua)) return "Edge";
  if (/Vivaldi/i.test(ua)) return "Vivaldi";
  if (/Brave/i.test(ua)) return "Brave";
  if (/YaBrowser/i.test(ua)) return "Yandex";
  if (/Firefox|FxiOS/i.test(ua)) return "Firefox";
  if (/CriOS/.test(ua)) return "Chrome"; // Chrome on iOS
  if (/Chrome/.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Chromium/.test(ua)) return "Chromium";
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/MSIE|Trident/.test(ua)) return "Internet Explorer";
  return "Unknown";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a user-agent string into device type, OS, and browser.
 * Returns sensible "Unknown" defaults when no match is found.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedUA {
  if (!ua) {
    return { device_type: "desktop", os: "Unknown", browser: "Unknown" };
  }

  return {
    device_type: detectDevice(ua),
    os: detectOS(ua),
    browser: detectBrowser(ua),
  };
}
