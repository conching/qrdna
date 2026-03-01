"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AppStoreForm() {
  const { inputData, setInputData } = useQREditorStore();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">App Store URL</Label>
        <Input
          id="url"
          placeholder="https://apps.apple.com/... or https://play.google.com/..."
          value={(inputData.url as string) ?? ""}
          onChange={(e) => setInputData({ url: e.target.value })}
        />
      </div>
    </div>
  );
}
