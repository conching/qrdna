"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Label } from "@/components/ui/label";

export function TextForm() {
  const { inputData, setInputData } = useQREditorStore();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text">Text</Label>
        <textarea
          id="text"
          placeholder="Enter your text..."
          value={(inputData.text as string) ?? ""}
          onChange={(e) => setInputData({ text: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}
