import type QRCodeStyling from "qr-code-styling";

export type ExportFormat = "png" | "jpeg" | "webp" | "svg" | "pdf";

export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case "png":
      return "png";
    case "jpeg":
      return "jpg";
    case "webp":
      return "webp";
    case "svg":
      return "svg";
    case "pdf":
      return "pdf";
  }
}

export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
  }
}

/** Formats that stay sharp at any size — worth calling out in the UI. */
export const VECTOR_FORMATS: ReadonlySet<ExportFormat> = new Set([
  "svg",
  "pdf",
]);

async function convertBlobViaCanvas(
  sourceBlob: Blob,
  mimeType: string,
  quality: number,
  size?: number,
): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(sourceBlob);

  return new Promise<Blob>((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url);

      const width = size ?? img.naturalWidth;
      const height = size ?? img.naturalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas 2d context"));
        return;
      }

      // For JPEG, fill with white background since JPEG doesn't support transparency
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(`Failed to convert to ${mimeType}`));
          }
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for conversion"));
    };

    img.src = url;
  });
}

/**
 * Render the QR into a single-page PDF as real vector art.
 *
 * The QR SVG is copied into the PDF's content stream by svg2pdf rather than
 * rasterised, so the code stays crisp at any print size — which is the only
 * reason to want a PDF of a QR code in the first place.
 *
 * jsPDF and svg2pdf are imported lazily: together they are a few hundred KB and
 * most exports are PNG.
 */
async function exportPDF(
  qr: QRCodeStyling,
  sizeMm: number,
  marginMm: number,
): Promise<Blob> {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([
    import("jspdf"),
    import("svg2pdf.js"),
  ]);

  const rawSvg = await qr.getRawData("svg");
  if (!rawSvg) throw new Error("Failed to generate SVG data for the PDF");

  const svgText = await (rawSvg as Blob).text();
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svgEl = parsed.documentElement as unknown as SVGSVGElement;

  if (parsed.querySelector("parsererror")) {
    throw new Error("Could not read the QR code SVG");
  }

  const page = sizeMm + marginMm * 2;
  const doc = new jsPDF({
    unit: "mm",
    // Square page sized to the code — a QR on A4 with acres of white space is
    // a nuisance to place in a layout.
    format: [page, page],
    orientation: "portrait",
    compress: true,
  });

  // svg2pdf measures the element, so it has to be laid out. Keep it out of
  // view rather than display:none, which would give it zero dimensions.
  const holder = document.createElement("div");
  holder.style.cssText =
    "position:fixed;left:-10000px;top:0;width:0;height:0;overflow:hidden";
  holder.appendChild(svgEl);
  document.body.appendChild(holder);

  try {
    await svg2pdf(svgEl, doc, {
      x: marginMm,
      y: marginMm,
      width: sizeMm,
      height: sizeMm,
    });
  } finally {
    holder.remove();
  }

  return doc.output("blob");
}

export interface ExportOptions {
  size?: number;
  quality?: number;
  /** PDF only: printed edge length of the code in millimetres. */
  pdfSizeMm?: number;
  /** PDF only: white margin around the code in millimetres (quiet zone). */
  pdfMarginMm?: number;
}

export async function exportQR(
  qr: QRCodeStyling,
  format: ExportFormat,
  options?: ExportOptions,
): Promise<Blob> {
  const quality = options?.quality ?? 0.92;

  if (format === "pdf") {
    return exportPDF(
      qr,
      options?.pdfSizeMm ?? 40,
      options?.pdfMarginMm ?? 6,
    );
  }

  if (format === "svg") {
    const raw = await qr.getRawData("svg");
    if (!raw) {
      throw new Error("Failed to generate SVG data");
    }
    // getRawData returns Blob in browser, Buffer in Node — we only run in browser
    return raw as Blob;
  }

  if (format === "png") {
    const raw = await qr.getRawData("png");
    if (!raw) {
      throw new Error("Failed to generate PNG data");
    }
    const blob = raw as Blob;
    // If a custom size is requested, re-render through canvas
    if (options?.size) {
      return convertBlobViaCanvas(blob, "image/png", quality, options.size);
    }
    return blob;
  }

  // For JPEG and WebP: get PNG from qr-code-styling, then convert via canvas
  const pngRaw = await qr.getRawData("png");
  if (!pngRaw) {
    throw new Error("Failed to generate PNG data for conversion");
  }
  const pngBlob = pngRaw as Blob;

  const mimeType = getMimeType(format);
  return convertBlobViaCanvas(pngBlob, mimeType, quality, options?.size);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
