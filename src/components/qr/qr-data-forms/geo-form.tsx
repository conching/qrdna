"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GeoForm() {
  const { inputData, setInputData } = useQREditorStore();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="37.7749"
            value={(inputData.latitude as string) ?? ""}
            onChange={(e) =>
              setInputData({
                latitude: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="-122.4194"
            value={(inputData.longitude as string) ?? ""}
            onChange={(e) =>
              setInputData({
                longitude: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
