// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { VCardForm } from "../vcard-form";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { toVCardInput } from "@/lib/qr/encoders";
import { toVCardData } from "@/lib/qr/build-data";
import { buildVCard } from "@/lib/vcard/build";

/**
 * Renders the real form and drives it the way a person would, so the
 * repeatable-row wiring is covered even when browser automation is not
 * available.
 */

beforeEach(() => {
  useQREditorStore.getState().reset();
  useQREditorStore.getState().setContentType("vcard");
});

afterEach(cleanup);

const inputs = () => useQREditorStore.getState().inputData;

describe("VCardForm rendering", () => {
  it("shows every section needed for a full contact", () => {
    render(<VCardForm />);
    for (const legend of [
      "Phone numbers",
      "Email addresses",
      "Websites",
      "Social profiles",
      "Name",
      "Company",
      "Address",
    ]) {
      expect(screen.getByText(legend)).toBeTruthy();
    }
    expect(screen.getByText("Headshot")).toBeTruthy();
    expect(screen.getByText("How the contact is delivered")).toBeTruthy();
  });

  it("starts with no repeatable rows and an add button for each", () => {
    render(<VCardForm />);
    expect(screen.getByRole("button", { name: "Add phone" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add email" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add website" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add profile" })).toBeTruthy();
  });
});

describe("adding and removing rows", () => {
  it("adds a second phone number and keeps both", () => {
    render(<VCardForm />);

    fireEvent.click(screen.getByRole("button", { name: "Add phone" }));
    fireEvent.change(screen.getByLabelText("Phone 1"), {
      target: { value: "+1 555 0100" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add phone" }));
    fireEvent.change(screen.getByLabelText("Phone 2"), {
      target: { value: "+1 555 0199" },
    });

    expect(inputs().phones).toEqual([
      { label: "Mobile", number: "+1 555 0100" },
      { label: "Mobile", number: "+1 555 0199" },
    ]);
  });

  it("removes the right row", () => {
    render(<VCardForm />);
    fireEvent.click(screen.getByRole("button", { name: "Add phone" }));
    fireEvent.change(screen.getByLabelText("Phone 1"), {
      target: { value: "first" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add phone" }));
    fireEvent.change(screen.getByLabelText("Phone 2"), {
      target: { value: "second" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove phone 1" }));

    expect(inputs().phones).toEqual([{ label: "Mobile", number: "second" }]);
  });

  it("does not resurrect a removed row from the legacy field", () => {
    // Simulate a record saved before multi-value support.
    useQREditorStore.getState().setInputData({ phone: "+1 555 0100" });
    render(<VCardForm />);

    // The legacy number seeds row 1.
    expect((screen.getByLabelText("Phone 1") as HTMLInputElement).value).toBe(
      "+1 555 0100",
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove phone 1" }));
    expect(inputs().phones).toEqual([]);
    expect(inputs().phone).toBe("");
    expect(screen.queryByLabelText("Phone 1")).toBeNull();
  });

  it("adds emails, websites and social profiles independently", () => {
    render(<VCardForm />);

    fireEvent.click(screen.getByRole("button", { name: "Add email" }));
    fireEvent.change(screen.getByLabelText("Email 1"), {
      target: { value: "ada@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add website" }));
    fireEvent.change(screen.getByLabelText("Website 1"), {
      target: { value: "example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add profile" }));
    fireEvent.change(screen.getByLabelText("Profile 1"), {
      target: { value: "https://linkedin.com/in/ada" },
    });

    expect(inputs().emails).toEqual([
      { label: "Work", address: "ada@example.com" },
    ]);
    expect(inputs().websites).toEqual(["example.com"]);
    expect(inputs().socialLinks).toEqual([
      { platform: "LinkedIn", url: "https://linkedin.com/in/ada" },
    ]);
  });
});

describe("the form produces a complete vCard", () => {
  it("carries everything entered through to the .vcf", () => {
    render(<VCardForm />);

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Organization"), {
      target: { value: "Analytical Engines, Ltd" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add phone" }));
    fireEvent.change(screen.getByLabelText("Phone 1"), {
      target: { value: "+1 555 0100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add email" }));
    fireEvent.change(screen.getByLabelText("Email 1"), {
      target: { value: "ada@example.com" },
    });

    const vcf = buildVCard(toVCardInput(toVCardData(inputs())), {
      includePhoto: true,
    });
    const lines = vcf.replace(/\r\n[ \t]/g, "").trim().split("\r\n");

    expect(lines).toContain("FN:Ada Lovelace");
    expect(lines).toContain("ORG:Analytical Engines\\, Ltd");
    expect(lines).toContain("TEL;TYPE=MOBILE:+1 555 0100");
    expect(lines).toContain("EMAIL;TYPE=WORK:ada@example.com");
  });
});

describe("delivery mode", () => {
  it("offers both modes with the direct one selected by default", () => {
    render(<VCardForm />);
    const direct = screen.getByRole("button", { name: /Encode in the code/ });
    const hosted = screen.getByRole("button", { name: /Link to contact file/ });
    expect(direct.getAttribute("aria-pressed")).toBe("true");
    expect(hosted.getAttribute("aria-pressed")).toBe("false");
  });

  it("switches to the hosted mode and disables direct encoding once a photo exists", () => {
    useQREditorStore.getState().setInputData({
      photoDataUrl: "data:image/jpeg;base64,QUJD",
      hostedContact: true,
    });
    render(<VCardForm />);

    const direct = screen.getByRole("button", { name: /Encode in the code/ });
    const hosted = screen.getByRole("button", { name: /Link to contact file/ });

    expect(hosted.getAttribute("aria-pressed")).toBe("true");
    expect((direct as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText(/A QR code holds at most 2,953 bytes/),
    ).toBeTruthy();
  });

  it("shows a live byte budget while encoding directly", () => {
    render(<VCardForm />);
    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Ada" },
    });
    expect(screen.getByText(/bytes used at error correction/)).toBeTruthy();
  });
});
