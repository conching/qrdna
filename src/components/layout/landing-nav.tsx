"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { createClient } from "@/lib/supabase/client";

/**
 * Landing buttons sit on the neutral pair rather than on `--primary`, which
 * only clears 4.35:1 against white at button text sizes.
 */
const SOLID = "bg-foreground text-background hover:bg-foreground/90";

export function LandingNav() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <ThemeToggle />
      {/*
        The session resolves on the client, so the slot is sized up front —
        otherwise the theme toggle jumps sideways once the buttons arrive.
      */}
      <div className="flex min-h-9 min-w-[9rem] items-center justify-end gap-1 sm:min-w-[11.5rem] sm:gap-3">
        {isLoggedIn === null ? null : isLoggedIn ? (
          <Button size="sm" asChild className={SOLID}>
            <Link href="/dashboard">
              Dashboard
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-md px-1 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Sign in
            </Link>
            <Button size="sm" asChild className={SOLID}>
              <Link href="/signup">
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Create account</span>
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
