import { describe, it, expect } from "vitest";
import { buildQRData, toVCardData, PLACEHOLDER_CODE } from "../build-data";
import { encodeQRData, parsePhotoDataUrl } from "../encoders";
import { byteLength, QR_BYTE_CAPACITY } from "@/lib/vcard/build";

const TINY_JPEG_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

describe("toVCardData", () => {
  it("reads the scalar fields off the loose editor map", () => {
    const data = toVCardData({
      firstName: "Ada",
      lastName: "Lovelace",
      organization: "Analytical Engines",
    });
    expect(data.firstName).toBe("Ada");
    expect(data.lastName).toBe("Lovelace");
    expect(data.organization).toBe("Analytical Engines");
  });

  it("keeps repeatable phone and email rows and drops the empty ones", () => {
    const data = toVCardData({
      firstName: "Ada",
      lastName: "Lovelace",
      phones: [
        { number: "+1 555 0100", label: "cell" },
        { number: "  ", label: "work" },
      ],
      emails: [{ address: "ada@example.com", label: "work" }],
    });
    expect(data.phones).toEqual([{ number: "+1 555 0100", label: "cell" }]);
    expect(data.emails).toEqual([
      { address: "ada@example.com", label: "work" },
    ]);
  });

  it("normalises a missing photo to null rather than an empty string", () => {
    expect(toVCardData({ firstName: "A", lastName: "B" }).photoDataUrl).toBeNull();
  });
});

describe("buildQRData for vCards", () => {
  const base = { firstName: "Ada", lastName: "Lovelace" };

  it("returns null until there is a name to encode", () => {
    expect(buildQRData("vcard", {})).toBeNull();
    expect(buildQRData("vcard", { firstName: "Ada" })).not.toBeNull();
  });

  it("encodes the contact directly when not hosted", () => {
    const result = buildQRData("vcard", base);
    expect(result?.type).toBe("vcard");
    expect(encodeQRData(result!)).toContain("BEGIN:VCARD");
  });

  it("encodes a short link instead when the contact is hosted", () => {
    const result = buildQRData("vcard", { ...base, hostedContact: true }, "aBcDeFg");
    expect(result?.type).toBe("url");
    expect(encodeQRData(result!)).toMatch(/\/c\/aBcDeFg$/);
  });

  it("previews an unsaved hosted contact at the size the saved one will be", () => {
    const preview = buildQRData("vcard", { ...base, hostedContact: true });
    const saved = buildQRData("vcard", { ...base, hostedContact: true }, "aBcDeFg");
    expect(PLACEHOLDER_CODE).toHaveLength(7);
    // Same payload length means the same QR version, so the preview does not
    // visibly change shape the moment the user saves.
    expect(byteLength(encodeQRData(preview!))).toBe(
      byteLength(encodeQRData(saved!)),
    );
  });

  it("keeps the hosted payload far inside QR capacity even with a photo attached", () => {
    const result = buildQRData(
      "vcard",
      { ...base, hostedContact: true, photoDataUrl: TINY_JPEG_DATA_URL },
      "aBcDeFg",
    );
    const encoded = encodeQRData(result!);
    expect(byteLength(encoded)).toBeLessThan(120);
    // The photo must not leak into the QR payload.
    expect(encoded).not.toContain("PHOTO");
    expect(encoded).not.toContain("base64");
  });

  it("never embeds the photo in a directly-encoded contact", () => {
    const result = buildQRData("vcard", {
      ...base,
      photoDataUrl: TINY_JPEG_DATA_URL,
    });
    expect(encodeQRData(result!)).not.toContain("PHOTO");
  });
});

describe("parsePhotoDataUrl", () => {
  it("splits a jpeg data URL into type and payload", () => {
    const photo = parsePhotoDataUrl(TINY_JPEG_DATA_URL);
    expect(photo?.type).toBe("JPEG");
    expect(photo?.base64.startsWith("/9j/")).toBe(true);
  });

  it("recognises png", () => {
    expect(parsePhotoDataUrl("data:image/png;base64,QUJD")?.type).toBe("PNG");
  });

  it("rejects anything that is not an inline image", () => {
    expect(parsePhotoDataUrl(null)).toBeNull();
    expect(parsePhotoDataUrl("")).toBeNull();
    expect(parsePhotoDataUrl("https://example.com/a.jpg")).toBeNull();
    expect(parsePhotoDataUrl("data:text/html;base64,QUJD")).toBeNull();
    expect(parsePhotoDataUrl("data:image/gif;base64,QUJD")).toBeNull();
  });
});

describe("buildQRData for the other content types", () => {
  it("adds a scheme to a bare URL", () => {
    expect(encodeQRData(buildQRData("url", { url: "example.com" })!)).toBe(
      "https://example.com",
    );
  });

  it("escapes wifi passwords containing separators", () => {
    const encoded = encodeQRData(
      buildQRData("wifi", { ssid: "Cafe;1", password: "p:a;ss" })!,
    );
    expect(encoded).toContain("S:Cafe\\;1");
    expect(encoded).toContain("P:p\\:a\\;ss");
  });

  it("returns null for geo at the null island", () => {
    expect(buildQRData("geo", { latitude: 0, longitude: 0 })).toBeNull();
    expect(buildQRData("geo", { latitude: 51.5, longitude: -0.1 })).not.toBeNull();
  });

  it("requires both a title and a start date for events", () => {
    expect(buildQRData("event", { title: "Launch" })).toBeNull();
    expect(
      buildQRData("event", { title: "Launch", startDate: "2026-08-01T10:00" }),
    ).not.toBeNull();
  });

  it("keeps a plain URL code well within capacity", () => {
    const encoded = encodeQRData(buildQRData("url", { url: "qrdna.io/c/aBcDeFg" })!);
    expect(byteLength(encoded)).toBeLessThan(QR_BYTE_CAPACITY.H);
  });
});
