import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { FREE_ACCESS_NOTICE } from "@/lib/billing/flags";

const LINKS = [
  { href: "/create", label: "Create a code" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create an account" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[46ch]">
            <Logo size="md" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              QR codes and digital business cards, built for work that ends up
              on paper, glass or a wall.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm sm:flex-col sm:items-end">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          {FREE_ACCESS_NOTICE}
        </p>
      </div>
    </footer>
  );
}
