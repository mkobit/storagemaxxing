import { createContext } from "react";
import type { ResolvedTheme, ThemePreference } from "./ThemePreference";

export type ThemeContextValue = {
  readonly preference: ThemePreference;
  readonly resolvedTheme: ResolvedTheme;
  readonly setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
