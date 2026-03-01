# Phase 3A + Phase 4 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add bioluminescent animation primitives, dashboard enhancements (table view, bulk select, custom short URLs), Phase 3A dynamic QR features (smart routing, scheduled redirects, versioning, branded expiry pages, scan limits, tracking config UI), and Phase 4 MVP digital business cards (creation form, public hosted page, vCard, auto-QR linking).

**Architecture:** Hybrid approach — build animation primitives first, then layer on features. All new DB objects in two migrations (Phase 3A schema + business card public access). Scan route enhanced with a rule evaluation pipeline (routing rules -> schedules -> scan limits -> default destination). Business cards get their own Zustand store, API routes, and a public SSR page at `/card/[slug]`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (new-york), Zustand 5, Supabase (Postgres + Auth + RLS), framer-motion, lottie-web (new), recharts, qr-code-styling, nanoid, zod, lucide-react

---

## Codebase Patterns Reference

Before implementing, know these patterns used throughout the codebase:

- **API response envelope:** `apiSuccess(data, meta?)` / `apiError(statusCode, message, code?)`
- **Auth check:** `const { data: { user } } = await supabase.auth.getUser(); if (!user) return apiError(401, ...)`
- **Ownership filter:** `.eq("user_id", user.id)` on every query
- **camelCase request body -> snake_case DB:** Convert manually in route handlers
- **Dynamic route params:** `{ params }: { params: Promise<{ id: string }> }` (Next.js 16)
- **Server client (with RLS):** `import { createClient } from "@/lib/supabase/server"`
- **Service client (bypass RLS):** `import { createServiceClient } from "@/lib/supabase/service"`
- **Browser client:** `import { createClient } from "@/lib/supabase/client"`
- **Zustand stores:** `create<State>()((set, get) => ({...}))` with immutable spread updates
- **Optimistic UI:** Update local state first, revert on fetch failure
- **Server -> Client pattern:** Server component fetches data, passes `initialData` to client component

---

## Task 1: Install Dependencies + Create Animation Primitives

**Files:**
- Modify: `package.json`
- Create: `src/components/motion/motion-presets.ts`
- Create: `src/components/motion/particle-field.tsx`
- Create: `src/components/motion/glow-border.tsx`
- Create: `src/components/motion/dna-helix.tsx`
- Create: `src/components/motion/page-transition.tsx`
- Create: `src/components/motion/lottie-player.tsx`

**Step 1: Install lottie-web**

Run: `cd /Users/conching/Library/CloudStorage/Dropbox-Personal/Personal/_Apps/QRCodeGen/qrlab && npm install lottie-web`

**Step 2: Create motion presets**

```typescript
// src/components/motion/motion-presets.ts
import type { Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const pulseGlow: Variants = {
  idle: { boxShadow: "0 0 0 0 rgba(124, 92, 255, 0)" },
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(124, 92, 255, 0.4)",
      "0 0 20px 10px rgba(124, 92, 255, 0)",
    ],
    transition: { duration: 1.5, repeat: Infinity },
  },
};
```

**Step 3: Create particle-field.tsx**

Canvas-based ambient particle system. Key requirements:
- ~30 particles, bioluminescent colors (#7C5CFF, #06D6A0, #FFB627 at 0.15-0.3 opacity)
- Slow drift + subtle opacity pulse
- `position: fixed; inset: 0; z-index: 0; pointer-events: none`
- `requestAnimationFrame` loop, cleanup on unmount
- Respect `prefers-reduced-motion` — skip animation if set
- Props: `density?: number` (particles per 100k px², default 15), `className?: string`

**Step 4: Create glow-border.tsx**

CSS-only animated gradient border using `@property` for `--glow-angle` rotation:
- Brand palette cycle: #7C5CFF -> #06D6A0 -> #FFB627 -> #FF6B6B -> loop
- `background: conic-gradient(from var(--glow-angle), ...)` with `border-radius` mask
- Props: `active?: boolean` (default: activates on hover), `children`, `className`

**Step 5: Create dna-helix.tsx**

SVG animated double helix:
- Two sinusoidal paths offset 180 degrees with connecting "rungs"
- Smooth vertical scroll/rotation animation via framer-motion
- Props: `size?: number` (default 40), `className?: string`
- Use as loading spinner replacement

**Step 6: Create page-transition.tsx**

```typescript
// src/components/motion/page-transition.tsx
"use client";
import { motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

**Step 7: Create lottie-player.tsx**

Lazy-load `lottie-web/build/player/lottie_light` via `dynamic import()`:
- Props: `animationData: object`, `trigger?: "mount" | "hover" | "scroll"` (default "mount"), `loop?: boolean` (default true), `speed?: number` (default 1), `className?: string`
- Render into a `<div ref>`, call `lottie.loadAnimation()` on mount
- For `trigger="hover"`: play on mouseenter, stop on mouseleave
- For `trigger="scroll"`: use IntersectionObserver to play when visible
- Cleanup animation instance on unmount

**Step 8: Commit**

```bash
git add src/components/motion/ package.json package-lock.json
git commit -m "feat: add animation foundation (motion presets, particle field, glow border, DNA helix, page transition, lottie player)"
```

---

## Task 2: Database Migration — Phase 3A Schema

**Files:**
- Create: `supabase/migrations/00005_phase3a_features.sql`
- Create: `supabase/migrations/00006_business_card_public_access.sql`

**Step 1: Create Phase 3A migration**

```sql
-- supabase/migrations/00005_phase3a_features.sql

-- ============================================================
-- New table: routing_rules (smart routing / geo fencing)
-- ============================================================
create table routing_rules (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references qr_codes(id) on delete cascade,
  priority int not null default 0,
  condition_type text not null check (condition_type in ('device', 'os', 'browser', 'country', 'language', 'time_range')),
  condition_value jsonb not null, -- e.g. { "equals": "mobile" } or { "in": ["US", "JP"] }
  destination_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_routing_rules_qr on routing_rules(qr_code_id, priority);

-- RLS
alter table routing_rules enable row level security;

create policy "Users can view own routing rules"
  on routing_rules for select
  using (exists (
    select 1 from qr_codes where qr_codes.id = routing_rules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Users can insert own routing rules"
  on routing_rules for insert
  with check (exists (
    select 1 from qr_codes where qr_codes.id = routing_rules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Users can update own routing rules"
  on routing_rules for update
  using (exists (
    select 1 from qr_codes where qr_codes.id = routing_rules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Users can delete own routing rules"
  on routing_rules for delete
  using (exists (
    select 1 from qr_codes where qr_codes.id = routing_rules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

-- Service role access for scan route
create policy "Service can read routing rules"
  on routing_rules for select
  using (true);

-- ============================================================
-- New table: redirect_schedules
-- ============================================================
create table redirect_schedules (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references qr_codes(id) on delete cascade,
  day_of_week int[] default null, -- null = every day, 0=Sun..6=Sat
  start_time time not null,
  end_time time not null,
  timezone text not null default 'UTC',
  destination_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_redirect_schedules_qr on redirect_schedules(qr_code_id);

-- RLS (same pattern as routing_rules)
alter table redirect_schedules enable row level security;

create policy "Users can view own schedules"
  on redirect_schedules for select
  using (exists (
    select 1 from qr_codes where qr_codes.id = redirect_schedules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Users can insert own schedules"
  on redirect_schedules for insert
  with check (exists (
    select 1 from qr_codes where qr_codes.id = redirect_schedules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Users can update own schedules"
  on redirect_schedules for update
  using (exists (
    select 1 from qr_codes where qr_codes.id = redirect_schedules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Users can delete own schedules"
  on redirect_schedules for delete
  using (exists (
    select 1 from qr_codes where qr_codes.id = redirect_schedules.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Service can read schedules"
  on redirect_schedules for select
  using (true);

-- ============================================================
-- New table: qr_code_versions (destination history)
-- ============================================================
create table qr_code_versions (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references qr_codes(id) on delete cascade,
  version_number int not null,
  destination_url text not null,
  changed_by uuid references profiles(id) on delete set null,
  change_note text,
  created_at timestamptz not null default now()
);

create index idx_qr_code_versions_qr on qr_code_versions(qr_code_id, version_number desc);

alter table qr_code_versions enable row level security;

create policy "Users can view own versions"
  on qr_code_versions for select
  using (exists (
    select 1 from qr_codes where qr_codes.id = qr_code_versions.qr_code_id and qr_codes.user_id = auth.uid()
  ));

create policy "Users can insert own versions"
  on qr_code_versions for insert
  with check (exists (
    select 1 from qr_codes where qr_codes.id = qr_code_versions.qr_code_id and qr_codes.user_id = auth.uid()
  ));

-- ============================================================
-- New columns on qr_codes
-- ============================================================

-- Branded expiry page
alter table qr_codes add column expiry_page_title text;
alter table qr_codes add column expiry_page_message text;
alter table qr_codes add column expiry_page_redirect_url text;
alter table qr_codes add column expiry_page_show_branding boolean not null default true;

-- Scan limits
alter table qr_codes add column scan_limit int;
alter table qr_codes add column scan_limit_action text check (scan_limit_action in ('block', 'redirect', 'expire'));
alter table qr_codes add column scan_limit_redirect_url text;

-- Tracking config (columns already exist: ga4_measurement_id, meta_pixel_id, webhook_url — skip if present)
-- These were in the original schema but not in database.ts. Add if missing:
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'ga4_measurement_id') THEN
    ALTER TABLE qr_codes ADD COLUMN ga4_measurement_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'meta_pixel_id') THEN
    ALTER TABLE qr_codes ADD COLUMN meta_pixel_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'webhook_url') THEN
    ALTER TABLE qr_codes ADD COLUMN webhook_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qr_codes' AND column_name = 'tracking_enabled') THEN
    ALTER TABLE qr_codes ADD COLUMN tracking_enabled boolean not null default false;
  END IF;
END $$;
```

**Step 2: Create business card public access migration**

```sql
-- supabase/migrations/00006_business_card_public_access.sql

-- Allow anonymous SELECT on active business cards (for public /card/[slug] page)
create policy "Anyone can view active cards"
  on business_cards for select
  using (is_active = true);

-- Allow anonymous INSERT on card_view_events (for logging page views)
create policy "Anyone can log card views"
  on card_view_events for insert
  with check (true);
```

**Step 3: Apply migrations locally**

Run: `cd /Users/conching/Library/CloudStorage/Dropbox-Personal/Personal/_Apps/QRCodeGen/qrlab && npx supabase db push`

If using remote Supabase directly, run the SQL in the Supabase SQL Editor.

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add Phase 3A database schema (routing rules, schedules, versions, expiry, scan limits, tracking columns, card public access)"
```

---

## Task 3: Update TypeScript Types

**Files:**
- Modify: `src/types/database.ts`

**Step 1: Add new table types and update qr_codes**

Add to `Database.public.Tables`:

- `routing_rules` — Row/Insert/Update types matching the SQL schema
- `redirect_schedules` — Row/Insert/Update types
- `qr_code_versions` — Row/Insert/Update types
- Update `qr_codes.Row` to include: `expiry_page_title`, `expiry_page_message`, `expiry_page_redirect_url`, `expiry_page_show_branding`, `scan_limit`, `scan_limit_action`, `scan_limit_redirect_url`, `ga4_measurement_id`, `meta_pixel_id`, `webhook_url`, `tracking_enabled`
- Update `qr_codes.Insert` and `qr_codes.Update` with matching optional fields

Add convenience aliases at bottom:

```typescript
export type RoutingRuleRow = Tables<"routing_rules">;
export type RedirectScheduleRow = Tables<"redirect_schedules">;
export type QRCodeVersionRow = Tables<"qr_code_versions">;
```

**Step 2: Verify build**

Run: `cd /Users/conching/Library/CloudStorage/Dropbox-Personal/Personal/_Apps/QRCodeGen/qrlab && npx tsc --noEmit`

Expected: no type errors

**Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: update TypeScript types for Phase 3A tables and columns"
```

---

## Task 4: Dashboard Enhancements — Table View + Bulk Select + Custom Short URLs

**Files:**
- Create: `src/components/qr/qr-table-view.tsx`
- Create: `src/components/qr/view-toggle.tsx`
- Create: `src/components/qr/bulk-action-bar.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/stores/ui-store.ts` — add `dashboardView: "grid" | "table"` + persistence
- Create: `src/app/api/v1/qr/bulk/route.ts`
- Modify: `src/app/(app)/qr/[id]/qr-detail-view.tsx` — add custom short URL input

### Sub-task 4a: Add view preference to UI store

Add to `ui-store.ts`:
```typescript
dashboardView: "grid" | "table";
setDashboardView: (view: "grid" | "table") => void;
```
Default `"grid"`. Persist to `localStorage` key `"qrdna-dashboard-view"`.

### Sub-task 4b: Create view-toggle.tsx

Pill toggle component with Grid/Table icons. Uses `useUIStore().dashboardView` and `setDashboardView`.

### Sub-task 4c: Create qr-table-view.tsx

Table component receiving `QRCodeRow[]` + handlers (`onFavoriteToggle`, `onDelete`, `onSelectionChange`):
- Columns: Checkbox, QR thumbnail (small 32x32 color swatch), Name (link to `/qr/[id]`), Type badge, Content Type, Short URL (monospace + copy button), Scans count, Created date, Status (active/inactive dot), Actions dropdown
- Sortable column headers (triggers parent sort state change)
- Checkbox column for bulk select
- Uses `staggerContainer` / `staggerItem` from motion-presets for row animation

### Sub-task 4d: Create bulk-action-bar.tsx

Floating bar (fixed bottom center, framer-motion slide-up from y: 100):
- Shows when `selectedIds.length > 0`
- Displays count: "{n} selected"
- Buttons: Delete, Move to Project (dropdown), Export ZIP, Toggle Active
- Deselect All button
- Calls `POST /api/v1/qr/bulk` with `{ action, ids, params }`

### Sub-task 4e: Create bulk API route

```typescript
// src/app/api/v1/qr/bulk/route.ts
// POST body: { action: "delete" | "move" | "activate" | "deactivate", ids: string[], params?: { projectId?: string } }
// Auth required, ownership verified per-id
// Returns: apiSuccess({ affected: number })
```

Actions:
- `delete`: `.delete().in("id", ids).eq("user_id", user.id)`
- `move`: `.update({ project_id: params.projectId }).in("id", ids).eq("user_id", user.id)`
- `activate`/`deactivate`: `.update({ is_active: true/false }).in("id", ids).eq("user_id", user.id)`

### Sub-task 4f: Update dashboard page

- Add `ViewToggle` above the grid
- Conditionally render `QRCodeCard` grid or `QRTableView` based on store preference
- Thread selection state (`selectedIds: Set<string>`) for bulk actions
- Render `BulkActionBar` when selection non-empty

### Sub-task 4g: Custom short URL on QR detail page

Add to the "Short URL" section of `qr-detail-view.tsx`:
- "Customize" button next to the short URL display
- Inline input field: validates 3-30 chars, `[a-zA-Z0-9-]`, lowercase on save
- Uniqueness check via `GET /api/v1/qr?shortCode=<value>` or a dedicated endpoint
- Reserved words blocklist (constant array in `src/lib/constants.ts`)
- Save via existing PATCH with `{ shortCode: value }`

Add `RESERVED_SHORT_CODES` to `src/lib/constants.ts`:
```typescript
export const RESERVED_SHORT_CODES = [
  "dashboard", "create", "api", "card", "admin", "login", "signup",
  "settings", "analytics", "qr", "cards", "projects", "app",
  "auth", "callback", "pricing", "about", "help", "support",
] as const;
```

### Sub-task 4h: Commit

```bash
git add src/components/qr/qr-table-view.tsx src/components/qr/view-toggle.tsx src/components/qr/bulk-action-bar.tsx src/app/api/v1/qr/bulk/route.ts src/app/(app)/dashboard/page.tsx src/stores/ui-store.ts src/app/(app)/qr/[id]/qr-detail-view.tsx src/lib/constants.ts
git commit -m "feat: add dashboard table view, bulk actions, and custom short URLs"
```

---

## Task 5: Enhanced Scan Route — Routing Rules + Schedules + Scan Limits + Branded Expiry

**Files:**
- Modify: `src/app/api/v1/scan/[shortCode]/route.ts`
- Create: `src/lib/scan/evaluate-rules.ts`
- Create: `src/lib/scan/evaluate-schedule.ts`
- Create: `src/lib/scan/check-scan-limit.ts`
- Create: `src/app/api/v1/scan/[shortCode]/expired/route.ts` (or render inline)

### Sub-task 5a: Create rule evaluation helpers

```typescript
// src/lib/scan/evaluate-rules.ts
import type { RoutingRuleRow } from "@/types/database";

interface ScanContext {
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  language: string | null;
}

/**
 * Evaluate routing rules against scan context.
 * Returns the destination URL of the first matching rule, or null.
 */
export function evaluateRoutingRules(
  rules: RoutingRuleRow[],
  ctx: ScanContext,
): string | null {
  // Rules are already sorted by priority (ascending)
  for (const rule of rules) {
    if (!rule.is_active) continue;

    const value = rule.condition_value as Record<string, unknown>;
    const fieldValue = getFieldValue(rule.condition_type, ctx);

    if (matchCondition(value, fieldValue)) {
      return rule.destination_url;
    }
  }
  return null;
}

function getFieldValue(conditionType: string, ctx: ScanContext): string | null {
  switch (conditionType) {
    case "device": return ctx.deviceType;
    case "os": return ctx.os;
    case "browser": return ctx.browser;
    case "country": return ctx.country;
    case "language": return ctx.language;
    default: return null;
  }
}

function matchCondition(condition: Record<string, unknown>, fieldValue: string | null): boolean {
  if (!fieldValue) return false;
  const lower = fieldValue.toLowerCase();

  if ("equals" in condition) {
    return lower === String(condition.equals).toLowerCase();
  }
  if ("in" in condition && Array.isArray(condition.in)) {
    return condition.in.some((v: unknown) => String(v).toLowerCase() === lower);
  }
  if ("not_in" in condition && Array.isArray(condition.not_in)) {
    return !condition.not_in.some((v: unknown) => String(v).toLowerCase() === lower);
  }
  return false;
}
```

```typescript
// src/lib/scan/evaluate-schedule.ts
import type { RedirectScheduleRow } from "@/types/database";

/**
 * Find the first active schedule matching the current time.
 * Returns the destination URL or null.
 */
export function evaluateSchedules(
  schedules: RedirectScheduleRow[],
): string | null {
  const now = new Date();

  for (const schedule of schedules) {
    if (!schedule.is_active) continue;

    // Convert current time to the schedule's timezone
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: schedule.timezone }));
    const dayOfWeek = tzNow.getDay(); // 0=Sun
    const currentTime = `${String(tzNow.getHours()).padStart(2, "0")}:${String(tzNow.getMinutes()).padStart(2, "0")}:00`;

    // Check day of week (null = every day)
    if (schedule.day_of_week && !schedule.day_of_week.includes(dayOfWeek)) {
      continue;
    }

    // Check time range
    if (currentTime >= schedule.start_time && currentTime <= schedule.end_time) {
      return schedule.destination_url;
    }
  }
  return null;
}
```

```typescript
// src/lib/scan/check-scan-limit.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface ScanLimitResult {
  allowed: boolean;
  action?: "block" | "redirect" | "expire";
  redirectUrl?: string | null;
}

/**
 * Check if a QR code has hit its scan limit.
 * Must be called AFTER incrementing total_scans for atomicity.
 */
export async function checkScanLimit(
  supabase: SupabaseClient<Database>,
  qrId: string,
  totalScans: number,
  scanLimit: number | null,
  scanLimitAction: string | null,
  scanLimitRedirectUrl: string | null,
): Promise<ScanLimitResult> {
  if (scanLimit == null || totalScans < scanLimit) {
    return { allowed: true };
  }

  // Limit reached — apply action
  if (scanLimitAction === "expire") {
    await supabase
      .from("qr_codes")
      .update({ is_active: false })
      .eq("id", qrId);
  }

  return {
    allowed: false,
    action: (scanLimitAction as ScanLimitResult["action"]) ?? "block",
    redirectUrl: scanLimitRedirectUrl,
  };
}
```

### Sub-task 5b: Update scan route with rule pipeline

Modify `src/app/api/v1/scan/[shortCode]/route.ts`:

1. After fetching QR code, also fetch routing_rules and redirect_schedules:
```typescript
const [{ data: rules }, { data: schedules }] = await Promise.all([
  supabase.from("routing_rules").select("*").eq("qr_code_id", qr.id).order("priority", { ascending: true }),
  supabase.from("redirect_schedules").select("*").eq("qr_code_id", qr.id),
]);
```

2. Parse request language header: `request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? null`

3. Evaluate pipeline to determine final destination:
```typescript
// 1. Routing rules (device/geo/language)
let destination = evaluateRoutingRules(rules ?? [], { deviceType, os, browser, country, language });
// 2. Schedule (time-based) — only if no rule matched
if (!destination) destination = evaluateSchedules(schedules ?? []);
// 3. Default
if (!destination) destination = qr.destination_url;
```

4. After incrementing scan counters, check scan limit:
```typescript
if (qr.scan_limit != null) {
  const limitResult = await checkScanLimit(supabase, qr.id, qr.total_scans + 1, qr.scan_limit, qr.scan_limit_action, qr.scan_limit_redirect_url);
  if (!limitResult.allowed) {
    if (limitResult.action === "redirect" && limitResult.redirectUrl) {
      return NextResponse.redirect(limitResult.redirectUrl, 302);
    }
    // block or expire → show expiry page
    return renderExpiryPage(qr);
  }
}
```

5. Handle expired codes with branded expiry page:
```typescript
function renderExpiryPage(qr: QRCodeRow): Response {
  if (qr.expiry_page_redirect_url) {
    return NextResponse.redirect(qr.expiry_page_redirect_url, 302);
  }
  const title = qr.expiry_page_title ?? "This QR code has expired";
  const message = qr.expiry_page_message ?? "The content behind this QR code is no longer available.";
  const showBranding = qr.expiry_page_show_branding ?? true;
  // Return a simple HTML page with brand styling
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0A0A0B;color:#F5F5F7;text-align:center}
.container{max-width:400px;padding:2rem}h1{font-size:1.5rem;margin-bottom:1rem}p{color:#8E8E93;line-height:1.6}
.brand{margin-top:2rem;font-size:0.75rem;color:#7C5CFF}</style>
</head><body><div class="container"><h1>${title}</h1><p>${message}</p>${showBranding ? '<p class="brand">Powered by QR DNA</p>' : ""}</div></body></html>`;
  return new Response(html, { status: 410, headers: { "Content-Type": "text/html" } });
}
```

6. Also fetch `scan_limit`, `scan_limit_action`, `scan_limit_redirect_url`, `expiry_page_*` fields in the initial QR select.

### Sub-task 5c: Commit

```bash
git add src/lib/scan/ src/app/api/v1/scan/
git commit -m "feat: enhance scan route with smart routing, schedules, scan limits, and branded expiry pages"
```

---

## Task 6: Phase 3A QR Detail UI — Tabs for Smart Routing, Schedules, Versioning, Expiry, Tracking

**Files:**
- Create: `src/components/qr/detail/smart-routing-tab.tsx`
- Create: `src/components/qr/detail/schedule-tab.tsx`
- Create: `src/components/qr/detail/version-history-tab.tsx`
- Create: `src/components/qr/detail/tracking-tab.tsx`
- Modify: `src/app/(app)/qr/[id]/qr-detail-view.tsx` — restructure dynamic settings into tabbed UI with new sections

### Sub-task 6a: Restructure QR detail into tabbed layout

Replace the current "Dynamic QR Settings" card with a `<Tabs>` component for dynamic codes:
- **Settings** tab (existing: destination URL, active toggle, expiration, custom short URL)
- **Smart Rules** tab (new)
- **Schedule** tab (new)
- **Limits & Expiry** tab (new: scan limit, expiry page config)
- **Tracking** tab (new: GA4, Meta Pixel, Webhook)
- **History** tab (new: version history)
- **Analytics** tab (existing: move analytics section here)

### Sub-task 6b: Smart Routing Tab

```typescript
// src/components/qr/detail/smart-routing-tab.tsx
// Fetches routing_rules for the QR code
// Displays existing rules in a sortable list (drag or priority number)
// "Add Rule" button opens inline form:
//   - Condition Type: select (device, os, browser, country, language)
//   - Condition: depends on type — text input for "equals", multi-select for "in"
//   - Destination URL: text input
// Save via POST to /api/v1/qr/[id]/routing-rules
// Delete via DELETE to /api/v1/qr/[id]/routing-rules/[ruleId]
```

New API routes needed:
- `src/app/api/v1/qr/[id]/routing-rules/route.ts` — GET (list), POST (create)
- `src/app/api/v1/qr/[id]/routing-rules/[ruleId]/route.ts` — PATCH (update), DELETE

### Sub-task 6c: Schedule Tab

```typescript
// src/components/qr/detail/schedule-tab.tsx
// Displays existing schedules as time blocks
// "Add Schedule" button opens form:
//   - Days: checkboxes for Sun-Sat (or "Every day")
//   - Start/End time: time inputs
//   - Timezone: select (Intl.supportedValuesOf("timeZone"))
//   - Destination URL: text input
// CRUD via /api/v1/qr/[id]/schedules
```

New API routes:
- `src/app/api/v1/qr/[id]/schedules/route.ts` — GET, POST
- `src/app/api/v1/qr/[id]/schedules/[scheduleId]/route.ts` — PATCH, DELETE

### Sub-task 6d: Version History Tab

```typescript
// src/components/qr/detail/version-history-tab.tsx
// Fetches versions from /api/v1/qr/[id]/versions
// Renders timeline list: version_number, destination_url, change_note, created_at
// "Restore" button on each version → PATCH /api/v1/qr/[id] with that destination_url
// Uses staggerItem animation
```

New API route:
- `src/app/api/v1/qr/[id]/versions/route.ts` — GET (list versions)

Version creation happens automatically when PATCH changes `destination_url` (add logic to existing PATCH handler in `src/app/api/v1/qr/[id]/route.ts`):
```typescript
// In PATCH handler, after update succeeds and destinationUrl changed:
if (destinationUrl !== undefined && data.destination_url !== oldDestinationUrl) {
  const { count } = await supabase
    .from("qr_code_versions")
    .select("id", { count: "exact", head: true })
    .eq("qr_code_id", id);
  await supabase.from("qr_code_versions").insert({
    qr_code_id: id,
    version_number: (count ?? 0) + 1,
    destination_url: data.destination_url,
    changed_by: user.id,
  });
}
```

### Sub-task 6e: Limits & Expiry Section

Add to the existing "Settings" tab (or a separate "Limits" tab):
- Scan Limit: number input (nullable)
- Scan Limit Action: select (block / redirect / expire)
- Scan Limit Redirect URL: text input (visible when action = "redirect")
- Separator
- Expiry Page Title: text input
- Expiry Page Message: textarea
- Expiry Page Redirect URL: text input (alternative: redirect instead of showing page)
- Show QR DNA Branding: switch

All saved via existing PATCH `/api/v1/qr/[id]` — add the new fields to the PATCH handler.

### Sub-task 6f: Tracking Tab

```typescript
// src/components/qr/detail/tracking-tab.tsx
// Fields: Tracking Enabled (switch), GA4 Measurement ID (text), Meta Pixel ID (text), Webhook URL (text + "Test" button)
// "Test" button for webhook: POST /api/v1/qr/[id]/webhook-test
// All saved via PATCH /api/v1/qr/[id]
```

New API route for webhook test:
- `src/app/api/v1/qr/[id]/webhook-test/route.ts` — POST: sends a test payload to the webhook URL, returns success/failure

### Sub-task 6g: Update PATCH handler

Modify `src/app/api/v1/qr/[id]/route.ts` to accept all new fields in the request body:
- `scanLimit`, `scanLimitAction`, `scanLimitRedirectUrl`
- `expiryPageTitle`, `expiryPageMessage`, `expiryPageRedirectUrl`, `expiryPageShowBranding`
- `ga4MeasurementId`, `metaPixelId`, `webhookUrl`, `trackingEnabled`
- `shortCode` (custom short URL — validate uniqueness, reserved words, format)

### Sub-task 6h: Commit

```bash
git add src/components/qr/detail/ src/app/api/v1/qr/[id]/ src/app/(app)/qr/[id]/qr-detail-view.tsx
git commit -m "feat: add Phase 3A QR detail tabs (smart routing, schedules, version history, tracking, limits/expiry)"
```

---

## Task 7: Business Cards API Routes

**Files:**
- Create: `src/app/api/v1/cards/route.ts` — POST (create), GET (list)
- Create: `src/app/api/v1/cards/[id]/route.ts` — GET, PATCH, DELETE
- Create: `src/app/api/v1/cards/[id]/vcard/route.ts` — GET (public, no auth)
- Create: `src/lib/cards/vcard.ts` — vCard 3.0 string builder
- Create: `src/lib/cards/slug.ts` — slug generation + validation

### Sub-task 7a: Slug utility

```typescript
// src/lib/cards/slug.ts
import { nanoid } from "nanoid";

/**
 * Generate a URL slug from a name, falling back to nanoid.
 */
export function generateSlug(firstName: string, lastName: string): string {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || nanoid(8);
}

/**
 * Validate slug format: 2-60 chars, lowercase alphanumeric + hyphens
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$/.test(slug) && !slug.includes("--");
}
```

### Sub-task 7b: vCard builder

```typescript
// src/lib/cards/vcard.ts
import type { BusinessCardRow } from "@/types/database";

interface Phone { label: string; number: string }
interface Email { label: string; address: string }
interface Website { label: string; url: string }
interface Address { street?: string; city?: string; state?: string; zip?: string; country?: string }

/**
 * Generate vCard 3.0 string from a business card row.
 */
export function generateVCard(card: BusinessCardRow): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${card.last_name};${card.first_name};;;`,
    `FN:${card.first_name} ${card.last_name}`,
  ];

  if (card.title) lines.push(`TITLE:${card.title}`);
  if (card.company) lines.push(`ORG:${card.company}${card.department ? `;${card.department}` : ""}`);
  if (card.bio) lines.push(`NOTE:${card.bio}`);

  // Phones
  const phones = (card.phones as Phone[] | null) ?? [];
  for (const p of phones) {
    lines.push(`TEL;TYPE=${p.label || "WORK"}:${p.number}`);
  }

  // Emails
  const emails = (card.emails as Email[] | null) ?? [];
  for (const e of emails) {
    lines.push(`EMAIL;TYPE=${e.label || "WORK"}:${e.address}`);
  }

  // Websites
  const websites = (card.websites as Website[] | null) ?? [];
  for (const w of websites) {
    lines.push(`URL:${w.url}`);
  }

  // Address
  const addr = card.address as Address | null;
  if (addr) {
    lines.push(`ADR;TYPE=WORK:;;${addr.street ?? ""};${addr.city ?? ""};${addr.state ?? ""};${addr.zip ?? ""};${addr.country ?? ""}`);
  }

  // Headshot
  if (card.headshot_url) {
    lines.push(`PHOTO;VALUE=URI:${card.headshot_url}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}
```

### Sub-task 7c: Cards API — POST + GET

```typescript
// src/app/api/v1/cards/route.ts
// POST: Create a business card + auto-generate a dynamic QR code linked to it
//   Body: { firstName, lastName, pronouns?, title?, company?, department?, bio?,
//           phones?, emails?, websites?, address?, socialLinks?, headshotUrl?, companyLogoUrl?,
//           slug?, theme? }
//   1. Auth check
//   2. Generate slug from name (or use provided slug), validate, check uniqueness
//   3. Insert business_cards row
//   4. Auto-create dynamic QR: insert qr_codes with content_type='business_card',
//      destination_url=`https://qrdna.io/card/${slug}`, short_code=generateShortCode()
//   5. Update card's qr_code_id
//   6. Return card + linked QR

// GET: List user's cards with pagination (same pattern as GET /api/v1/qr)
//   Query: page, limit, search (ilike on first_name, last_name, company)
```

### Sub-task 7d: Cards API — GET/PATCH/DELETE single

```typescript
// src/app/api/v1/cards/[id]/route.ts
// Follow exact same patterns as /api/v1/qr/[id]/route.ts:
// GET: fetch by id + user_id, 404 if not found
// PATCH: camelCase body -> snake_case update, ownership check
//   If slug changed: validate format, check uniqueness, update linked QR's destination_url
// DELETE: delete card. Linked QR (qr_code_id) should be deleted too
//   via cascade or explicit delete
```

### Sub-task 7e: vCard download route (public)

```typescript
// src/app/api/v1/cards/[id]/vcard/route.ts
import { createServiceClient } from "@/lib/supabase/service";
import { generateVCard } from "@/lib/cards/vcard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: card } = await supabase
    .from("business_cards")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!card) return apiError(404, "Card not found", "NOT_FOUND");

  const vcf = generateVCard(card);
  const filename = `${card.first_name}-${card.last_name}.vcf`.toLowerCase().replace(/\s+/g, "-");

  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

### Sub-task 7f: Commit

```bash
git add src/app/api/v1/cards/ src/lib/cards/
git commit -m "feat: add business cards API routes (CRUD, vCard download, slug generation)"
```

---

## Task 8: Business Card Editor — Zustand Store + Form Component

**Files:**
- Create: `src/stores/card-editor-store.ts`
- Create: `src/components/cards/card-form.tsx`
- Create: `src/components/cards/card-preview.tsx`
- Create: `src/components/cards/repeatable-field.tsx` (shared component for phones/emails/websites/socials)
- Create: `src/app/(app)/cards/new/page.tsx`
- Create: `src/app/(app)/cards/[id]/page.tsx`

### Sub-task 8a: Card editor Zustand store

```typescript
// src/stores/card-editor-store.ts
import { create } from "zustand";

interface Phone { label: string; number: string }
interface Email { label: string; address: string }
interface Website { label: string; url: string }
interface SocialLink { platform: string; url: string }
interface Address { street: string; city: string; state: string; zip: string; country: string }

interface CardTheme {
  layout: "centered" | "minimal";
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  font: "inter" | "space-grotesk" | "dm-sans";
  darkMode: "auto" | "light" | "dark";
}

const DEFAULT_THEME: CardTheme = {
  layout: "centered",
  primaryColor: "#7C5CFF",
  backgroundColor: "#0A0A0B",
  textColor: "#F5F5F7",
  font: "inter",
  darkMode: "dark",
};

interface CardEditorState {
  // Basic info
  firstName: string;
  lastName: string;
  pronouns: string;
  title: string;
  company: string;
  department: string;
  bio: string;
  slug: string;
  // Contact
  phones: Phone[];
  emails: Email[];
  websites: Website[];
  address: Address;
  socialLinks: SocialLink[];
  // Media
  headshotFile: File | null;
  headshotUrl: string | null;
  companyLogoFile: File | null;
  companyLogoUrl: string | null;
  // Theme
  theme: CardTheme;
  // Actions
  setField: (field: string, value: unknown) => void;
  setTheme: (partial: Partial<CardTheme>) => void;
  addPhone: () => void;
  removePhone: (index: number) => void;
  updatePhone: (index: number, phone: Partial<Phone>) => void;
  addEmail: () => void;
  removeEmail: (index: number) => void;
  updateEmail: (index: number, email: Partial<Email>) => void;
  addWebsite: () => void;
  removeWebsite: (index: number) => void;
  updateWebsite: (index: number, website: Partial<Website>) => void;
  addSocialLink: () => void;
  removeSocialLink: (index: number) => void;
  updateSocialLink: (index: number, link: Partial<SocialLink>) => void;
  reset: () => void;
  loadFromCard: (card: Record<string, unknown>) => void;
}
```

Key pattern: use generic `setField(field, value)` for simple text fields, dedicated add/remove/update for repeatable arrays. `loadFromCard()` hydrates from an existing `BusinessCardRow` for editing.

### Sub-task 8b: Repeatable field component

```typescript
// src/components/cards/repeatable-field.tsx
// Generic component for phone/email/website/social arrays
// Props: items, onAdd, onRemove, onUpdate, labelOptions, placeholder, maxItems
// Renders: list of inline rows (label select + value input + remove button) + "Add" button
```

### Sub-task 8c: Card form component

```typescript
// src/components/cards/card-form.tsx
// Two-column layout: form (left) + live preview (right, sticky)
// Sections: Basic Info, Contact, Address, Social Links, Media, Theme, Slug
// Uses card-editor-store for all state
// "Save" button calls parent-provided onSave callback with store data
// Slug field: auto-generates from firstName + lastName, editable, validates on blur
```

### Sub-task 8d: Card preview component

```typescript
// src/components/cards/card-preview.tsx
// Renders a phone-frame mockup (similar to QR detail preview)
// Inside: renders the card layout based on theme.layout
// "centered" layout: headshot circle, name centered, action icons row, details
// "minimal" layout: large name, subtitle, compact contact list
// Uses theme colors and font from store
// Live-updates as store changes (subscribe to store)
```

### Sub-task 8e: Card creation page

```typescript
// src/app/(app)/cards/new/page.tsx
"use client";
// Renders CardForm with onSave that calls POST /api/v1/cards
// On success: toast + redirect to /cards/[id]
// Reset store on mount
```

### Sub-task 8f: Card edit page

```typescript
// src/app/(app)/cards/[id]/page.tsx
// Server component: fetch card by id (same pattern as /qr/[id]/page.tsx)
// Pass initialData to a client CardEditView component
// Client component: loadFromCard(initialData) into store, render CardForm
// onSave calls PATCH /api/v1/cards/[id]
```

### Sub-task 8g: Commit

```bash
git add src/stores/card-editor-store.ts src/components/cards/ src/app/(app)/cards/
git commit -m "feat: add business card editor (store, form, preview, create/edit pages)"
```

---

## Task 9: Public Card Page — /card/[slug] with SSR

**Files:**
- Create: `src/app/card/[slug]/page.tsx` — Server component (SSR with OG meta)
- Create: `src/app/card/[slug]/card-page-view.tsx` — Client component
- Create: `src/components/cards/card-layouts/centered-layout.tsx`
- Create: `src/components/cards/card-layouts/minimal-layout.tsx`

### Sub-task 9a: Server component with OG metadata

```typescript
// src/app/card/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { CardPageView } from "./card-page-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: card } = await supabase
    .from("business_cards")
    .select("first_name, last_name, title, company, headshot_url, bio")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!card) return { title: "Card Not Found" };

  const fullName = `${card.first_name} ${card.last_name}`;
  return {
    title: `${fullName}${card.title ? ` - ${card.title}` : ""}`,
    description: card.bio ?? `${fullName}'s digital business card`,
    openGraph: {
      title: fullName,
      description: card.title ? `${card.title}${card.company ? ` at ${card.company}` : ""}` : undefined,
      images: card.headshot_url ? [card.headshot_url] : undefined,
    },
  };
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: card } = await supabase
    .from("business_cards")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!card) notFound();

  return <CardPageView card={card} />;
}
```

### Sub-task 9b: Client card page view

```typescript
// src/app/card/[slug]/card-page-view.tsx
"use client";
// Receives card data as prop
// Renders the appropriate layout based on card.theme.layout
// Actions: tap phone → tel:, tap email → mailto:, tap address → google maps link
// "Save Contact" button → GET /api/v1/cards/[id]/vcard → triggers download
// "Share" button → navigator.share() if available, fallback to copy link
// Log page view: POST to a simple analytics endpoint (or inline fetch to card_view_events)
// Applies theme: colors, font (loaded via next/font), dark mode
// Animations: fadeIn on mount, staggered sections
```

### Sub-task 9c: Layout components

```typescript
// src/components/cards/card-layouts/centered-layout.tsx
// Headshot circle (or initials fallback) at top
// Name large centered
// Title + Company subtitle
// Action icon row: phone, email, website (each as a rounded icon button)
// Social links row: platform icons as circular buttons
// Bio section below
// Address (if present) with map link

// src/components/cards/card-layouts/minimal-layout.tsx
// Name large at top (no headshot)
// Title + Company inline
// Compact vertical list: phone numbers, emails, websites
// Social links as small inline icons
// Bio as subtle text at bottom
```

Both components receive `card: BusinessCardRow` and render accordingly.

### Sub-task 9d: Card view event logging

In `card-page-view.tsx`, on mount:
```typescript
useEffect(() => {
  fetch("/api/v1/cards/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId: card.id, eventType: "page_view" }),
  }).catch(() => {}); // fire-and-forget
}, [card.id]);
```

Create: `src/app/api/v1/cards/events/route.ts`
- Uses service client (no auth needed)
- Inserts into `card_view_events`
- Parses UA + IP for device_type, country, etc.

### Sub-task 9e: Commit

```bash
git add src/app/card/ src/components/cards/card-layouts/ src/app/api/v1/cards/events/
git commit -m "feat: add public business card page with SSR, OG metadata, vCard download, and view event logging"
```

---

## Task 10: Card Management — List Page + Sidebar Integration

**Files:**
- Create: `src/app/(app)/cards/page.tsx` — card list/grid
- Create: `src/components/cards/card-card.tsx` — dashboard card for card grid
- Modify: `src/components/layout/app-shell.tsx` — ensure "Business Cards" nav item works

### Sub-task 10a: Card list page

```typescript
// src/app/(app)/cards/page.tsx
"use client";
// Same pattern as dashboard/page.tsx:
// 1. Fetch cards via GET /api/v1/cards
// 2. Show loading skeleton, error state, empty state
// 3. Render grid of CardCard components
// 4. "Create Card" CTA button → /cards/new
// 5. Search by name/company
```

### Sub-task 10b: Card card component

```typescript
// src/components/cards/card-card.tsx
// Similar to qr-code-card.tsx:
// Card preview with theme colors, name, title/company
// Click → /cards/[id]
// Action bar: dropdown with Edit, Delete
// Shows "Active" / "Inactive" badge
```

### Sub-task 10c: Verify sidebar integration

The `app-shell.tsx` already has `{ href: "/cards", label: "Business Cards", icon: CreditCard }` in `NAV_ITEMS`. Verify it links correctly and highlights on the `/cards` route.

### Sub-task 10d: Commit

```bash
git add src/app/(app)/cards/page.tsx src/components/cards/card-card.tsx
git commit -m "feat: add business card list page with grid view and sidebar navigation"
```

---

## Task 11: Integration Wiring + Polish

**Files:**
- Modify: `src/components/layout/app-shell.tsx` — add particle-field background
- Modify: `src/app/(app)/dashboard/page.tsx` — add stagger animations to grid
- Create: `public/animations/` — placeholder Lottie JSON files (can use empty stubs initially)
- Verify all routes build: `npx tsc --noEmit && npm run build`

### Sub-task 11a: Add particle field to app shell

In `app-shell.tsx`, add `<ParticleField />` as the first child of the root div, behind all content.

### Sub-task 11b: Add stagger animations to dashboard grid

Wrap the QR code card grid in a `<motion.div variants={staggerContainer}>` and each card in `<motion.div variants={staggerItem}>`.

### Sub-task 11c: Build verification

Run: `cd /Users/conching/Library/CloudStorage/Dropbox-Personal/Personal/_Apps/QRCodeGen/qrlab && rm -rf .next && npm run build`

Expected: Build succeeds with no errors.

### Sub-task 11d: Final commit

```bash
git add .
git commit -m "feat: wire up animations, verify build for Phase 3A + Phase 4 MVP"
```

---

## Summary: New Files Created

| Category | Files |
|---|---|
| Motion components | `src/components/motion/` (6 files) |
| DB migrations | `supabase/migrations/00005_*.sql`, `00006_*.sql` |
| Dashboard | `qr-table-view.tsx`, `view-toggle.tsx`, `bulk-action-bar.tsx` |
| Scan pipeline | `src/lib/scan/` (3 files) |
| QR detail tabs | `src/components/qr/detail/` (4 files) |
| Cards API | `src/app/api/v1/cards/` (5 route files) |
| Card utils | `src/lib/cards/` (2 files) |
| Card editor | `src/stores/card-editor-store.ts`, `src/components/cards/` (5 files) |
| Public card page | `src/app/card/[slug]/` (2 files) |
| Card layouts | `src/components/cards/card-layouts/` (2 files) |
| Card management | `src/app/(app)/cards/page.tsx`, `card-card.tsx` |

## Summary: Modified Files

| File | Changes |
|---|---|
| `src/types/database.ts` | New tables + columns |
| `src/stores/ui-store.ts` | Dashboard view preference |
| `src/app/(app)/dashboard/page.tsx` | Table view, bulk select, animations |
| `src/app/(app)/qr/[id]/qr-detail-view.tsx` | Tabbed UI, custom short URL |
| `src/app/api/v1/qr/[id]/route.ts` | New PATCH fields, auto-version |
| `src/app/api/v1/scan/[shortCode]/route.ts` | Rule pipeline, expiry page |
| `src/lib/constants.ts` | Reserved short codes |
| `src/components/layout/app-shell.tsx` | Particle field |
| `package.json` | lottie-web dependency |

## New API Routes Summary

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/v1/qr/bulk` | POST | Yes | Bulk actions (delete, move, activate) |
| `/api/v1/qr/[id]/routing-rules` | GET, POST | Yes | Smart routing rules CRUD |
| `/api/v1/qr/[id]/routing-rules/[ruleId]` | PATCH, DELETE | Yes | Single rule update/delete |
| `/api/v1/qr/[id]/schedules` | GET, POST | Yes | Scheduled redirects CRUD |
| `/api/v1/qr/[id]/schedules/[scheduleId]` | PATCH, DELETE | Yes | Single schedule update/delete |
| `/api/v1/qr/[id]/versions` | GET | Yes | Version history |
| `/api/v1/qr/[id]/webhook-test` | POST | Yes | Test webhook URL |
| `/api/v1/cards` | POST, GET | Yes | Create/list cards |
| `/api/v1/cards/[id]` | GET, PATCH, DELETE | Yes | Single card CRUD |
| `/api/v1/cards/[id]/vcard` | GET | No | Public vCard download |
| `/api/v1/cards/events` | POST | No | Public card view logging |
