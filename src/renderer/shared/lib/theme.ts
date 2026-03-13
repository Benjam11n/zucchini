import type { ThemeMode } from "@/shared/domain/settings";

export const DARK_MODE_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function getSystemTheme(): ThemeMode {
  return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? "dark" : "light";
}
