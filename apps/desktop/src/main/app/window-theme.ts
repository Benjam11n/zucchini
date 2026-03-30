/**
 * Window theme mode application.
 *
 * Syncs Electron's `nativeTheme.themeSource` with the user's preference
 * and updates the background color of all open windows to match the
 * current light/dark mode.
 */
import { BrowserWindow, nativeTheme } from "electron";

import type { ThemeMode } from "@/shared/domain/settings";

export function getWindowBackgroundColor(): string {
  return nativeTheme.shouldUseDarkColors ? "#18231e" : "#f7f3e8";
}

export function applyWindowThemeMode(themeMode: ThemeMode): void {
  nativeTheme.themeSource = themeMode;

  for (const window of BrowserWindow.getAllWindows()) {
    window.setBackgroundColor(getWindowBackgroundColor());
  }
}
