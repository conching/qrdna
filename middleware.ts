import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that are always accessible without authentication
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/callback",
  "/pricing",
  "/about",
  "/create",
]);

// Prefix-based public routes (checked with startsWith)
const PUBLIC_PREFIXES = ["/card/"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Allow public routes through regardless of auth status
  if (isPublicRoute(pathname)) {
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
