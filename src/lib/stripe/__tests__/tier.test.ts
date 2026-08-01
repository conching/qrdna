import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hasPaidPlan, tierFromStripeStatus } from "../tier";

/**
 * `isPro` reads the BILLING_ENABLED kill switch at module load, so each mode is
 * exercised by stubbing the env var and re-importing the module.
 */
async function loadIsPro(billingEnabled: boolean) {
  vi.stubEnv("NEXT_PUBLIC_BILLING_ENABLED", billingEnabled ? "true" : "false");
  vi.resetModules();
  const mod = await import("../tier");
  return mod.isPro;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("hasPaidPlan", () => {
  it("returns false for free tier", () => {
    expect(hasPaidPlan("free")).toBe(false);
  });

  it("returns true for pro tier", () => {
    expect(hasPaidPlan("pro")).toBe(true);
  });

  it("returns true for team tier", () => {
    expect(hasPaidPlan("team")).toBe(true);
  });

  it("returns false for null", () => {
    expect(hasPaidPlan(null)).toBe(false);
  });
});

describe("isPro with billing enabled", () => {
  let isPro: (tier?: string | null, isAdmin?: boolean) => boolean;

  beforeEach(async () => {
    isPro = await loadIsPro(true);
  });

  it("returns false for free tier", () => {
    expect(isPro("free")).toBe(false);
  });

  it("returns true for pro tier", () => {
    expect(isPro("pro")).toBe(true);
  });

  it("returns true for team tier", () => {
    expect(isPro("team")).toBe(true);
  });

  it("returns false for null", () => {
    expect(isPro(null)).toBe(false);
  });

  it("returns true for an admin on the free tier", () => {
    expect(isPro("free", true)).toBe(true);
  });
});

describe("isPro with billing disabled (kill switch off)", () => {
  let isPro: (tier?: string | null, isAdmin?: boolean) => boolean;

  beforeEach(async () => {
    isPro = await loadIsPro(false);
  });

  it("grants access on the free tier", () => {
    expect(isPro("free")).toBe(true);
  });

  it("grants access with no tier at all", () => {
    expect(isPro(null)).toBe(true);
  });

  it("still grants access on paid tiers", () => {
    expect(isPro("pro")).toBe(true);
    expect(isPro("team")).toBe(true);
  });
});

describe("tierFromStripeStatus", () => {
  it("returns pro for active subscription", () => {
    expect(tierFromStripeStatus("active")).toBe("pro");
  });

  it("returns pro for trialing subscription", () => {
    expect(tierFromStripeStatus("trialing")).toBe("pro");
  });

  it("returns free for canceled subscription", () => {
    expect(tierFromStripeStatus("canceled")).toBe("free");
  });

  it("returns free for past_due subscription", () => {
    expect(tierFromStripeStatus("past_due")).toBe("free");
  });
});
