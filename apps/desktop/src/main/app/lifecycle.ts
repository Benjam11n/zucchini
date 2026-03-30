/**
 * App lifecycle policy functions.
 *
 * Pure helpers that determine whether the app should hide to the system tray
 * on window close, quit when all windows are closed, or auto-start at login.
 * Decoupled from Electron APIs so they are easy to test.
 */
import type { AppSettings } from "@/shared/domain/settings";

export function buildLoginItemSettings(settings: AppSettings): {
  openAsHidden: boolean;
  openAtLogin: boolean;
} {
  return {
    openAsHidden: settings.minimizeToTray,
    openAtLogin: settings.launchAtLogin,
  };
}

export function shouldHideOnWindowClose(options: {
  isQuitting: boolean;
  trayEnabled: boolean;
}): boolean {
  return options.trayEnabled && !options.isQuitting;
}

export function shouldQuitWhenAllWindowsClosed(options: {
  platform: NodeJS.Platform;
  trayEnabled: boolean;
}): boolean {
  return !options.trayEnabled && options.platform !== "darwin";
}
