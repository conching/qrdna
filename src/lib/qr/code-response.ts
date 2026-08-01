import { apiError } from "@/lib/api/errors";

/**
 * Responses for someone who scanned a code, rather than for a program.
 *
 * The scan and contact endpoints are the only routes a member of the public
 * reaches by pointing a phone at a piece of paper. When something is wrong they
 * were answering with raw JSON — `{"error":{"code":"NO_DESTINATION"}}` — which
 * tells a person nothing and looks broken.
 *
 * These routes are still called by programs (the redirect worker POSTs to the
 * scan endpoint), so the format is negotiated rather than switched: browsers
 * asking for HTML get a page, everything else keeps the JSON envelope.
 */

export function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  // Browsers lead with text/html; fetch() and curl default to */*.
  return accept.includes("text/html");
}

export interface CodeErrorCopy {
  /** Machine-readable code, preserved for API callers. */
  code: string;
  status: number;
  /** Short headline, sentence case, no exclamation. */
  title: string;
  /** One or two sentences explaining what happened in plain language. */
  body: string;
  /** Optional next step. */
  action?: { label: string; href: string };
}

const BRAND = "QR DNA";

/**
 * A single-file HTML page with no external requests, so it renders instantly
 * over a phone connection in a car park.
 *
 * Colours are inlined rather than tokenised: this is served from a route
 * handler with no stylesheet attached, so `var(--background)` resolves to
 * nothing. It is deliberately theme-aware via prefers-color-scheme instead.
 */
export function renderCodeErrorPage(copy: CodeErrorCopy): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const action = copy.action
    ? `<a class="action" href="${esc(copy.action.href)}">${esc(copy.action.label)}</a>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(copy.title)} — ${BRAND}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100dvh;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fafafa; color: #111;
  }
  main { max-width: 30rem; text-align: center; }
  .mark {
    font-size: 13px; letter-spacing: .08em; text-transform: uppercase;
    color: #6b6b6b; margin-bottom: 20px;
  }
  h1 { font-size: 1.5rem; line-height: 1.25; margin: 0 0 12px; text-wrap: balance; }
  p { margin: 0; color: #4a4a4a; text-wrap: pretty; }
  .action {
    display: inline-block; margin-top: 28px; padding: 12px 22px;
    border-radius: 10px; background: #111; color: #fff;
    text-decoration: none; font-weight: 600;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #0a0a0b; color: #f5f5f7; }
    .mark { color: #9a9aa0; }
    p { color: #b9b9c0; }
    .action { background: #f5f5f7; color: #0a0a0b; }
  }
</style>
</head>
<body>
  <main>
    <p class="mark">${BRAND}</p>
    <h1>${esc(copy.title)}</h1>
    <p>${esc(copy.body)}</p>
    ${action}
  </main>
</body>
</html>`;
}

/** Respond with a page or the JSON envelope, depending on who is asking. */
export function codeErrorResponse(
  request: Request,
  copy: CodeErrorCopy,
): Response {
  if (!wantsHtml(request)) {
    return apiError(copy.status, copy.body, copy.code);
  }
  return new Response(renderCodeErrorPage(copy), {
    status: copy.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// ---------------------------------------------------------------------------
// The copy itself
// ---------------------------------------------------------------------------

export const CODE_ERRORS = {
  notFound: {
    code: "NOT_FOUND",
    status: 404,
    title: "This code isn’t registered",
    body: "Nothing is linked to it. The code may have been mistyped, or it may have been deleted by whoever created it.",
    action: { label: "Make your own code", href: "/create" },
  },
  inactive: {
    code: "INACTIVE",
    status: 410,
    title: "This code has been switched off",
    body: "Whoever created it has paused it, so there is nothing to show right now.",
  },
  expired: {
    code: "EXPIRED",
    status: 410,
    title: "This code has expired",
    body: "It was set to stop working after a certain date, and that date has passed.",
  },
  /**
   * A dynamic code whose destination was never filled in. Static codes no
   * longer reach this — they are served directly (see the scan route).
   */
  noDestination: {
    code: "NO_DESTINATION",
    status: 404,
    title: "This code has no destination yet",
    body: "It was created but never pointed anywhere. If it is yours, open it in your dashboard and add a destination.",
    action: { label: "Go to dashboard", href: "/dashboard" },
  },
  contactUnavailable: {
    code: "NOT_FOUND",
    status: 404,
    title: "This contact card isn’t available",
    body: "The card may have been deleted, or the link may have been mistyped.",
  },
} as const satisfies Record<string, CodeErrorCopy>;
