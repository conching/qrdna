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

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "svg", label: "SVG" },
];

const SIZE_OPTIONS = [512, 1024, 2048, 4096] as const;

interface QRExportDialogProps {
  qrInstance: QRCodeStyling | null;
}

export function QRExportDialog({ qrInstance }: QRExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [size, setSize] = useState(1024);
  const [quality, setQuality] = useState(0.92);
  const [filename, setFilename] = useState("qrcode");
  const [isExporting, setIsExporting] = useState(false);

  const showQualitySlider = format === "jpeg" || format === "webp";

  const handleExport = useCallback(async () => {
    if (!qrInstance) {
      toast.error("QR code is not ready. Please generate one first.");
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportQR(qrInstance, format, { size, quality });
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
  }, [qrInstance, format, size, quality, filename]);

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
          </div>

          {/* Size */}
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
