"use client";

import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
};

const BENEFITS = [
  "Unlimited dynamic QR codes (editable destinations)",
  "Unlimited digital business cards",
  "Full analytics: scans, devices, geography",
  "vCard download & link click tracking",
];

export function UpgradeModal({ open, onOpenChange, featureName }: Props) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            <strong>{featureName}</strong> is a Pro feature. Unlock everything
            for $9/mo.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              {b}
            </li>
          ))}
        </ul>

        {/* Interval toggle */}
        <div className="flex rounded-lg border p-1 text-sm">
          <button
            onClick={() => setInterval("month")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 transition-colors",
              interval === "month"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Monthly — $9/mo
          </button>
          <button
            onClick={() => setInterval("year")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 transition-colors",
              interval === "year"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Annual — $90/yr{" "}
            <span className="ml-1 text-xs text-green-500">2 months free</span>
          </button>
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
