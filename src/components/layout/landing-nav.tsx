"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LandingNav() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  // Don't render buttons until we know auth state (prevents flash)
  if (isLoggedIn === null) {
    return <div className="h-9 w-32" />;
  }

  if (isLoggedIn) {
    return (
      <Button asChild>
        <Link href="/dashboard">
          Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">Get Started</Link>
      </Button>
    </div>
  );
}
