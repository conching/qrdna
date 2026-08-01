import { describe, it, expect } from "vitest";
import {
  wantsHtml,
  renderCodeErrorPage,
  codeErrorResponse,
  CODE_ERRORS,
} from "../code-response";

const req = (accept: string) =>
  new Request("https://qrdna.io/abcdefg", { headers: { accept } });

const BROWSER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

describe("format negotiation", () => {
  it("treats a browser navigation as wanting a page", () => {
    expect(wantsHtml(req(BROWSER))).toBe(true);
  });

  it("treats fetch, curl and the redirect worker as wanting JSON", () => {
    expect(wantsHtml(req("*/*"))).toBe(false);
    expect(wantsHtml(req("application/json"))).toBe(false);
    expect(wantsHtml(new Request("https://qrdna.io/abcdefg"))).toBe(false);
  });
});

describe("codeErrorResponse", () => {
  it("serves a page to a browser, with the right status", async () => {
    const res = codeErrorResponse(req(BROWSER), CODE_ERRORS.notFound);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("This code isn’t registered");
    expect(html).not.toContain("NOT_FOUND");
  });

  it("keeps the JSON envelope for programmatic callers", async () => {
    const res = codeErrorResponse(req("*/*"), CODE_ERRORS.notFound);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    // The machine-readable code must survive; only the human copy changed.
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("preserves each error's status", () => {
    expect(codeErrorResponse(req("*/*"), CODE_ERRORS.expired).status).toBe(410);
    expect(codeErrorResponse(req("*/*"), CODE_ERRORS.inactive).status).toBe(410);
    expect(
      codeErrorResponse(req("*/*"), CODE_ERRORS.noDestination).status,
    ).toBe(404);
  });
});

describe("the copy itself", () => {
  it("never shows a raw error code to a person", () => {
    for (const copy of Object.values(CODE_ERRORS)) {
      const html = renderCodeErrorPage(copy);
      expect(html).not.toContain(copy.code);
      expect(html).not.toMatch(/NO_DESTINATION|NOT_FOUND|INACTIVE|EXPIRED/);
    }
  });

  it("explains rather than just naming the failure", () => {
    for (const copy of Object.values(CODE_ERRORS)) {
      expect(copy.title.length).toBeGreaterThan(10);
      expect(copy.body.split(" ").length).toBeGreaterThan(8);
      expect(copy.title).not.toMatch(/!$/); // no exclamation marks
    }
  });

  it("escapes anything that could carry markup", () => {
    const html = renderCodeErrorPage({
      code: "X",
      status: 404,
      title: '<script>alert("t")</script>',
      body: "a & b",
      action: { label: "<b>go</b>", href: 'javascript:"' },
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b");
    expect(html).not.toContain("<b>go</b>");
  });

  it("renders a self-contained page with no external requests", () => {
    const html = renderCodeErrorPage(CODE_ERRORS.notFound);
    expect(html).not.toMatch(/<link[^>]+href=["']http/);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).toContain("prefers-color-scheme");
    expect(html).toContain('lang="en"');
    expect(html).toContain("viewport");
  });
});
