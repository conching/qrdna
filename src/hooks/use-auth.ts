"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function useAuth() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) throw error;
  }, [supabase]);

  const signInWithApple = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) throw error;
  }, [supabase]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    [supabase],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });
      if (error) throw error;
      return data;
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = "/";
  }, [supabase]);

  return {
    user,
    session,
    isLoading,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
