// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, cleanup } from "@testing-library/react";
import { ThemeToggle } from "../theme-toggle";

/**
 * The toggle's first render has to be decided without the stored theme.
 *
 * Only the browser can read localStorage, so anything the server draws from it
 * is a guess, and a wrong guess makes React discard the tree it just received.
 * These tests pin the two halves of the fix: the pre-mount markup ignores the
 * theme entirely, and it is still a named button while it does.
 */

const themeState = vi.hoisted(() => ({ theme: "dark" }));
const setTheme = vi.hoisted(() => vi.fn());

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: themeState.theme, setTheme }),
}));

afterEach(() => {
  cleanup();
  themeState.theme = "dark";
});

describe("ThemeToggle", () => {
  it("renders the same markup whatever theme is stored, before mount", () => {
    themeState.theme = "dark";
    const asDark = renderToString(<ThemeToggle />);

    themeState.theme = "light";
    const asLight = renderToString(<ThemeToggle />);

    expect(asDark).toBe(asLight);
  });

  it("keeps an accessible name before mount", () => {
    // Rendering nothing until mounted would leave the sidebar with an unnamed
    // gap, so the placeholder has to carry a label of its own.
    expect(renderToString(<ThemeToggle />)).toContain('aria-label="Toggle theme"');
  });

  it("shows the stored theme once mounted", () => {
    themeState.theme = "dark";
    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to system theme" }),
    ).toBeTruthy();
  });
});
