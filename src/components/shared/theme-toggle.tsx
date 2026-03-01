"use client";

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

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

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
      aria-label={THEME_LABEL[current] ?? "Toggle theme"}
    >
      {THEME_ICON[current] ?? <Monitor className="size-4" />}
    </Button>
  );
}
