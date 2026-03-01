# Phase 3A + Phase 4 MVP + Animations Design

**Date:** 2026-02-25
**Status:** Approved
**Approach:** Hybrid (Approach 3) — animation primitives first, then features interleaved

---

## Build Order

1. Animation foundation
2. Dashboard enhancements (table view, bulk select, custom short URLs)
3. Phase 3A dynamic features (smart routing, scheduled redirects, versioning, expiry pages, scan limits, pixels UI)
4. Phase 4 MVP (business card creation, hosted pages, vCard)

## Domain & Routing

- **Single domain:** qrdna.io for both app and short URL redirects
- **Routing:** Vercel Middleware (Option A) — middleware.ts detects short codes vs app routes
- **Env var:** `NEXT_PUBLIC_SHORT_URL_BASE=https://qrdna.io`
- Cloudflare Worker deferred until 100K+ redirects/day

---

## Section 1: Animation Foundation

### New files: `src/components/motion/`

| Component | Purpose |
|---|---|
| `lottie-player.tsx` | Lazy-loaded wrapper using `lottie-light` (~25KB). Props: animationData, trigger (hover/scroll/mount), loop, speed |
| `particle-field.tsx` | Canvas-based ambient particle background. Bioluminescent dots that drift and pulse. GPU-accelerated, `pointer-events: none` |
| `page-transition.tsx` | Framer Motion `AnimatePresence` wrapper. Fade + subtle Y-shift |
| `motion-presets.ts` | Reusable variants: fadeIn, slideUp, staggerChildren, pulseGlow, scaleIn |
| `glow-border.tsx` | CSS-only animated gradient border. `@property` hue rotation through brand palette (#7C5CFF, #06D6A0, #FFB627) |
| `dna-helix.tsx` | SVG animated double-helix. Loading indicator + empty state accent |

### New dependency
- `lottie-web` (light build, ~25KB gzipped)

### Lottie files: `public/animations/`
- `qr-generating.json` — QR materializing (create page)
- `scan-pulse.json` — Radar pulse (analytics)
- `empty-state.json` — Floating DNA strands (empty lists)
- `success.json` — Checkmark with particle burst (save/export)

### Global animation placement
- Particle field on app shell background (~30 particles, subtle)
- Page transitions on all route changes
- Glow borders on hover for dashboard cards
- DNA helix replacing current loading spinners
- Stagger animations on list/grid renders

---

## Section 2: Dashboard Enhancements

### Table View Toggle
- `view-toggle.tsx` — pill toggle between Grid and Table
- View preference in `ui-store` + localStorage
- `qr-table-view.tsx`:
  - Columns: Checkbox, QR thumbnail, Name, Type, Project, Content, Short URL (copyable), Scans, Created, Status, Actions
  - Show/Hide dropdown for column visibility (localStorage)
  - Sortable column headers (reuses existing API sort params)
  - Row expand → inline detail panel with QR preview + quick actions
  - Rows animate with staggerChildren

### Bulk Select
- Checkbox column in both table and card grid views
- Floating action bar (framer-motion slide-up) when 1+ selected
- Actions: Delete, Move to Project, Export (ZIP of PNGs), Toggle Active/Inactive
- Select All / Deselect All
- New API: `POST /api/v1/qr/bulk` — `{ action, ids, params }`

### Custom Short URLs
- Text input on QR detail page + create page
- Validation: 3-30 chars, alphanumeric + hyphens, uniqueness check
- Reserved words blocklist (dashboard, create, api, card, admin, login, signup, settings, analytics, etc.)
- Rate limit: 10 custom short code changes/hour/user
- Preview: `qrdna.io/your-custom-code`
- Dynamic QR codes only

---

## Section 3: Phase 3A Dynamic Features

### 3a. Smart Routing / Geo Fencing

**New table: `routing_rules`**
- id, qr_code_id (FK), priority (int), condition_type, condition_value (JSON), destination_url, is_active, created_at
- condition_type: 'device' | 'os' | 'browser' | 'country' | 'language' | 'time_range'
- condition_value: `{ "equals": "mobile" }` or `{ "in": ["US", "JP"] }`

**Scan route:** Fetch rules by priority, evaluate against request metadata. First match wins, else default destination.

**IP Geo:** Vercel `request.geo` (free, built-in).

**UI:** "Smart Rules" tab on QR detail page. Rule builder: condition type dropdown → operator → value → destination URL. Drag to reorder.

### 3b. Scheduled Redirects

**New table: `redirect_schedules`**
- id, qr_code_id (FK), day_of_week (int[], null=every day), start_time, end_time, timezone, destination_url, is_active, created_at

**Evaluation order in scan route:**
1. Routing rules (device/geo/language)
2. Schedules (time-based)
3. Default destination_url

**UI:** "Schedule" tab on QR detail. Weekly calendar grid, drag to create time blocks linked to destinations. Timezone selector (defaults to browser TZ).

### 3c. QR Code Versioning

**New table: `qr_code_versions`**
- id, qr_code_id (FK), version_number (auto-increment per QR), destination_url, changed_by (FK, set server-side), change_note, created_at

**Trigger:** PATCH on destination_url auto-inserts version row.

**UI:** "History" tab on QR detail. Timeline with timestamps, old/new URLs, "Restore" button. staggerChildren animation.

### 3d. Branded Expiry Pages

**New columns on `qr_codes`:**
- expiry_page_title, expiry_page_message, expiry_page_redirect_url, expiry_page_show_branding (boolean, default true)

**Scan route:** Expired code renders branded page with custom content. Default: QR DNA expiry page with DNA helix animation.

**UI:** "Expiry" section on QR detail. Date picker (existing) + custom page fields + live preview.

### 3e. Scan Limits

**New columns on `qr_codes`:**
- scan_limit (int, nullable), scan_limit_action ('block' | 'redirect' | 'expire'), scan_limit_redirect_url

**Scan route:** After incrementing total_scans, check limit. Atomic check-and-update in single DB transaction.

**UI:** "Limits" field group on QR detail. Number input + action dropdown.

### 3f. Pixel / Tracking Config UI

Uses existing DB columns: ga4_measurement_id, meta_pixel_id, webhook_url.

**UI:** "Tracking" tab on QR detail. Fields for GA4 ID, Meta Pixel ID, Webhook URL (with "Test" button). Tracking toggle.

**Scan route:** Server-side Measurement Protocol event for GA4. Server-side POST for webhooks. Async, non-blocking.

---

## Section 4: Wallet Passes

**DEFERRED to post-launch.** Low value-to-effort ratio for core user flow (creators, not scanners).

---

## Section 5: Phase 4 MVP — Digital Business Cards

### Card Creation Form (`/cards/new`)
Two-column layout: form left, live preview right.

**Fields:**
- Basic: first_name, last_name, pronouns, title, company, department, bio
- Contact: phones (repeatable + label), emails (repeatable + label), websites (repeatable + label)
- Address: street, city, state, zip, country
- Social: platform dropdown + URL (repeatable)
- Media: headshot upload, company logo upload (drag-and-drop, crop, compress)
- Slug: auto-generated from name, editable, uniqueness check on blur

**Store:** `card-editor-store.ts` (Zustand)

### Two Layout Variants
- **Centered:** Headshot circle top, name/title centered, contact action icons row, social icons row, details below
- **Minimal:** Name large top, title/company subtitle, compact contact/social list

Same component structure, layout variant is CSS/arrangement change.

### Public Hosted Page (`/card/[slug]`)
- Server-side rendered (Open Graph meta: name, title, headshot)
- Fetches by slug via service client (bypasses RLS)
- New RLS: anonymous SELECT on business_cards where is_active = true
- Mobile-first, particle field background, fadeIn animation
- Actions: tap phone (tel:), tap email (mailto:), tap address (maps), tap social (new tab)
- "Save Contact" → vCard download
- "Share" → Web Share API, fallback copy-link

### vCard Generation
**Route:** `GET /api/v1/cards/[id]/vcard`
- vCard 3.0 format, .vcf download
- Includes all contact data + headshot reference
- Public endpoint (no auth)

### Auto-Generated QR Code
- On card creation, auto-create dynamic QR → `qrdna.io/card/[slug]`
- content_type = 'business_card', linked via qr_code_id FK
- Default style: brand purple dots, white bg

### Card Management
- "Cards" section in sidebar
- Card list page `/cards` — grid of card previews
- Card detail/edit `/cards/[id]` — same form, pre-filled
- Delete cascade: card + linked QR

### API Routes
| Route | Method | Purpose |
|---|---|---|
| `/api/v1/cards` | POST | Create card + auto-generate QR |
| `/api/v1/cards` | GET | List user's cards |
| `/api/v1/cards/[id]` | GET | Fetch single card |
| `/api/v1/cards/[id]` | PATCH | Update card |
| `/api/v1/cards/[id]` | DELETE | Delete card + linked QR |
| `/api/v1/cards/[id]/vcard` | GET | Download vCard (public) |

### Migration: `00006_business_card_public_access.sql`
- Anonymous SELECT on business_cards where is_active = true
- Anonymous INSERT on card_view_events

---

## Security Safeguards

| Area | Safeguard |
|---|---|
| GA4/Meta Pixel IDs | Server-side only, never in client responses or redirect payloads |
| Webhook URLs | HTTPS-only, block private IPs (RFC 1918, link-local, loopback), DNS rebinding check, 5s timeout, no response logging |
| All destination URLs | Validate scheme (http/https only), no javascript:/data: URIs |
| Custom short codes | Reserved word blocklist, 3-char minimum, rate-limited (10/hr) |
| Scan limits | Atomic check-and-update in single DB transaction |
| Version history | changed_by always set server-side from auth token |
| Wallet pass certs | Env vars only (deferred, but noted for later) |
| Public card pages | RLS scoped to is_active=true, no write access for anonymous |

---

## New Database Objects Summary

### New Tables
- `routing_rules` — smart routing conditions
- `redirect_schedules` — time-based destination switching
- `qr_code_versions` — destination change history

### New Columns on `qr_codes`
- expiry_page_title, expiry_page_message, expiry_page_redirect_url, expiry_page_show_branding
- scan_limit, scan_limit_action, scan_limit_redirect_url

### New Migrations
- `00005_phase3a_features.sql` — new tables + columns
- `00006_business_card_public_access.sql` — anonymous access policies

### New API Routes
- `POST /api/v1/qr/bulk` — bulk actions
- `POST /api/v1/cards`, `GET /api/v1/cards` — card CRUD
- `GET/PATCH/DELETE /api/v1/cards/[id]` — single card
- `GET /api/v1/cards/[id]/vcard` — public vCard download
