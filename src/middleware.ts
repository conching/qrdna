// ---------------------------------------------------------------------------
// DO NOT MOVE THIS FILE.
//
// This project uses a `src/` directory, so Next.js only picks middleware up at
// `src/middleware.ts`. At the package root it still compiles, still appears in
// `.next/**/middleware-manifest.json` with correct matchers, and still prints
// `ƒ Proxy (Middleware)` in the build output — but it never runs. That failure
// is completely silent: protected routes serve 200 to anonymous users and the
// short-code redirect stops working entirely.
//
// To verify it is wired, request a 7-character path (e.g. /abcdefg). It must
// return the scan handler's JSON, not Next's HTML 404 page.
// ---------------------------------------------------------------------------
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SHORT_CODE_LENGTH } from "@/lib/constants";

// Regex for short-code redirects: exactly SHORT_CODE_LENGTH nanoid chars at root
const SHORT_CODE_RE = new RegExp(
  `^/([A-Za-z0-9_-]{${SHORT_CODE_LENGTH}})$`,
);

// Routes that are always accessible without authentication
// Only routes that exist. /pricing and /about were listed here but were
// never built, so the allow-list was advertising two 404s.
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/callback",
  "/create",
  "/faq",
  "/terms",
  "/privacy",
]);

// Prefix-based public routes (checked with startsWith)
const PUBLIC_PREFIXES = ["/card/", "/c/"];

// Contact-card downloads: /c/aBcDeFg → /api/v1/contact/aBcDeFg
const CONTACT_CODE_RE = new RegExp(
  `^/c/([A-Za-z0-9_-]{${SHORT_CODE_LENGTH}})$`,
);

// API routes that must work without authentication
const PUBLIC_API_PREFIXES = [
  "/api/v1/stripe/webhook",   // Stripe webhook (called by Stripe servers)
  "/api/v1/scan/",            // QR scan redirects (anonymous users)
  "/api/v1/cards/",           // Card view tracking & vCard download (anonymous)
  "/api/v1/contact/",         // vCard QR .vcf download (anonymous)
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // -----------------------------------------------------------------------
  // Short-code redirect: /aBcDeFg → rewrite to /api/v1/scan/aBcDeFg
  // Must come before route checks so short codes are caught at the root.
  // -----------------------------------------------------------------------
  const shortMatch = pathname.match(SHORT_CODE_RE);
  if (shortMatch && !isPublicRoute(pathname)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/api/v1/scan/${shortMatch[1]}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // -----------------------------------------------------------------------
  // Contact download: /c/aBcDeFg → the .vcf endpoint. Kept short because
  // every character in the encoded URL costs QR modules.
  // -----------------------------------------------------------------------
  const contactMatch = pathname.match(CONTACT_CODE_RE);
  if (contactMatch) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/api/v1/contact/${contactMatch[1]}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  // Allow public routes through regardless of auth status
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // Public API routes: allow through without auth
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return supabaseResponse;
  }

  // Protected API routes: return 401 JSON if not authenticated
  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }
    return supabaseResponse;
  }

  // Protected app routes (/(app)/* and any other non-public route):
  // redirect unauthenticated users to /login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets in the root (svg, png, jpg, jpeg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
