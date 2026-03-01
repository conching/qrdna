"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SMSForm() {
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
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          placeholder="Enter your message..."
          value={(inputData.message as string) ?? ""}
          onChange={(e) => setInputData({ message: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}
