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
