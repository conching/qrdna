import { describe, it, expect } from "vitest";
import { publicUrlForCode, type CodeUrlInput } from "../public-url";

/**
 * A short code alone does not determine a URL — the path depends on what the
 * code is for. Reconstructing it inline is what produced a contact card whose
 * displayed link resolved to NO_DESTINATION.
 */

const hostedContact: CodeUrlInput = {
  type: "static",
  short_code: "XcCBSYi",
  content_type: "vcard",
  static_data: { firstName: "Lynelle", hostedContact: true },
};

const dynamicCode: CodeUrlInput = {
  type: "dynamic",
  short_code: "aBcDeFg",
  content_type: "url",
  static_data: null,
};

const plainStatic: CodeUrlInput = {
  type: "static",
  short_code: null,
  content_type: "wifi",
  static_data: { ssid: "Cafe" },
};

describe("hosted contact cards", () => {
  it("resolve to /c/<code>, the path that serves the .vcf", () => {
    const link = publicUrlForCode(hostedContact)!;
    expect(link.href).toBe("https://qrdna.io/c/XcCBSYi");
    expect(link.kind).toBe("contact");
  });

  it("are NOT given the root redirect path, which has no destination", () => {
    expect(publicUrlForCode(hostedContact)!.href).not.toBe(
      "https://qrdna.io/XcCBSYi",
    );
  });

  it("are labelled as a contact link rather than a short URL", () => {
    expect(publicUrlForCode(hostedContact)!.label).toBe("Contact link");
  });

  it("strip the scheme for display", () => {
    expect(publicUrlForCode(hostedContact)!.display).toBe(
      "qrdna.io/c/XcCBSYi",
    );
  });
});

describe("dynamic codes", () => {
  it("resolve to the root short link", () => {
    const link = publicUrlForCode(dynamicCode)!;
    expect(link.href).toBe("https://qrdna.io/aBcDeFg");
    expect(link.kind).toBe("redirect");
    expect(link.label).toBe("Short URL");
  });
});

describe("codes with no public address", () => {
  it("returns null for a static code with no short code", () => {
    expect(publicUrlForCode(plainStatic)).toBeNull();
  });

  it("returns null for a static vCard that is not hosted", () => {
    expect(
      publicUrlForCode({
        ...hostedContact,
        static_data: { firstName: "Ada", hostedContact: false },
      }),
    ).toBeNull();
  });

  it("returns null when hostedContact is absent entirely", () => {
    expect(
      publicUrlForCode({ ...hostedContact, static_data: { firstName: "Ada" } }),
    ).toBeNull();
  });

  it("tolerates malformed static_data without throwing", () => {
    for (const sd of [null, "a string", [1, 2, 3], 42]) {
      expect(() =>
        publicUrlForCode({ ...hostedContact, static_data: sd }),
      ).not.toThrow();
    }
  });
});
