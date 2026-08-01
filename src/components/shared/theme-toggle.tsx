"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEMES = ["light", "dark", "system"] as const;

const THEME_ICON: Record<string, React.ReactNode> = {
  light: <Sun className="size-4" />,
  dark: <Moon className="size-4" />,
  system: <Monitor className="size-4" />,
};

const THEME_LABEL: Record<string, string> = {
  light: "Switch to dark mode",
  dark: "Switch to system theme",
  system: "Switch to light mode",
};

/** What the button says before it knows which theme is stored. */
const PLACEHOLDER_LABEL = "Toggle theme";

/*
  Reads false while the server renders and while React hydrates, true on every
  render after that.

  A store that never changes looks odd, but the two snapshots are the point:
  React reads the server one during hydration and the client one afterwards,
  which is exactly the "has the tree been hydrated yet" signal, and it gets it
  without a state update in an effect.
*/
const NEVER_CHANGES = () => () => {};
const HYDRATED = () => true;
const NOT_HYDRATED = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  /*
    The chosen theme lives in localStorage, which the server cannot read: it
    renders the "system" state while the browser's very first render already
    knows the real one. React saw a different icon and a different aria-label
    and threw the whole shell away — "Hydration failed because the server
    rendered HTML didn't match the client" on every page load.

    So the hydrating render deliberately agrees with the server and shows a
    placeholder. The real state appears on the render straight after, once
    React is done comparing the two trees.
  */
  const hydrated = useSyncExternalStore(NEVER_CHANGES, HYDRATED, NOT_HYDRATED);

  const current = theme ?? "system";

  const cycle = () => {
    const idx = THEMES.indexOf(current as (typeof THEMES)[number]);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      /*
        The placeholder is a real, working button — it is focusable, and a
        click cycles from the correct theme, because only the *rendering*
        waits for hydration. It has to announce as something, so it keeps a
        generic name until it can promise a specific one.
      */
      aria-label={
        hydrated
          ? (THEME_LABEL[current] ?? PLACEHOLDER_LABEL)
          : PLACEHOLDER_LABEL
      }
    >
      {hydrated ? (
        (THEME_ICON[current] ?? <Monitor className="size-4" />)
      ) : (
        // Holds the icon's space so the button does not resize on mount. Blank
        // rather than a guessed icon: a wrong icon for a frame reads as a bug.
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
