import React from "react";
import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/index.css";
import { ThemeContext, type ThemeContextValue } from "../src/ui/theme/ThemeContext";
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
      <Story />
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
