import { useEffect, useState } from "react";

import {
  DARK_MODE_MEDIA_QUERY,
  getSystemTheme,
} from "@/renderer/shared/lib/theme";
import type { ThemeMode } from "@/shared/domain/settings";

export function useSystemTheme(): ThemeMode {
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(() =>
    getSystemTheme()
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY);
    const syncSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  return systemTheme;
}
