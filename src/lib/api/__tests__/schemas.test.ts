import { describe, it, expect } from "vitest";
import { createQRSchema, destinationUrlSchema } from "../schemas";

/**
 * Regression cover for the duplicate-a-code failure: the client copies a row
 * straight out of Postgres, where unset columns are `null`, and a bare
 * `.optional()` rejected every one of them.
 */

const base = { name: "Card", contentType: "vcard" as const };

describe("createQRSchema treats null as absent", () => {
  it("accepts a row round-tripped from the database", () => {
    const result = createQRSchema.safeParse({
      ...base,
      type: "static",
      destinationUrl: null,
      staticData: { firstName: "Ada" },
      style: null,
      projectId: null,
      tags: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationUrl).toBeUndefined();
      expect(result.data.style).toBeUndefined();
      expect(result.data.projectId).toBeUndefined();
      expect(result.data.tags).toEqual([]);
    }
  });

  it("still accepts the keys being omitted entirely", () => {
    expect(createQRSchema.safeParse({ ...base }).success).toBe(true);
  });

  it("still requires a destination for a dynamic code", () => {
    const result = createQRSchema.safeParse({
      ...base,
      contentType: "url",
      type: "dynamic",
      destinationUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a dynamic code that has a destination", () => {
    const result = createQRSchema.safeParse({
      name: "Promo",
      contentType: "url",
      type: "dynamic",
      destinationUrl: "example.com/menu",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.destinationUrl).toBe("https://example.com/menu");
    }
  });
});

describe("destinationUrlSchema", () => {
  it("adds a scheme to a bare host", () => {
    expect(destinationUrlSchema.parse("example.com")).toBe(
      "https://example.com",
    );
  });

  it("keeps an explicit http scheme", () => {
    expect(destinationUrlSchema.parse("http://example.com")).toBe(
      "http://example.com",
    );
  });

  it("rejects schemes that would become stored XSS on redirect", () => {
    for (const bad of [
      "javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ]) {
      expect(destinationUrlSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("rejects an empty destination", () => {
    expect(destinationUrlSchema.safeParse("   ").success).toBe(false);
  });
});
