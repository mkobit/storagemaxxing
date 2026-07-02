import { z } from "zod";

export const THEME_STORAGE_KEY = "storagemaxxing-theme";

export const ThemePreferenceSchema = z
  .enum(["light", "dark", "system"])
  .catch("system");

export type ThemePreference = z.infer<typeof ThemePreferenceSchema>;

export type ResolvedTheme = Exclude<ThemePreference, "system">;
