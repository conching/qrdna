import { describe, it, expect } from "vitest";
import {
  buildVCard,
  escapeValue,
  foldLine,
  byteLength,
  comfortableCapacity,
  QR_BYTE_CAPACITY,
  type VCardInput,
} from "../build";

const base: VCardInput = { firstName: "Ada", lastName: "Lovelace" };

/** Reverse the RFC 2426 folding so tests can assert on logical lines. */
function unfold(vcf: string): string[] {
  return vcf.replace(/\r\n[ \t]/g, "").trim().split("\r\n");
}

function propertyValue(vcf: string, prop: string): string | undefined {
  const line = unfold(vcf).find((l) => l.startsWith(`${prop}:`) || l.startsWith(`${prop};`));
  if (!line) return undefined;
  return line.slice(line.indexOf(":") + 1);
}

describe("escapeValue", () => {
  it("escapes the structural characters", () => {
    expect(escapeValue("Smith, Jones & Co")).toBe("Smith\\, Jones & Co");
    expect(escapeValue("a;b")).toBe("a\\;b");
    expect(escapeValue("back\\slash")).toBe("back\\\\slash");
  });

  it("escapes newlines rather than emitting a raw line break", () => {
    expect(escapeValue("line one\nline two")).toBe("line one\\nline two");
    expect(escapeValue("crlf\r\nhere")).toBe("crlf\\nhere");
  });

  it("escapes the backslash before the other characters, not after", () => {
    // A naive ordering turns "\," into "\\\\," — double-escaping the backslash
    // that was added for the comma.
    expect(escapeValue("a\\,b")).toBe("a\\\\\\,b");
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    expect(foldLine("NOTE:short")).toBe("NOTE:short");
  });

  it("folds at 75 octets with a leading space on continuations", () => {
    const line = "NOTE:" + "x".repeat(200);
    const folded = foldLine(line);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(byteLength(parts[0])).toBeLessThanOrEqual(75);
    for (const cont of parts.slice(1)) {
      expect(cont.startsWith(" ")).toBe(true);
      expect(byteLength(cont)).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, "")).toBe(line);
  });

  it("does not split a multi-byte character across a fold", () => {
    // Each emoji is 4 bytes; folding on character index would corrupt them.
    const line = "NOTE:" + "😀".repeat(40);
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
    expect(folded).not.toContain("�");
    for (const part of folded.split("\r\n")) {
      expect(byteLength(part)).toBeLessThanOrEqual(75);
    }
  });

  it("counts octets not characters when deciding to fold", () => {
    // 30 CJK characters = 90 bytes but only 30 JS chars.
    const line = "NOTE:" + "漢".repeat(30);
    expect(line.length).toBeLessThan(75);
    expect(byteLength(line)).toBeGreaterThan(75);
    expect(foldLine(line).split("\r\n").length).toBeGreaterThan(1);
  });
});

describe("buildVCard structure", () => {
  it("opens and closes correctly and uses CRLF throughout", () => {
    const vcf = buildVCard(base);
    expect(vcf.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(vcf.endsWith("END:VCARD\r\n")).toBe(true);
    // No bare LF anywhere — Outlook rejects LF-only vCards.
    expect(/[^\r]\n/.test(vcf)).toBe(false);
  });

  it("writes N as Family;Given;;; and a matching FN", () => {
    const vcf = buildVCard(base);
    expect(propertyValue(vcf, "N")).toBe("Lovelace;Ada;;;");
    expect(propertyValue(vcf, "FN")).toBe("Ada Lovelace");
  });

  it("escapes a comma in the organization instead of truncating the field", () => {
    const vcf = buildVCard({ ...base, organization: "Smith, Jones & Co" });
    expect(propertyValue(vcf, "ORG")).toBe("Smith\\, Jones & Co");
  });

  it("escapes semicolons inside address parts without breaking the structure", () => {
    const vcf = buildVCard({
      ...base,
      address: { street: "1 High St; Unit 4", city: "Bath", country: "UK" },
    });
    const adr = propertyValue(vcf, "ADR");
    expect(adr).toBe(";;1 High St\\; Unit 4;Bath;;;UK");
    // Seven structured components means six unescaped separators.
    expect(adr!.replace(/\\;/g, "").split(";").length).toBe(7);
  });
});

describe("buildVCard multi-value fields", () => {
  it("emits one TEL per phone with its type", () => {
    const vcf = buildVCard({
      ...base,
      phones: [
        { number: "+1 555 0100", label: "cell" },
        { number: "+1 555 0199", label: "work" },
      ],
    });
    const lines = unfold(vcf).filter((l) => l.startsWith("TEL"));
    expect(lines).toEqual([
      "TEL;TYPE=CELL:+1 555 0100",
      "TEL;TYPE=WORK:+1 555 0199",
    ]);
  });

  it("emits one EMAIL per address and skips blanks", () => {
    const vcf = buildVCard({
      ...base,
      emails: [
        { address: "ada@example.com", label: "work" },
        { address: "   " },
      ],
    });
    const lines = unfold(vcf).filter((l) => l.startsWith("EMAIL"));
    expect(lines).toEqual(["EMAIL;TYPE=WORK:ada@example.com"]);
  });

  it("adds a scheme to bare website hosts", () => {
    const vcf = buildVCard({ ...base, websites: ["example.com"] });
    expect(propertyValue(vcf, "URL")).toBe("https://example.com");
  });

  it("leaves an existing scheme alone", () => {
    const vcf = buildVCard({ ...base, websites: ["http://example.com/x"] });
    expect(propertyValue(vcf, "URL")).toBe("http://example.com/x");
  });
});

describe("buildVCard photo handling", () => {
  const photo = { base64: "QUJD", type: "JPEG" as const };

  it("embeds the photo with ENCODING=b by default", () => {
    const vcf = buildVCard({ ...base, photo });
    expect(unfold(vcf).some((l) => l.startsWith("PHOTO;ENCODING=b;TYPE=JPEG:"))).toBe(true);
    expect(propertyValue(vcf, "PHOTO")).toBe("QUJD");
  });

  it("omits the photo when includePhoto is false", () => {
    const vcf = buildVCard({ ...base, photo }, { includePhoto: false });
    expect(vcf).not.toContain("PHOTO");
  });

  it("survives a photo long enough to require folding", () => {
    const big = { base64: "A".repeat(4000), type: "JPEG" as const };
    const vcf = buildVCard({ ...base, photo: big });
    expect(propertyValue(vcf, "PHOTO")).toBe("A".repeat(4000));
    for (const part of vcf.trimEnd().split("\r\n")) {
      expect(byteLength(part)).toBeLessThanOrEqual(75);
    }
  });

  it("omits REV when asked, so the QR payload is stable across renders", () => {
    const a = buildVCard(base, { includeRev: false });
    const b = buildVCard(base, { includeRev: false });
    expect(a).toBe(b);
    expect(a).not.toContain("REV:");
  });
});

describe("QR capacity guidance", () => {
  it("orders capacity by error-correction level", () => {
    expect(QR_BYTE_CAPACITY.L).toBeGreaterThan(QR_BYTE_CAPACITY.M);
    expect(QR_BYTE_CAPACITY.M).toBeGreaterThan(QR_BYTE_CAPACITY.Q);
    expect(QR_BYTE_CAPACITY.Q).toBeGreaterThan(QR_BYTE_CAPACITY.H);
  });

  it("keeps a plain contact well inside the comfortable ceiling", () => {
    const vcf = buildVCard(
      {
        ...base,
        organization: "Analytical Engines Ltd",
        title: "Mathematician",
        phones: [{ number: "+1 555 0100", label: "cell" }],
        emails: [{ address: "ada@example.com" }],
        websites: ["example.com"],
      },
      { includePhoto: false, includeRev: false },
    );
    expect(byteLength(vcf)).toBeLessThan(comfortableCapacity("M"));
  });

  it("confirms an embedded headshot cannot fit in any QR code", () => {
    // 20 KB is a small headshot; base64 inflates it by ~4/3.
    const photo = { base64: "A".repeat(20_000 * 1.34), type: "JPEG" as const };
    const vcf = buildVCard({ ...base, photo });
    expect(byteLength(vcf)).toBeGreaterThan(QR_BYTE_CAPACITY.L);
  });
});
