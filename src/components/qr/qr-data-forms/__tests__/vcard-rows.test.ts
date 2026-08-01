import { describe, it, expect } from "vitest";
import { readRows, readStrings } from "../vcard-rows";
import { toVCardInput } from "@/lib/qr/encoders";
import { buildVCard } from "@/lib/vcard/build";
import { toVCardData } from "@/lib/qr/build-data";

describe("readRows", () => {
  it("returns the stored rows when the array exists", () => {
    const rows = [{ label: "Work", number: "+1 555 0100" }];
    expect(readRows(rows, undefined, "number")).toEqual(rows);
  });

  it("seeds a row from the legacy scalar so old records open with their data", () => {
    expect(
      readRows(undefined, "+1 555 0100", "number", { label: "Mobile" }),
    ).toEqual([{ label: "Mobile", number: "+1 555 0100" }]);
  });

  it("prefers the array over the legacy scalar", () => {
    const rows = [{ label: "Work", number: "+1 555 0199" }];
    expect(readRows(rows, "+1 555 0100", "number")).toEqual(rows);
  });

  it("returns empty for a blank legacy value", () => {
    expect(readRows(undefined, "   ", "number")).toEqual([]);
    expect(readRows(undefined, undefined, "number")).toEqual([]);
  });

  it("treats an explicitly emptied array as empty, not as a legacy fallback", () => {
    // After removing the last row the array is [], and the legacy field has
    // been cleared — the row must not reappear.
    expect(readRows([], "", "number")).toEqual([]);
  });
});

describe("readStrings", () => {
  it("returns the stored list", () => {
    expect(readStrings(["a.com", "b.com"], undefined)).toEqual([
      "a.com",
      "b.com",
    ]);
  });

  it("falls back to the legacy scalar", () => {
    expect(readStrings(undefined, "example.com")).toEqual(["example.com"]);
  });

  it("respects an emptied list", () => {
    expect(readStrings([], "")).toEqual([]);
  });
});

describe("legacy + array merge", () => {
  it("does not emit the same number twice when both are present", () => {
    const input = toVCardInput({
      firstName: "Ada",
      lastName: "Lovelace",
      phone: "+1 555 0100",
      phones: [{ number: "+1 555 0100", label: "Mobile" }],
    });
    expect(input.phones).toHaveLength(1);
  });

  it("ignores case and surrounding space when deduping emails", () => {
    const input = toVCardInput({
      firstName: "Ada",
      lastName: "Lovelace",
      email: " Ada@Example.com ",
      emails: [{ address: "ada@example.com", label: "Work" }],
    });
    expect(input.emails).toHaveLength(1);
    // The array entry wins, so its label is preserved.
    expect(input.emails?.[0].label).toBe("Work");
  });

  it("keeps genuinely different numbers", () => {
    const input = toVCardInput({
      firstName: "Ada",
      lastName: "Lovelace",
      phones: [
        { number: "+1 555 0100", label: "Mobile" },
        { number: "+1 555 0199", label: "Work" },
      ],
    });
    expect(input.phones).toHaveLength(2);
  });
});

describe("a full contact round-trips into the vCard", () => {
  const full = toVCardData({
    firstName: "Ada",
    lastName: "Lovelace",
    organization: "Analytical Engines, Ltd",
    title: "Chief Mathematician",
    phones: [
      { label: "Mobile", number: "+1 555 0100" },
      { label: "Work", number: "+1 555 0199" },
    ],
    emails: [
      { label: "Work", address: "ada@example.com" },
      { label: "Personal", address: "ada@home.example" },
    ],
    websites: ["example.com", "https://blog.example.com"],
    socialLinks: [
      { platform: "LinkedIn", url: "https://linkedin.com/in/ada" },
      { platform: "GitHub", url: "https://github.com/ada" },
    ],
    street: "1 High St",
    city: "Bath",
    country: "UK",
    note: "Met at the Engine expo",
    photoDataUrl: "data:image/jpeg;base64,QUJD",
  });

  const vcf = buildVCard(toVCardInput(full), { includePhoto: true });
  const lines = vcf.replace(/\r\n[ \t]/g, "").trim().split("\r\n");
  const count = (prefix: string) =>
    lines.filter((l) => l.startsWith(prefix)).length;

  it("carries both phone numbers with their types", () => {
    expect(count("TEL")).toBe(2);
    expect(lines).toContain("TEL;TYPE=MOBILE:+1 555 0100");
    expect(lines).toContain("TEL;TYPE=WORK:+1 555 0199");
  });

  it("carries both email addresses", () => {
    expect(count("EMAIL")).toBe(2);
  });

  it("carries both websites and adds the missing scheme", () => {
    expect(count("URL")).toBe(2);
    expect(lines).toContain("URL:https://example.com");
  });

  it("carries both social profiles as X-SOCIALPROFILE", () => {
    expect(count("X-SOCIALPROFILE")).toBe(2);
    expect(lines).toContain(
      "X-SOCIALPROFILE;TYPE=LINKEDIN:https://linkedin.com/in/ada",
    );
  });

  it("carries the escaped organization, address, note and photo", () => {
    expect(lines).toContain("ORG:Analytical Engines\\, Ltd");
    expect(lines).toContain("ADR;TYPE=WORK:;;1 High St;Bath;;;UK");
    expect(lines).toContain("NOTE:Met at the Engine expo");
    expect(count("PHOTO")).toBe(1);
  });
});
