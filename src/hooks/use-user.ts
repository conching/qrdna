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
  isAdmin: boolean;
  isPro: boolean;
};

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, tier, is_admin")
        .eq("id", authUser.id)
        .single();

      const admin = profile?.is_admin ?? false;
      setUser({
        id: authUser.id,
        email: authUser.email,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        tier: profile?.tier ?? "free",
        isAdmin: admin,
        isPro: isPro(profile?.tier, admin),
      });
      setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
