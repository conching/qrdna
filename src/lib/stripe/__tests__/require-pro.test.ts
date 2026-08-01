import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * `buildRequireProResponse` delegates to `isPro`, which reads the
 * BILLING_ENABLED kill switch at module load. Each mode is exercised by
 * stubbing the env var and re-importing.
 */
async function loadBuildRequireProResponse(billingEnabled: boolean) {
  vi.stubEnv("NEXT_PUBLIC_BILLING_ENABLED", billingEnabled ? "true" : "false");
  vi.resetModules();
  const mod = await import("../require-pro");
  return mod.buildRequireProResponse;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("buildRequireProResponse with billing enabled", () => {
  let build: (tier?: string | null) => Response | null;

  beforeEach(async () => {
    build = await loadBuildRequireProResponse(true);
  });

  it("returns null when user is pro", () => {
    expect(build("pro")).toBeNull();
  });

  it("returns null when user is team", () => {
    expect(build("team")).toBeNull();
  });

  it("returns a Response with status 403 when user is free", () => {
    const result = build("free");
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it("returns a Response with status 403 when tier is null", () => {
    const result = build(null);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });
});

describe("buildRequireProResponse with billing disabled (kill switch off)", () => {
  let build: (tier?: string | null) => Response | null;

  beforeEach(async () => {
    build = await loadBuildRequireProResponse(false);
  });

  it("never blocks a free-tier user", () => {
    expect(build("free")).toBeNull();
  });

  it("never blocks a user with no tier", () => {
    expect(build(null)).toBeNull();
  });
});
