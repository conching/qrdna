import { describe, it, expect } from "vitest";
import { isPro, tierFromStripeStatus } from "../tier";

describe("isPro", () => {
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
