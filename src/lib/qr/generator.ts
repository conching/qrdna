import QRCodeStyling, { type Options } from "qr-code-styling";
import type { QRStyleConfig, QRGradient } from "./types";

function mapGradient(gradient: QRGradient) {
  return {
    type: gradient.type as "linear" | "radial",
    rotation: gradient.rotation ?? 0,
    colorStops: gradient.colorStops.map((stop) => ({
      offset: stop.offset,
      color: stop.color,
    })),
  };
}

function buildOptions(data: string, style: QRStyleConfig, size: number): Options {
  const errorCorrection = style.logoUrl ? "H" : style.errorCorrection;

  const dotsOptions: Options["dotsOptions"] = {
    type: style.dotStyle,
    color: style.fgColor,
  };

  if (style.gradient) {
    dotsOptions.gradient = mapGradient(style.gradient);
  }

  const options: Options = {
    width: size,
    height: size,
    data,
    type: "svg",
    dotsOptions,
    cornersSquareOptions: {
      type: style.cornerSquareStyle,
      color: style.fgColor,
    },
    cornersDotOptions: {
      type: style.cornerDotStyle,
      color: style.fgColor,
    },
    backgroundOptions: {
      color: style.bgColor,
    },
    qrOptions: {
      errorCorrectionLevel: errorCorrection,
    },
  };

  if (style.logoUrl) {
    options.image = style.logoUrl;
    options.imageOptions = {
      crossOrigin: "anonymous",
      margin: 10,
      imageSize: style.logoSize,
    };
  }

  return options;
}

/**
 * Blank modules required around a symbol so a scanner can find its edges.
 * ISO/IEC 18004 §6.3.2.3 requires four. qr-code-styling defaults to none.
 */
const QUIET_ZONE_MODULES = 4;

/** Fallback margin when the module count cannot be read, ~3–5 modules. */
const FALLBACK_MARGIN_RATIO = 0.08;

/**
 * Set the margin to an exact four-module quiet zone.
 *
 * Without this every exported code ships with its symbol flush to the edge of
 * the image. Scanners tolerate that on a white page and fail on a coloured
 * one, or when the code is butted against other print elements — which is
 * exactly what happens on a flyer or a business card.
 *
 * The module count is only knowable after the symbol is encoded, and
 * qr-code-styling does not expose it, hence the internal read and the fallback.
 */
function applyQuietZone(qr: QRCodeStyling, size: number): void {
  const internal = qr as unknown as {
    _qr?: { getModuleCount?: () => number };
    _options?: { margin?: number };
  };

  const modules = internal._qr?.getModuleCount?.() ?? 0;

  const margin =
    modules > 0
      ? Math.floor(size / (modules + QUIET_ZONE_MODULES * 2)) *
        QUIET_ZONE_MODULES
      : Math.round(size * FALLBACK_MARGIN_RATIO);

  // Skip the redraw when the version — and therefore the margin — is unchanged.
  if (internal._options?.margin === margin) return;

  qr.update({ margin });
}

export function createQRCode(
  data: string,
  style: QRStyleConfig,
  size: number = 300,
): QRCodeStyling {
  const options = buildOptions(data, style, size);
  const qr = new QRCodeStyling(options);
  applyQuietZone(qr, size);
  return qr;
}

export function updateQRCode(
  qr: QRCodeStyling,
  data: string,
  style: QRStyleConfig,
  size: number = 300,
): void {
  const options = buildOptions(data, style, size);
  qr.update(options);
  applyQuietZone(qr, size);
}
