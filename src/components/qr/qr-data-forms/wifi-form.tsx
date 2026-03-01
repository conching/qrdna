"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function WiFiForm() {
  const { inputData, setInputData } = useQREditorStore();

  const encryption = (inputData.encryption as string) || "WPA";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ssid">Network Name (SSID)</Label>
        <Input
          id="ssid"
          placeholder="My Wi-Fi Network"
          value={(inputData.ssid as string) ?? ""}
          onChange={(e) => setInputData({ ssid: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Network password"
          value={(inputData.password as string) ?? ""}
          onChange={(e) => setInputData({ password: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="encryption">Encryption</Label>
        <Select
          value={encryption}
          onValueChange={(value) => setInputData({ encryption: value })}
        >
          <SelectTrigger id="encryption">
            <SelectValue placeholder="Select encryption" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WPA">WPA/WPA2</SelectItem>
            <SelectItem value="WEP">WEP</SelectItem>
            <SelectItem value="nopass">None</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="hidden">Hidden Network</Label>
        <Switch
          id="hidden"
          checked={(inputData.hidden as boolean) ?? false}
          onCheckedChange={(checked) => setInputData({ hidden: checked })}
        />
      </div>
    </div>
  );
}
