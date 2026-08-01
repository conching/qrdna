import { readFileSync } from "node:fs";
import path from "node:path";

import { test, expect, type Page } from "@playwright/test";

/**
 * The one authenticated journey.
 *
 * Every functional bug this project has shipped lived on this path and none
 * were caught, because verification never signed in: `curl` hits public routes,
 * unit tests have no UI, and a component rendered in isolation cannot tell you
 * that the export encodes the wrong string. Four shipped bugs — the export that
 * encoded the marketing homepage, the contact card that advertised the redirect
 * handler, the dead Duplicate button, and a copy that could not be edited — all
 * sat inside this single walk.
 *
 * So it walks it: sign in, build a contact card with a headshot, open it,
 * export the SVG, **decode the exported symbol**, and duplicate it. The decode
 * is the load-bearing step. An export that renders is not an export that is
 * correct — a QR pointing at the wrong URL still looks like a QR.
 */

/** UMD build, injected into the page so decoding runs where the canvas is. */
const JSQR_PATH = path.join(
  __dirname,
  "..",
  "node_modules",
  "jsqr",
  "dist",
  "jsQR.js",
);

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

/**
 * A valid 8x8 RGB PNG. What it depicts does not matter — attaching *any* photo
 * is what switches a vCard into hosted mode, which is the branch under test.
 */
const HEADSHOT = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAZklEQVR4nGNgYOHgERCRkFFQ0dAxMLGw" +
    "cXDx8AkIiYhhQBdISMnIKSipqGFAF2ho6eiZMGXGHAZ0gQVLVqzZsGXHHgZ0gQNHTpy5cOXGHQZ0gQdP" +
    "Xrz58OXHHwYMAagrGdAFYK4EAPrZXoFDT33gAAAAAElFTkSuQmCC",
  "base64",
);

test.describe("vCard code lifecycle", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "Set E2E_EMAIL and E2E_PASSWORD (see scripts/ensure-e2e-user.mjs)",
  );

  /** Codes created by the run, torn down through the same API the UI uses. */
  const createdIds: string[] = [];

  test.afterEach(async ({ page }) => {
    for (const id of createdIds.splice(0)) {
      await page.request.delete(`/api/v1/qr/${id}`).catch(() => {});
    }
  });

  test("create with headshot, export SVG, decode it, then duplicate", async ({
    page,
  }) => {
    // -- Sign in -------------------------------------------------------------
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in with email/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // -- Build a contact card with a headshot --------------------------------
    await page.goto("/create");

    const codeName = `E2E contact ${Date.now()}`;
    await page.getByRole("button", { name: "vCard", exact: true }).click();
    await page.locator("#qr-name").fill(codeName);
    await page.locator("#firstName").fill("Ada");
    await page.locator("#lastName").fill("Lovelace");

    // A photo cannot fit inside a QR, so attaching one is what switches the
    // code into hosted mode — the QR then encodes /c/<shortCode>.
    await page.locator("#headshot").setInputFiles({
      name: "headshot.png",
      mimeType: "image/png",
      buffer: HEADSHOT,
    });
    await expect(
      page.getByRole("button", { name: /replace photo/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page).toHaveURL(/\/qr\/[0-9a-f-]{36}/);

    const originalId = page.url().split("/qr/")[1];
    createdIds.push(originalId);

    // A cold reload before anything else: arriving from /create leaves the
    // editor store already holding this contact, so every assertion below
    // would pass on primed state rather than on what the page rebuilds from
    // the saved row.
    await page.reload();
    await expect(page.locator("#firstName")).toHaveValue("Ada");
    await expect(page.locator("#url")).toHaveCount(0);

    // -- The detail page must advertise the contact link, not the redirect ---
    const shortCode = await shortCodeOf(page, originalId);
    expect(shortCode, "a hosted contact card needs its own short code").toBeTruthy();
    await expect(page.getByText("Contact link")).toBeVisible();
    await expect(page.getByText(`/c/${shortCode}`, { exact: false }).first())
      .toBeVisible();

    // -- Export SVG ----------------------------------------------------------
    const svg = await exportSvg(page);

    // -- Decode the exported symbol ------------------------------------------
    // This is the assertion that would have caught the shipped bug where every
    // static export encoded the literal string "https://qrdna.io".
    const decoded = await decodeSvgQR(page, svg);
    expect(decoded, "the exported SVG did not decode as a QR code").toBeTruthy();
    expect(decoded).toContain(`/c/${shortCode}`);

    // -- Duplicate -----------------------------------------------------------
    await page.getByRole("button", { name: /^duplicate$/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/qr/(?!${originalId})[0-9a-f-]{36}`),
    );

    const copyId = page.url().split("/qr/")[1];
    createdIds.push(copyId);
    expect(copyId).not.toBe(originalId);

    // The copy arrives unpublished, so its contact link is not live while it
    // still holds the original's details.
    const publishPanel = page.getByTestId("publish-panel");
    await expect(publishPanel).toBeVisible();
    await expect(publishPanel.getByText("Not published")).toBeVisible();

    // -- And it is editable before publishing --------------------------------
    const firstName = page.locator("#firstName");
    await expect(firstName).toHaveValue("Ada");
    await firstName.fill("Grace");
    await page.locator("#lastName").fill("Hopper");
    await expect(page.getByTestId("content-dirty-state")).toHaveText(
      "Unsaved changes",
    );

    await page.getByRole("button", { name: /save content/i }).click();
    await expect(page.getByTestId("content-dirty-state")).toHaveText(
      "All changes saved",
    );

    await page.reload();
    await expect(page.locator("#firstName")).toHaveValue("Grace");

    // A draft is still exportable — that is the point of editing before
    // publishing — and its symbol must encode its own link, not the original's.
    const copyShortCode = await shortCodeOf(page, copyId);
    expect(copyShortCode).not.toBe(shortCode);
    const draftSvg = await exportSvg(page);
    expect(await decodeSvgQR(page, draftSvg)).toContain(`/c/${copyShortCode}`);

    // -- Publishing is explicit ---------------------------------------------
    await page.getByTestId("publish-button").click();
    await expect(page.getByTestId("unpublish-button")).toBeVisible();

    const vcf = await page.request.get(`/api/v1/contact/${copyShortCode}`);
    expect(vcf.ok(), "a published contact card must serve its .vcf").toBe(true);
    expect(await vcf.text()).toContain("Grace");
  });
});

/** Drive the detail page's export dialog and return the downloaded SVG. */
async function exportSvg(page: Page): Promise<string> {
  await page.getByRole("button", { name: /export qr code/i }).click();
  await page.locator("#detail-export-format").click();
  await page.getByRole("option", { name: "SVG" }).click();

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /^download$/i }).click(),
  ]).then(([d]) => d);

  const svgPath = await download.path();
  expect(svgPath, "the export produced no file").toBeTruthy();
  const svg = readFileSync(svgPath!, "utf8");
  expect(svg).toContain("<svg");
  return svg;
}

/** Read a saved code's short code back through the API the UI reads. */
async function shortCodeOf(page: Page, id: string): Promise<string | null> {
  const res = await page.request.get(`/api/v1/qr/${id}`);
  expect(res.ok()).toBe(true);
  return (await res.json()).data.short_code;
}

/**
 * Decode a QR code out of exported SVG markup.
 *
 * Rasterising happens in the page rather than in Node: the browser already has
 * an SVG renderer and a canvas, so this needs no native image dependency, and
 * it decodes the same bytes the user downloaded.
 */
async function decodeSvgQR(page: Page, svg: string): Promise<string | null> {
  await page.addScriptTag({ path: JSQR_PATH });
  return page.evaluate(async (markup: string) => {
    const SIZE = 512;
    const url = URL.createObjectURL(
      new Blob([markup], { type: "image/svg+xml" }),
    );
    try {
      const img = new Image();
      img.width = SIZE;
      img.height = SIZE;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("SVG failed to rasterise"));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      // The exported SVG may be transparent; jsQR needs light-on-dark contrast.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);

      const { data, width, height } = ctx.getImageData(0, 0, SIZE, SIZE);
      const jsQR = (window as unknown as { jsQR: typeof import("jsqr").default })
        .jsQR;
      return jsQR(data, width, height)?.data ?? null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }, svg);
}
