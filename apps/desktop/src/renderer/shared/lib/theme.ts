/**
 * Theme utility functions.
 *
 * Provides the dark mode media query constant and a helper to read the
 * current OS-level theme preference.
 */
export const DARK_MODE_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function getSystemTheme(): "dark" | "light" {
  return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? "dark" : "light";
}
