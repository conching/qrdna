import { describe, it, expect } from "vitest";
import { buildRequireProResponse } from "../require-pro";

describe("buildRequireProResponse", () => {
  it("returns null when user is pro", () => {
    expect(buildRequireProResponse("pro")).toBeNull();
  });

  it("returns null when user is team", () => {
    expect(buildRequireProResponse("team")).toBeNull();
  });

  it("returns a Response with status 403 when user is free", () => {
    const result = buildRequireProResponse("free");
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it("returns a Response with status 403 when tier is null", () => {
    const result = buildRequireProResponse(null);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });
});
