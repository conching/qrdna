"use client";

import { useCallback, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type QRCodeStyling from "qr-code-styling";
import {
  type ExportFormat,
  exportQR,
  downloadBlob,
  getFileExtension,
  VECTOR_FORMATS,
} from "@/lib/qr/export";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: "png", label: "PNG", hint: "Best for screens and slide decks" },
  { value: "pdf", label: "PDF", hint: "Vector — best for print and handoff" },
  { value: "svg", label: "SVG", hint: "Vector — best for design tools" },
  { value: "jpeg", label: "JPEG", hint: "Smaller file, no transparency" },
  { value: "webp", label: "WebP", hint: "Smaller file, for the web" },
];

const SIZE_OPTIONS = [512, 1024, 2048, 4096] as const;

/** Common printed sizes for a QR code, in millimetres. */
const PDF_SIZE_OPTIONS: { value: number; label: string }[] = [
  { value: 20, label: "20 mm — business card" },
  { value: 40, label: "40 mm — flyer / menu" },
  { value: 80, label: "80 mm — poster" },
  { value: 150, label: "150 mm — signage" },
];

interface QRExportDialogProps {
  qrInstance: QRCodeStyling | null;
}

export function QRExportDialog({ qrInstance }: QRExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [size, setSize] = useState(1024);
  const [pdfSizeMm, setPdfSizeMm] = useState(40);
  const [quality, setQuality] = useState(0.92);
  const [filename, setFilename] = useState("qrcode");
  const [isExporting, setIsExporting] = useState(false);

  const showQualitySlider = format === "jpeg" || format === "webp";
  const isVector = VECTOR_FORMATS.has(format);
  const activeHint = FORMAT_OPTIONS.find((o) => o.value === format)?.hint;

  const handleExport = useCallback(async () => {
    if (!qrInstance) {
      toast.error("QR code is not ready. Please generate one first.");
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportQR(qrInstance, format, {
        size,
        quality,
        pdfSizeMm,
      });
      const ext = getFileExtension(format);
      downloadBlob(blob, `${filename}.${ext}`);
      toast.success(`QR code exported as ${ext.toUpperCase()}`);
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export QR code",
      );
    } finally {
      setIsExporting(false);
    }
  }, [qrInstance, format, size, quality, pdfSizeMm, filename]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Download />
          Export
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Format */}
          <div className="space-y-1.5">
            <Label htmlFor="export-format">Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              <SelectTrigger id="export-format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeHint && (
              <p className="text-xs text-muted-foreground">{activeHint}</p>
            )}
          </div>

          {/* Size — pixels for raster, printed millimetres for PDF.
              SVG needs neither: it scales without loss. */}
          {format === "pdf" ? (
            <div className="space-y-1.5">
              <Label htmlFor="export-pdf-size">Printed size</Label>
              <Select
                value={String(pdfSizeMm)}
                onValueChange={(v) => setPdfSizeMm(Number(v))}
              >
                <SelectTrigger id="export-pdf-size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PDF_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The page is sized to the code with a 6&nbsp;mm quiet zone, so it
                drops straight into a layout.
              </p>
            </div>
          ) : !isVector ? (
            <div className="space-y-1.5">
              <Label htmlFor="export-size">Size</Label>
              <Select
                value={String(size)}
                onValueChange={(v) => setSize(Number(v))}
              >
                <SelectTrigger id="export-size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} x {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Quality (jpeg/webp only) */}
          {showQualitySlider && (
            <div className="space-y-1.5">
              <Label>Quality ({Math.round(quality * 100)}%)</Label>
              <Slider
                min={0.5}
                max={1}
                step={0.01}
                value={[quality]}
                onValueChange={([val]) => setQuality(val)}
              />
            </div>
          )}

          {/* Filename */}
          <div className="space-y-1.5">
            <Label htmlFor="export-filename">Filename</Label>
            <Input
              id="export-filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="qrcode"
            />
          </div>

          {/* Download button */}
          <Button
            className="w-full"
            onClick={handleExport}
            disabled={isExporting || !qrInstance}
          >
            {isExporting ? (
              <>
                <Loader2 className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download />
                Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
