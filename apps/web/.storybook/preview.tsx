import React from "react";
import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/index.css";
import {
  ThemeContext,
  type ThemeContextValue,
} from "../src/ui/theme/ThemeContext";
import type { ResolvedTheme } from "../src/ui/theme/ThemePreference";

// Storybook's toolbar drives theme deterministically -- ThemeProvider's own
// localStorage/prefers-color-scheme read path is bypassed here on purpose
// (see design.md Decision 2 / Risks) so switching the toolbar always wins.
const withTheme: Decorator = (Story, context) => {
  const resolvedTheme = context.globals.theme as ResolvedTheme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");

  const value: ThemeContextValue = {
    preference: resolvedTheme,
    resolvedTheme,
    setPreference: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* Mirrors App.tsx's root wrapper (bg-surface-sunken + text-text-primary)
          so isolated stories inherit the same ambient surface/text colors as
          the real app -- without it, dark-theme stories render on the raw
          white iframe background and fail axe's color-contrast check. */}
      <div className="bg-surface-sunken p-4 text-text-primary">
        <Story />
      </div>
    </ThemeContext.Provider>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Light or dark theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
};

export default preview;
