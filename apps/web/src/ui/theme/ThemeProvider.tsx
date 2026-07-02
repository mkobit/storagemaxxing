import React, { useCallback, useEffect, useState } from "react";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";
import {
  THEME_STORAGE_KEY,
  ThemePreferenceSchema,
  type ResolvedTheme,
  type ThemePreference,
} from "./ThemePreference";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

const resolveSystemTheme = (): ResolvedTheme =>
  window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";

const readStoredPreference = (): ThemePreference =>
  ThemePreferenceSchema.parse(window.localStorage.getItem(THEME_STORAGE_KEY));

export type ThemeProviderProps = {
  readonly children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    readStoredPreference,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(
    resolveSystemTheme,
  );

  useEffect(() => {
    const media = window.matchMedia(SYSTEM_DARK_QUERY);
    const onChange = (event: MediaQueryListEvent): void =>
      setSystemTheme(event.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === "system" ? systemTheme : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setPreferenceState(next);
  }, []);

  const value: ThemeContextValue = { preference, resolvedTheme, setPreference };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
