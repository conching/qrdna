// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createQRCode, updateQRCode } from "../generator";
import { DEFAULT_STYLE } from "../types";

/**
 * The quiet zone is a print-correctness property, not a cosmetic one: a symbol
 * flush to the edge of the image fails to scan against a coloured background
 * or when butted against other artwork. qr-code-styling defaults the margin to
 * zero, so these tests guard the correction applied in generator.ts.
 */

interface Internals {
  _qr?: { getModuleCount?: () => number };
  _options?: { margin?: number };
}

const read = (qr: unknown) => qr as unknown as Internals;

const SIZE = 300;

describe("quiet zone", () => {
  it("leaves a non-zero margin, unlike the library default", () => {
    const qr = createQRCode("https://example.com", DEFAULT_STYLE, SIZE);
    expect(read(qr)._options?.margin).toBeGreaterThan(0);
  });

  it("is four modules wide at the encoded version", () => {
    const qr = createQRCode("https://example.com", DEFAULT_STYLE, SIZE);
    const modules = read(qr)._qr?.getModuleCount?.() ?? 0;
    expect(modules).toBeGreaterThan(0);

    const margin = read(qr)._options?.margin ?? 0;
    const dot = Math.floor(SIZE / (modules + 8));
    expect(margin).toBe(dot * 4);

    // The drawn symbol plus both quiet zones must still fit the image.
    expect(modules * dot + margin * 2).toBeLessThanOrEqual(SIZE);
  });

  it("grows the symbol version for a longer payload and re-fits the margin", () => {
    const short = createQRCode("hi", DEFAULT_STYLE, SIZE);
    const long = createQRCode("x".repeat(400), DEFAULT_STYLE, SIZE);

    const shortModules = read(short)._qr?.getModuleCount?.() ?? 0;
    const longModules = read(long)._qr?.getModuleCount?.() ?? 0;
    expect(longModules).toBeGreaterThan(shortModules);

    // A denser symbol has smaller modules, so its quiet zone is fewer pixels —
    // but still exactly four modules.
    const longMargin = read(long)._options?.margin ?? 0;
    expect(longMargin).toBe(Math.floor(SIZE / (longModules + 8)) * 4);
    expect(longMargin).toBeLessThan(read(short)._options?.margin ?? 0);
  });

  it("re-fits the margin when an update changes the version", () => {
    const qr = createQRCode("hi", DEFAULT_STYLE, SIZE);
    const before = read(qr)._options?.margin ?? 0;

    updateQRCode(qr, "x".repeat(400), DEFAULT_STYLE, SIZE);

    const modules = read(qr)._qr?.getModuleCount?.() ?? 0;
    expect(read(qr)._options?.margin).toBe(Math.floor(SIZE / (modules + 8)) * 4);
    expect(read(qr)._options?.margin).not.toBe(before);
  });

  it("scales the quiet zone with the requested image size", () => {
    const small = createQRCode("https://example.com", DEFAULT_STYLE, 200);
    const large = createQRCode("https://example.com", DEFAULT_STYLE, 800);
    expect(read(large)._options?.margin ?? 0).toBeGreaterThan(
      read(small)._options?.margin ?? 0,
    );
  });
});
