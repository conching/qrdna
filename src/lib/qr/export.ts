import type QRCodeStyling from "qr-code-styling";

export type ExportFormat = "png" | "jpeg" | "webp" | "svg";

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
  }
}

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

export async function exportQR(
  qr: QRCodeStyling,
  format: ExportFormat,
  options?: { size?: number; quality?: number },
): Promise<Blob> {
  const quality = options?.quality ?? 0.92;

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
