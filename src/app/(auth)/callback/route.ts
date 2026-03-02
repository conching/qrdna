import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // Determine correct origin behind Vercel proxy
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Exchange failed — redirect with error detail for debugging
    console.error("[auth/callback] Code exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=code_exchange_failed&message=${encodeURIComponent(error.message)}`,
    );
  }

  // No code parameter — could be a fragment-based redirect (hash)
  // Supabase PKCE always sends `code` as query param, so this is unexpected
  console.error("[auth/callback] No code parameter in callback URL");
  return NextResponse.redirect(`${origin}/login?error=no_code_in_callback`);
}
