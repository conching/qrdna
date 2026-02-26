"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success("Welcome to Pro! Your account has been upgraded.");
    }
  }, [searchParams]);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/v1/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Billing section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Billing</h2>
        <div className="mt-4 rounded-xl border p-6">
          {user?.isPro ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold">QR DNA Pro</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  You have access to all Pro features.
                </p>
                <ul className="mt-3 space-y-1">
                  {[
                    "Unlimited dynamic QR codes",
                    "Unlimited business cards",
                    "Full analytics",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={openPortal}
                disabled={portalLoading}
                className="gap-2 shrink-0"
              >
                <CreditCard className="h-4 w-4" />
                {portalLoading ? "Loading…" : "Manage billing"}
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Free plan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unlimited static QR codes. Upgrade for dynamic QR, business cards, and analytics.
                </p>
              </div>
              <Button
                onClick={() => setUpgradeOpen(true)}
                className="shrink-0 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </div>
      </section>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName="Pro features"
      />
    </div>
  );
}
