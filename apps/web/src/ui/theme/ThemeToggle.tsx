import React from "react";
import { useTheme } from "./useTheme";
import type { ResolvedTheme } from "./ThemePreference";

export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setPreference } = useTheme();
  const nextTheme: ResolvedTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="px-3 py-1 rounded bg-surface-raised border border-border-default text-text-primary hover:bg-surface-hover transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]"
      onClick={() => setPreference(nextTheme)}
      data-testid="theme-toggle"
      aria-label={`Switch to ${nextTheme} theme`}
    >
      {resolvedTheme === "dark" ? "🌙" : "☀️"}
    </button>
  );
};
