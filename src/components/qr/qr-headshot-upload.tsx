"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQREditorStore } from "@/stores/qr-editor-store";

/** Longest edge of the stored headshot, in pixels. */
const MAX_EDGE = 480;
/** Target size of the encoded JPEG. Contacts apps render these small. */
const TARGET_BYTES = 60_000;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Downscale and re-encode an image to a JPEG data URL.
 *
 * Quality steps down until the result fits TARGET_BYTES. The photo is embedded
 * in every .vcf we serve, so keeping it small keeps the contact download fast.
 */
async function toCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image for upload.");

  // JPEG has no alpha; without this, transparent PNGs come out black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.6, 0.5, 0.4]) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const bytes = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
    if (bytes <= TARGET_BYTES) return dataUrl;
  }
  return canvas.toDataURL("image/jpeg", 0.4);
}

export function QRHeadshotUpload() {
  const inputData = useQREditorStore((s) => s.inputData);
  const setInputData = useQREditorStore((s) => s.setInputData);
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photo =
    typeof inputData.photoDataUrl === "string" ? inputData.photoDataUrl : "";

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setError(null);

      if (!ACCEPTED.includes(file.type)) {
        setError("Use a JPG, PNG, or WebP image.");
        return;
      }

      setBusy(true);
      try {
        const dataUrl = await toCompressedDataUrl(file);
        // A photo only reaches the scanner through the hosted .vcf, so turn
        // that on rather than silently storing a photo that never appears.
        setInputData({ photoDataUrl: dataUrl, hostedContact: true });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not read that image.",
        );
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [setInputData],
  );

  const clear = useCallback(() => {
    setInputData({ photoDataUrl: "" });
    setError(null);
  }, [setInputData]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="headshot">Headshot</Label>
        <span className="text-xs text-muted-foreground">Optional</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border bg-muted">
          {photo ? (
            <Image
              src={photo}
              alt="Contact headshot preview"
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImagePlus
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Processing…
                </>
              ) : (
                <>
                  <ImagePlus className="size-4" aria-hidden="true" />
                  {photo ? "Replace photo" : "Add photo"}
                </>
              )}
            </Button>
            {photo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                aria-label="Remove headshot"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Resized to {MAX_EDGE}px and embedded in the contact file people
            download when they scan.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        id="headshot"
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
