"use client";

import { useEffect, useRef, useCallback } from "react";
import { QrCode } from "lucide-react";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { useDebounce } from "@/hooks/use-debounce";
import { createQRCode, updateQRCode } from "@/lib/qr/generator";
import { encodeQRData } from "@/lib/qr/encoders";
import { buildQRData } from "@/lib/qr/build-data";
import type { QRStyleConfig } from "@/lib/qr/types";
import type QRCodeStyling from "qr-code-styling";

const QR_SIZE = 280;

function clearContainer(el: HTMLElement) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

interface QRPreviewProps {
  onQRInstanceChange?: (qr: QRCodeStyling | null) => void;
}

export function QRPreview({ onQRInstanceChange }: QRPreviewProps = {}) {
  const contentType = useQREditorStore((s) => s.contentType);
  const inputData = useQREditorStore((s) => s.inputData);
  const style = useQREditorStore((s) => s.style);
  const logoFile = useQREditorStore((s) => s.logoFile);

  const debouncedInputData = useDebounce(inputData, 150);

  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const logoUrlRef = useRef<string | null>(null);
  const appendedRef = useRef(false);

  const revokeLogoUrl = useCallback(() => {
    if (logoUrlRef.current) {
      URL.revokeObjectURL(logoUrlRef.current);
      logoUrlRef.current = null;
    }
  }, []);

  // Handle logoFile -> object URL conversion
  useEffect(() => {
    revokeLogoUrl();
    if (logoFile) {
      logoUrlRef.current = URL.createObjectURL(logoFile);
    }
    return revokeLogoUrl;
  }, [logoFile, revokeLogoUrl]);

  // Create / update the QR code
  useEffect(() => {
    const qrData = buildQRData(contentType, debouncedInputData);
    if (!qrData) {
      if (qrRef.current && containerRef.current) {
        clearContainer(containerRef.current);
        qrRef.current = null;
        appendedRef.current = false;
        onQRInstanceChange?.(null);
      }
      return;
    }

    const encoded = encodeQRData(qrData);
    const effectiveStyle: QRStyleConfig = {
      ...style,
      logoUrl: logoUrlRef.current ?? style.logoUrl ?? null,
    };

    if (!qrRef.current) {
      qrRef.current = createQRCode(encoded, effectiveStyle, QR_SIZE);
      appendedRef.current = false;
      onQRInstanceChange?.(qrRef.current);
    } else {
      updateQRCode(qrRef.current, encoded, effectiveStyle, QR_SIZE);
    }

    if (!appendedRef.current && containerRef.current) {
      clearContainer(containerRef.current);
      qrRef.current.append(containerRef.current);
      appendedRef.current = true;
    }
  }, [contentType, debouncedInputData, style, logoFile]);

  const hasData = buildQRData(contentType, debouncedInputData) !== null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame mockup */}
      <div className="relative rounded-2xl border-2 border-border bg-background p-6 shadow-lg">
        {/* Notch */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />

        {/* QR container */}
        <div
          className="flex items-center justify-center overflow-hidden rounded-xl bg-white"
          style={{ width: QR_SIZE, height: QR_SIZE }}
        >
          {hasData ? (
            <div ref={containerRef} className="flex items-center justify-center" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <QrCode className="size-12 opacity-40" />
              <p className="text-center text-sm">
                Enter content to
                <br />
                generate a QR code
              </p>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-muted" />
      </div>
    </div>
  );
}
