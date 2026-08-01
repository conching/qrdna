import { test, expect, type Page } from "@playwright/test";

/**
 * Hydration has to be silent on every page inside the app shell.
 *
 * A mismatch is not a cosmetic warning: React throws away the server tree and
 * re-renders the whole subtree on the client, so the first paint is wrong and
 * the work is done twice on every navigation. It is also invisible to every
 * other kind of test — the markup renders, the component tests pass, and
 * nothing fails until you open a real browser and listen.
 *
 * The theme toggle shipped exactly that bug: the server had no localStorage so
 * it drew the "system" state, while the client's first render read the stored
 * theme and drew a different icon and a different aria-label.
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

/** Pages that render the sidebar, and so the theme toggle with it. */
const SHELL_ROUTES = ["/analytics", "/create", "/dashboard"];

test.describe("app shell hydration", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "Set E2E_EMAIL and E2E_PASSWORD (see scripts/ensure-e2e-user.mjs)",
  );

  test("hydrates without errors on every shell page", async ({ page }) => {
    const errors = collectHydrationErrors(page);

    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in with email/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Signing in leaves next-themes' key in localStorage, which is the state
    // the server cannot see and therefore cannot render. Set it explicitly so
    // the run does not depend on what a previous test left behind.
    await page.evaluate(() => localStorage.setItem("theme", "dark"));

    for (const route of SHELL_ROUTES) {
      // A full load, not a client-side push: only a fresh document hydrates.
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(
        page.getByRole("button", { name: /theme|mode/i }).first(),
      ).toBeVisible();
    }

    expect(errors, errors.join("\n\n")).toEqual([]);
  });
});

/**
 * Watch both channels React reports a mismatch on.
 *
 * `pageerror` catches the uncaught throw; the console carries the "Hydration
 * failed" message when React recovers instead of throwing. Listening to only
 * one of them makes the probe pass for the wrong reason.
 */
function collectHydrationErrors(page: Page): string[] {
  const errors: string[] = [];
  const isHydration = (text: string) =>
    /hydrat|didn't match|did not match|server rendered HTML/i.test(text);

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (isHydration(text)) errors.push(`console.error: ${text}`);
  });

  return errors;
}
