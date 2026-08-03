import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { LandingNav } from "@/components/layout/landing-nav";
import { SiteFooter } from "@/components/landing/site-footer";

const SHELL = "mx-auto w-full max-w-6xl px-5 sm:px-8";

/**
 * Shared chrome for the public marketing pages (/faq, /terms, /privacy, …).
 * Mirrors the landing page header; `font-body` is applied here for the same
 * reason it is on the landing wrapper — see the note in src/app/page.tsx.
 */
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
