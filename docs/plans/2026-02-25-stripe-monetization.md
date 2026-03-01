# Stripe Monetization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe billing with Free/Pro ($9/mo or $90/yr) tiers, gate dynamic QR codes, business cards, and analytics behind Pro, and build the upgrade UX (Pro badges + inline modal).

**Architecture:** Stripe Checkout handles payment collection. A webhook handler (`POST /api/v1/stripe/webhook`) updates `profiles.tier` in Supabase. A `requirePro()` server helper gates API routes. Client-side gating uses a `useUser()` hook that reads tier from the Supabase session profile.

**Tech Stack:** `stripe` npm SDK, Vitest (already installed), Next.js App Router API routes, Supabase service client, shadcn/ui Dialog for upgrade modal.

---

## Pre-Implementation: Manual Stripe Dashboard Steps

> Do these in the Stripe Dashboard BEFORE running any code.

1. Go to https://dashboard.stripe.com/products and click **"Add product"**
2. Name it **"QR DNA Pro"**
3. Add two prices:
   - **Monthly:** $9.00 / month, recurring → copy the `price_...` ID → `STRIPE_PRO_MONTHLY_PRICE_ID`
   - **Annual:** $90.00 / year, recurring → copy the `price_...` ID → `STRIPE_PRO_ANNUAL_PRICE_ID`
4. Go to **Settings → Billing → Customer portal** → enable it, allow cancellations and plan switching
5. Go to **Developers → API keys** → copy Secret Key (`sk_...`) and Publishable Key (`pk_...`)
6. Go to **Developers → Webhooks** → Add endpoint:
   - URL: `https://your-vercel-domain.vercel.app/api/v1/stripe/webhook` (use Stripe CLI for local dev)
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret (`whsec_...`)

---

### Task 1: Install Stripe SDK + Configure Vitest + Add Env Vars

**Files:**
- Modify: `package.json` (via npm install)
- Create: `vitest.config.ts`
- Modify: `.env.local.example`
- Modify: `.env.local`

**Step 1: Install stripe**

```bash
cd qrlab
npm install stripe
```

Expected: `stripe` appears in `package.json` dependencies.

**Step 2: Create vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Add env vars to .env.local.example**

Append to `.env.local.example`:

```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Step 5: Add real values to .env.local**

Add the actual keys from the Stripe Dashboard to `.env.local`.

**Step 6: Verify vitest runs**

```bash
npm test
```

Expected: `No test files found` (zero failures — config is valid).

**Step 7: Commit**

```bash
git add vitest.config.ts package.json package-lock.json .env.local.example
git commit -m "chore: install stripe, configure vitest"
```

---

### Task 2: Stripe Client + Tier Utilities

**Files:**
- Create: `src/lib/stripe/client.ts`
- Create: `src/lib/stripe/tier.ts`
- Create: `src/lib/stripe/__tests__/tier.test.ts`

**Step 1: Write failing tests**

Create `src/lib/stripe/__tests__/tier.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isPro, tierFromStripeStatus } from "../tier";

describe("isPro", () => {
  it("returns false for free tier", () => {
    expect(isPro("free")).toBe(false);
  });

  it("returns true for pro tier", () => {
    expect(isPro("pro")).toBe(true);
  });

  it("returns true for team tier", () => {
    expect(isPro("team")).toBe(true);
  });

  it("returns false for null", () => {
    expect(isPro(null)).toBe(false);
  });
});

describe("tierFromStripeStatus", () => {
  it("returns pro for active subscription", () => {
    expect(tierFromStripeStatus("active")).toBe("pro");
  });

  it("returns pro for trialing subscription", () => {
    expect(tierFromStripeStatus("trialing")).toBe("pro");
  });

  it("returns free for canceled subscription", () => {
    expect(tierFromStripeStatus("canceled")).toBe("free");
  });

  it("returns free for past_due subscription", () => {
    expect(tierFromStripeStatus("past_due")).toBe("free");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../tier'`

**Step 3: Create stripe client**

Create `src/lib/stripe/client.ts`:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});
```

**Step 4: Create tier utilities**

Create `src/lib/stripe/tier.ts`:

```ts
export type Tier = "free" | "pro" | "team";

/**
 * Returns true if a tier grants Pro-level access.
 * Both "pro" and "team" tiers are treated as Pro.
 */
export function isPro(tier: string | null | undefined): boolean {
  return tier === "pro" || tier === "team";
}

/**
 * Maps a Stripe subscription status to an app tier.
 */
export function tierFromStripeStatus(
  status: string
): Tier {
  if (status === "active" || status === "trialing") return "pro";
  return "free";
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — 7 tests pass.

**Step 6: Commit**

```bash
git add src/lib/stripe/ src/lib/stripe/__tests__/
git commit -m "feat: stripe client and tier utilities"
```

---

### Task 3: requirePro Server Helper

**Files:**
- Modify: `src/lib/stripe/tier.ts`
- Create: `src/lib/stripe/__tests__/require-pro.test.ts`

The `requirePro` function fetches the user's tier from Supabase and returns a 403 response if they are not Pro. It's used directly in API route handlers.

**Step 1: Write failing test**

Create `src/lib/stripe/__tests__/require-pro.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { buildRequireProResponse } from "../tier";

describe("buildRequireProResponse", () => {
  it("returns null when user is pro", () => {
    expect(buildRequireProResponse("pro")).toBeNull();
  });

  it("returns null when user is team", () => {
    expect(buildRequireProResponse("team")).toBeNull();
  });

  it("returns a Response with 403 when user is free", () => {
    const result = buildRequireProResponse("free");
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });
});
```

**Step 2: Run to verify it fails**

```bash
npm test
```

Expected: FAIL — `buildRequireProResponse is not exported`

**Step 3: Add `buildRequireProResponse` to tier.ts**

Append to `src/lib/stripe/tier.ts`:

```ts
import { apiError } from "@/lib/api/errors";

/**
 * Returns a 403 Response if the tier is not Pro, otherwise null.
 * Usage in API routes:
 *   const block = buildRequireProResponse(tier);
 *   if (block) return block;
 */
export function buildRequireProResponse(tier: string | null | undefined): Response | null {
  if (isPro(tier)) return null;
  return apiError(403, "Pro subscription required", "UPGRADE_REQUIRED");
}
```

**Step 4: Create a server-side `requirePro` helper that fetches from DB**

Append to `src/lib/stripe/tier.ts`:

```ts
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side helper for API routes.
 * Fetches the current user's tier from the DB and returns a 403 Response
 * if they are not Pro. Returns null if Pro (caller should continue).
 *
 * Usage:
 *   const block = await requirePro();
 *   if (block) return block;
 */
export async function requirePro(): Promise<Response | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiError(401, "Authentication required", "UNAUTHORIZED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  return buildRequireProResponse(profile?.tier ?? "free");
}
```

**Step 5: Run tests**

```bash
npm test
```

Expected: PASS — all tests pass.

**Step 6: Commit**

```bash
git add src/lib/stripe/tier.ts src/lib/stripe/__tests__/require-pro.test.ts
git commit -m "feat: requirePro server helper"
```

---

### Task 4: Webhook Handler

**Files:**
- Create: `src/app/api/v1/stripe/webhook/route.ts`

**Step 1: Create the webhook route**

Create `src/app/api/v1/stripe/webhook/route.ts`:

```ts
import { stripe } from "@/lib/stripe/client";
import { tierFromStripeStatus } from "@/lib/stripe/tier";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Stripe requires the raw body for signature verification.
// Next.js App Router: we must read the raw Request body.
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return Response.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const customerId = session.customer as string;
      if (!userId) break;
      await supabase
        .from("profiles")
        .update({ tier: "pro", stripe_customer_id: customerId })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const newTier = tierFromStripeStatus(sub.status);
      await supabase
        .from("profiles")
        .update({ tier: newTier })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await supabase
        .from("profiles")
        .update({ tier: "free" })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return Response.json({ received: true });
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/api/v1/stripe/webhook/route.ts
git commit -m "feat: stripe webhook handler"
```

---

### Task 5: Checkout + Portal API Routes

**Files:**
- Create: `src/app/api/v1/stripe/checkout/route.ts`
- Create: `src/app/api/v1/stripe/portal/route.ts`

**Step 1: Create checkout route**

Create `src/app/api/v1/stripe/checkout/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { apiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError(401, "Authentication required", "UNAUTHORIZED");

    const body = (await request.json()) as { interval?: "month" | "year" };
    const priceId =
      body.interval === "year"
        ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      metadata: { user_id: user.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
```

**Step 2: Create portal route**

Create `src/app/api/v1/stripe/portal/route.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { apiError } from "@/lib/api/errors";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError(401, "Authentication required", "UNAUTHORIZED");

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return apiError(400, "No billing account found", "NO_CUSTOMER");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(500, message, "INTERNAL_ERROR");
  }
}
```

**Step 3: Add `NEXT_PUBLIC_APP_URL` to .env.local.example**

Append to `.env.local.example`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add real value to `.env.local`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 5: Commit**

```bash
git add src/app/api/v1/stripe/checkout/route.ts src/app/api/v1/stripe/portal/route.ts .env.local.example
git commit -m "feat: stripe checkout and portal routes"
```

---

### Task 6: Gate Dynamic QR Creation

**Files:**
- Modify: `src/app/api/v1/qr/route.ts`

Dynamic QR codes (`type: "dynamic"`) require Pro. Static QR codes remain free for all authenticated users.

**Step 1: Add `requirePro` check to `POST /api/v1/qr`**

In `src/app/api/v1/qr/route.ts`, after parsing `qrType`, add the gate:

Find this block (around line 32):
```ts
const qrType = body.type ?? "static";
const shortCode = qrType === "dynamic" ? generateShortCode() : null;
```

Replace with:
```ts
const qrType = body.type ?? "static";

// Dynamic QR codes require Pro
if (qrType === "dynamic") {
  const block = await requirePro();
  if (block) return block;
}

const shortCode = qrType === "dynamic" ? generateShortCode() : null;
```

Add import at top of file:
```ts
import { requirePro } from "@/lib/stripe/tier";
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/api/v1/qr/route.ts
git commit -m "feat: gate dynamic QR creation behind Pro"
```

---

### Task 7: Gate Business Cards + Analytics

**Files:**
- Modify: `src/app/api/v1/cards/route.ts`
- Modify: `src/app/api/v1/analytics/route.ts`
- Modify: `src/app/api/v1/qr/[id]/analytics/route.ts`
- Modify: `src/app/api/v1/cards/[id]/analytics/route.ts`

**Step 1: Gate card creation**

In `src/app/api/v1/cards/route.ts`, in the `POST` handler, after the auth check add:

```ts
import { requirePro } from "@/lib/stripe/tier";

// inside POST, after the `if (!user)` check:
const block = await requirePro();
if (block) return block;
```

**Step 2: Gate account analytics**

In `src/app/api/v1/analytics/route.ts`, in the `GET` handler, after the auth check add:

```ts
import { requirePro } from "@/lib/stripe/tier";

// inside GET, after the `if (!user)` check:
const block = await requirePro();
if (block) return block;
```

**Step 3: Gate per-QR analytics**

In `src/app/api/v1/qr/[id]/analytics/route.ts`, in the `GET` handler, after the auth check add the same pattern.

**Step 4: Gate per-card analytics**

In `src/app/api/v1/cards/[id]/analytics/route.ts`, in the `GET` handler, after the auth check add the same pattern.

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 6: Run all tests**

```bash
npm test
```

Expected: all pass.

**Step 7: Commit**

```bash
git add src/app/api/v1/cards/route.ts src/app/api/v1/analytics/route.ts \
  src/app/api/v1/qr/[id]/analytics/route.ts src/app/api/v1/cards/[id]/analytics/route.ts
git commit -m "feat: gate cards and analytics behind Pro"
```

---

### Task 8: useUser Hook

**Files:**
- Create: `src/hooks/use-user.ts`

This hook returns the current user's profile including `tier` and a derived `isPro` boolean. Used by all client components for gating UI.

**Step 1: Create the hook**

Create `src/hooks/use-user.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isPro } from "@/lib/stripe/tier";

export type UserProfile = {
  id: string;
  email: string | undefined;
  display_name: string | null;
  avatar_url: string | null;
  tier: string;
  isPro: boolean;
};

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setUser(null); setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, tier")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        tier: profile?.tier ?? "free",
        isPro: isPro(profile?.tier),
      });
      setLoading(false);
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/hooks/use-user.ts
git commit -m "feat: useUser hook with isPro flag"
```

---

### Task 9: UpgradeModal + ProBadge Components

**Files:**
- Create: `src/components/billing/upgrade-modal.tsx`
- Create: `src/components/billing/pro-badge.tsx`

**Step 1: Create ProBadge**

Create `src/components/billing/pro-badge.tsx`:

```tsx
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-brand-purple/10 px-2 py-0.5 text-xs font-semibold text-brand-purple",
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      Pro
    </span>
  );
}
```

**Step 2: Create UpgradeModal**

Create `src/components/billing/upgrade-modal.tsx`:

```tsx
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
            <Sparkles className="h-5 w-5 text-brand-purple" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            <strong>{featureName}</strong> is a Pro feature. Unlock everything for $9/mo.
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
                ? "bg-brand-purple text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly — $9/mo
          </button>
          <button
            onClick={() => setInterval("year")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 transition-colors",
              interval === "year"
                ? "bg-brand-purple text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual — $90/yr
            <span className="ml-1 text-xs text-green-500">2 months free</span>
          </button>
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-brand-purple hover:bg-brand-purple/90"
        >
          {loading ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors. If `brand-purple` Tailwind class is missing, it resolves as an arbitrary value — that's fine for now.

**Step 4: Commit**

```bash
git add src/components/billing/
git commit -m "feat: UpgradeModal and ProBadge components"
```

---

### Task 10: Settings / Billing Page

**Files:**
- Modify: `src/app/(app)/settings/page.tsx`

Replace the stub with a real billing settings page. Shows current plan, upgrade CTA for free users, and "Manage billing" button for Pro users.

**Step 1: Replace settings page**

Replace the entire contents of `src/app/(app)/settings/page.tsx`:

```tsx
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
                  <Sparkles className="h-5 w-5 text-brand-purple" />
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
                className="shrink-0 gap-2 bg-brand-purple hover:bg-brand-purple/90"
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
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/(app)/settings/page.tsx
git commit -m "feat: settings billing page with upgrade/portal flow"
```

---

### Task 11: Apply Pro Badges to Gated Dashboard Features

**Files:**
- Modify: `src/app/(app)/cards/page.tsx`
- Modify: `src/app/(app)/analytics/page.tsx`

For the cards list page and analytics page, if the user is on the free tier, show an upgrade prompt instead of the content.

**Step 1: Gate the cards list page**

In `src/app/(app)/cards/page.tsx`, import `useUser` and `UpgradeModal`. At the top of the component body, after state declarations, add:

```tsx
const { user } = useUser();
const [upgradeOpen, setUpgradeOpen] = useState(false);
```

Wrap the entire return with a tier check — before the main `<div>`, add:

```tsx
if (user && !user.isPro) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <Sparkles className="mb-4 h-12 w-12 text-brand-purple/40" />
      <p className="font-semibold text-lg">Business Cards is a Pro feature</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Create unlimited digital business cards with your own shareable page.
      </p>
      <Button
        className="mt-6 gap-2 bg-brand-purple hover:bg-brand-purple/90"
        onClick={() => setUpgradeOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        Upgrade to Pro
      </Button>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName="Business Cards"
      />
    </div>
  );
}
```

Add the missing imports: `Sparkles` from `lucide-react`, `useUser` from `@/hooks/use-user`, `UpgradeModal` from `@/components/billing/upgrade-modal`.

**Step 2: Gate the analytics page**

Apply the same pattern to `src/app/(app)/analytics/page.tsx` — add a Pro check that shows an upgrade prompt with `featureName="Analytics"`.

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Run full test suite**

```bash
npm test
```

Expected: all pass.

**Step 5: Commit**

```bash
git add src/app/(app)/cards/page.tsx src/app/(app)/analytics/page.tsx
git commit -m "feat: gate cards and analytics pages for free users"
```

---

### Task 12: Local Stripe Webhook Testing

> Manual verification step — do this to confirm the full billing flow works end-to-end locally.

**Step 1: Install Stripe CLI (if not installed)**

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

**Step 2: Forward webhooks to local dev server**

In a separate terminal, with `npm run dev` running:

```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook
```

Copy the webhook signing secret it prints (starts with `whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in `.env.local`.

**Step 3: Test checkout flow**

1. In the browser, log in and go to `/settings`
2. Click "Upgrade to Pro"
3. In the Stripe Checkout test page, use card `4242 4242 4242 4242`, any future expiry, any CVC
4. After payment, you should be redirected to `/settings?upgraded=true`
5. The page should show "Welcome to Pro!" toast and the Pro plan UI

**Step 4: Test webhook delivery**

In the Stripe CLI terminal, you should see:
```
--> checkout.session.completed [evt_...]
<-- [200] POST http://localhost:3000/api/v1/stripe/webhook
```

Check Supabase dashboard: the user's `profiles.tier` should now be `'pro'`.

**Step 5: Test cancellation**

In the Stripe CLI:

```bash
stripe trigger customer.subscription.deleted
```

Check Supabase: `profiles.tier` should revert to `'free'`.

---

### Task 13: Build Verification

**Step 1: Full type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 2: Full test suite**

```bash
npm test
```

Expected: all pass.

**Step 3: Production build**

```bash
npm run build
```

Expected: Build completes with a `BUILD_ID`.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: stripe monetization complete — build verified"
```
