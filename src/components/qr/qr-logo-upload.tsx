"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { MAX_LOGO_SIZE, SUPPORTED_LOGO_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (
    !SUPPORTED_LOGO_TYPES.includes(
      file.type as (typeof SUPPORTED_LOGO_TYPES)[number],
    )
  ) {
    return `Unsupported file type "${file.type}". Use PNG, JPG, or SVG.`;
  }
  if (file.size > MAX_LOGO_SIZE) {
    return `File is too large (${formatBytes(file.size)}). Maximum is 2 MB.`;
  }
  return null;
}

export function QRLogoUpload() {
  const { logoFile, setLogoFile, style, setStyle } = useQREditorStore();

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Manage object URL lifecycle
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [logoFile]);

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setLogoFile(file);
    },
    [setLogoFile],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  const removeLogo = useCallback(() => {
    setLogoFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [setLogoFile]);

  // --- Logo loaded state ---
  if (logoFile && previewUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
            <img
              src={previewUrl}
              alt="Logo preview"
              className="size-full object-contain"
            />
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{logoFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(logoFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={removeLogo}
            aria-label="Remove logo"
          >
            <X />
          </Button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">
              Logo Size ({Math.round(style.logoSize * 100)}%)
            </Label>
          </div>
          <Slider
            min={0.1}
            max={0.5}
            step={0.05}
            value={[style.logoSize]}
            onValueChange={([val]) => setStyle({ logoSize: val })}
          />
        </div>
      </div>
    );
  }

  // --- Empty / upload state ---
  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Drop logo here or click to upload</p>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, SVG (max 2MB)
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload logo file"
      />
    </div>
  );
}
