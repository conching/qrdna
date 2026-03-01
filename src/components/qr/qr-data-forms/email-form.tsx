"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailForm() {
  const { inputData, setInputData } = useQREditorStore();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Email Address</Label>
        <Input
          id="address"
          type="email"
          placeholder="recipient@example.com"
          value={(inputData.address as string) ?? ""}
          onChange={(e) => setInputData({ address: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="Email subject"
          value={(inputData.subject as string) ?? ""}
          onChange={(e) => setInputData({ subject: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          placeholder="Email body..."
          value={(inputData.body as string) ?? ""}
          onChange={(e) => setInputData({ body: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}
