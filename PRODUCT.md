# Product

## Register

product

## Users

Freelancers, solopreneurs, small business owners, marketing teams, creators, and
event organizers — people who need a QR code or a shareable contact card to look
good on something physical, and who are not going to read documentation to get
there.

Their context is almost always **time-boxed and print-adjacent**: a menu going to
the printer this afternoon, event signage due tomorrow, a business card reorder,
a campaign link that has to be trackable. They arrive with a destination already
in mind and a deadline behind them.

The job to be done: *get a good-looking, correctly-encoded QR code (or a hosted
card page) out of the tool and into a design file, fast* — and, for dynamic
codes, be able to change where it points after the thing is already printed.

## Product Purpose

QR DNA generates, styles, manages, and tracks QR codes, plus hosts digital
business cards as a first-class feature rather than a bolt-on.

The wedge is that most QR tools force a choice between *free but ugly and
ad-ridden* and *good but enterprise-priced and enterprise-shaped*. QR DNA is
aiming at the middle: design quality that makes the free tier feel premium, with
the dynamic-code and analytics infrastructure that makes it worth keeping.

Success looks like: a first-time visitor lands on `/create`, produces a styled QR
code they are happy to put in a print file, and does it without an account. The
account exists to *keep and change* codes, not to unlock the basics.

Billing is currently switched off (see `src/lib/billing/flags.ts`). Every feature
is free during early access.

## Brand Personality

**Precise, generous, quietly technical.**

The name and the visual identity lean on a biotech/lab metaphor — the QR matrix
as a structure you can read, sequence, and modify. That earns a technical,
instrument-like tone: exact language, real numbers, no exclamation marks.
Confidence comes from the tool being correct and fast, not from adjectives.

Generosity is a brand value, not just pricing: no watermarks, no crippled
exports, no counting down someone's remaining free codes at them.

Dark mode is the primary theme — it shows off colored QR codes better and suits
the register.

## Anti-references

- **Enterprise QR SaaS** (Bitly, QR Tiger, Beaconstac). Feature-dense, salesy,
  gated at every turn, corporate blue, "Book a demo." Anything that makes a
  freelancer printing 200 flyers feel like they wandered into a procurement
  process.
- **Generic AI-generated SaaS.** Purple gradient hero, three identical
  icon-plus-heading-plus-paragraph feature cards, a tiny uppercase tracked
  eyebrow above every section, `background-clip: text` headings. The current
  landing page has the three-card grid and should lose it.
- **Free-tool ad farm** (`qr-code-generator.com` energy). Banner ads, dark-pattern
  upsells, watermarked downloads, fake urgency, "your download is starting."
  This is the closest competitor set by traffic and the furthest from the brand.

## Design Principles

1. **The tool disappears into the task.** This is product register, not brand
   register. Earned familiarity beats novelty: standard affordances, one
   consistent component vocabulary, no invented controls for standard jobs.
2. **Instant, always-on generation.** The preview updates live as settings
   change. There is no "Generate" button, because there is no moment at which
   the code is not being generated.
3. **Progressive disclosure over gating.** Simple by default, powerful on
   demand. Complexity is hidden until asked for — never withheld until paid for.
4. **Generosity is visible.** No watermarks, no truncated exports, no upsell
   interstitials. If a feature exists, a signed-in user can use it.
5. **Correctness is the feature.** A QR code that scans reliably at print size,
   a redirect that resolves in under 100ms, a vCard that imports cleanly into
   iOS Contacts. Everything else is decoration on top of that.

## Accessibility & Inclusion

Target: **WCAG 2.2 AA.**

- All interactive controls carry an accessible name; icon-only buttons need
  `aria-label` or visually-hidden text. *(Known gap: 10 of 11 icon buttons are
  currently unlabeled.)*
- Body text ≥ 4.5:1 contrast, large text ≥ 3:1, in both light and dark themes.
  Placeholder text is held to the same 4.5:1 bar.
- Every flow completable by keyboard alone, with a visible focus indicator.
- All motion has a `prefers-reduced-motion: reduce` alternative. *(Known gap:
  only `particle-field.tsx` currently honours it.)*
- Never convey state by color alone — scan status, active/inactive, and chart
  series all need a second channel (icon, label, or shape).
- QR contrast is an accessibility concern in its own right: warn when a chosen
  foreground/background pair falls below reliable scan contrast.
