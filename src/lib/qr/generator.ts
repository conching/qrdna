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

export function createQRCode(
  data: string,
  style: QRStyleConfig,
  size: number = 300,
): QRCodeStyling {
  const options = buildOptions(data, style, size);
  return new QRCodeStyling(options);
}

export function updateQRCode(
  qr: QRCodeStyling,
  data: string,
  style: QRStyleConfig,
  size: number = 300,
): void {
  const options = buildOptions(data, style, size);
  qr.update(options);
}
