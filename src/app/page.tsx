import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LandingNav } from "@/components/layout/landing-nav";
import { CardSpecimen } from "@/components/landing/card-specimen";
import { HeroGenerator } from "@/components/landing/hero-generator";
import { RedirectPanel } from "@/components/landing/redirect-panel";
import { SiteFooter } from "@/components/landing/site-footer";
import { QR_CONTENT_TYPES } from "@/lib/constants";

export const metadata: Metadata = {
  description:
    "Generate a styled, correctly encoded QR code in the browser and download the vector file. Ten content types, five export formats, dynamic codes you can re-point after printing, and digital business cards.",
};

/** See the note in landing-nav.tsx: neutral pair, not `--primary`. */
const SOLID = "bg-foreground text-background hover:bg-foreground/90";

const SHELL = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const H2 =
  "text-balance font-sans text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.03em]";

const FORMATS: Array<{ name: string; note: string }> = [
  { name: "SVG", note: "vector, opens in Figma, Illustrator and InDesign" },
  { name: "PDF", note: "vector, page sized in millimetres" },
  { name: "PNG", note: "raster, exported at any pixel size" },
  { name: "JPEG", note: "raster, flattened onto white" },
  { name: "WebP", note: "raster, smaller files for the web" },
];

/**
 * `font-body` is applied on the wrapper rather than inherited from `body`.
 * `--font-body` is declared inside an `@theme inline` block, so Tailwind
 * substitutes it into utilities but never emits it as a custom property — the
 * `body { font-family: var(--font-body) }` rule in globals.css therefore
 * resolves to nothing and every page falls back to the system sans. Until that
 * is fixed globally, the utility class is the only thing putting Inter on the
 * page. The same applies to `font-sans` on the headings below.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-body">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
      >
        Skip to content
      </a>

      <header className="border-b border-border">
        <div
          className={`${SHELL} flex items-center justify-between gap-3 py-4`}
        >
          <Link
            href="/"
            aria-label="QR DNA home"
            className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Logo className="text-xl sm:text-2xl" />
          </Link>
          <LandingNav />
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* ---------------------------------------------------------------
            Hero: the product itself, generating a real code as you type.
        ---------------------------------------------------------------- */}
        <section className={`${SHELL} pt-12 pb-16 sm:pt-20 sm:pb-24`}>
          <HeroGenerator />
        </section>

        {/* ---------------------------------------------------------------
            What a code can hold. Deliberately dense and low: a spec line,
            not a feature grid.
        ---------------------------------------------------------------- */}
        <section className="border-y border-border bg-card">
          <div className={`${SHELL} py-12 sm:py-16`}>
            <div className="grid gap-6 lg:grid-cols-12 lg:gap-14">
              <h2 className={`${H2} lg:col-span-5`}>
                Ten things a code can hold.
              </h2>
              <div className="lg:col-span-7">
                <p className="max-w-[min(65ch,34rem)] leading-relaxed text-muted-foreground">
                  The encoder writes each payload the way its own specification
                  expects it, so a Wi-Fi code joins the network, a vCard keeps
                  its labels, and an event carries a start time in UTC.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2 font-mono text-sm">
                  {QR_CONTENT_TYPES.map((type) => (
                    <li
                      key={type.value}
                      className="rounded-md border border-border px-2.5 py-1"
                    >
                      {type.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            The keeper feature. Given the most room on the page.
        ---------------------------------------------------------------- */}
        <section className={`${SHELL} py-20 sm:py-28`}>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <h2 className={H2}>The sign is printed. The link is not.</h2>
              <p className="mt-6 max-w-[min(65ch,34rem)] leading-relaxed text-muted-foreground">
                A dynamic code encodes a short link and nothing else. What sits
                behind that link is a field in your dashboard: change it after
                the flyer has gone to the printer, after the sign is on the
                wall, after the reprint budget is spent.
              </p>
              <p className="mt-4 max-w-[min(65ch,34rem)] leading-relaxed text-muted-foreground">
                The printed square never changes. The destination changes as
                often as the campaign does.
              </p>
            </div>
            <div className="lg:col-span-7">
              <RedirectPanel />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Two blocks of deliberately unequal weight: a feature and a
            specification.
        ---------------------------------------------------------------- */}
        <section className="border-t border-border">
          <div
            className={`${SHELL} grid gap-14 py-16 sm:py-24 lg:grid-cols-12 lg:gap-14`}
          >
            <div className="lg:col-span-7">
              <h2 className={H2}>Hand over the contact, not the card.</h2>
              <p className="mt-6 max-w-[min(65ch,34rem)] leading-relaxed text-muted-foreground">
                A digital business card gets its own page, a QR code that opens
                it, and a <code className="font-mono">.vcf</code> download that
                lands in iOS and Android contacts with the headshot attached —
                photos are too large to fit inside a QR code, so the card serves
                them from the page instead.
              </p>
              <p className="mt-4 max-w-[min(65ch,34rem)] leading-relaxed text-muted-foreground">
                Four layouts, your colours, your typeface. Views are counted the
                same way scans are.
              </p>
              <div className="mt-10">
                <CardSpecimen />
              </div>
            </div>

            <aside className="lg:col-span-5">
              <h2 className="text-balance font-sans text-xl font-bold tracking-[-0.02em] sm:text-2xl">
                Five ways out of the editor.
              </h2>
              <p className="mt-4 max-w-[min(65ch,30rem)] text-sm leading-relaxed text-muted-foreground">
                Every format is open to everyone while QR DNA is in early
                access. None of them carry a mark.
              </p>
              <dl className="mt-6 divide-y divide-border border-y border-border">
                {FORMATS.map((format) => (
                  <div
                    key={format.name}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
                  >
                    <dt className="w-14 shrink-0 font-mono text-sm">
                      {format.name}
                    </dt>
                    <dd className="min-w-0 flex-1 text-sm text-muted-foreground">
                      {format.note}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Close.
        ---------------------------------------------------------------- */}
        <section className="border-t border-border">
          <div className={`${SHELL} py-16 sm:py-24`}>
            <h2 className={`${H2} max-w-[24ch]`}>
              There is nothing to upgrade to.
            </h2>
            <p className="mt-6 max-w-[min(65ch,34rem)] leading-relaxed text-muted-foreground">
              Every feature is free while QR DNA is in early access: no plan to
              pick, no trial clock, no watermark on the way out. An account is
              what keeps your codes, lets you re-point a printed one, and shows
              you where the scans came from.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className={SOLID}>
                <Link href="/create">
                  Open the editor
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">Create an account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
