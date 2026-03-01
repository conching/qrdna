"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PhoneForm() {
  const { inputData, setInputData } = useQREditorStore();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="number">Phone Number</Label>
        <Input
          id="number"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={(inputData.number as string) ?? ""}
          onChange={(e) => setInputData({ number: e.target.value })}
        />
      </div>
    </div>
  );
}
