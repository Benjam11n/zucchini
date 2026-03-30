/**
 * Theme mode application hook.
 *
 * Toggles the `dark` class on `<html>` based on the user's theme preference
 * and current system theme. When themeMode is `"system"`, defers to the
 * system theme value.
 */
import { useEffect } from "react";

import type { ThemeMode } from "@/shared/domain/settings";

interface UseApplyThemeModeOptions {
  themeMode: ThemeMode | null | undefined;
  systemTheme: ThemeMode;
}

export function useApplyThemeMode({
  systemTheme,
  themeMode,
}: UseApplyThemeModeOptions): void {
  useEffect(() => {
    const resolvedTheme = themeMode === "system" ? systemTheme : themeMode;

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [systemTheme, themeMode]);
}
