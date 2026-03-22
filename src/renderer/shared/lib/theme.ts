export const DARK_MODE_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function getSystemTheme(): "dark" | "light" {
  return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? "dark" : "light";
}
