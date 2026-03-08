import { Menu, Tray, nativeImage } from "electron";

import type { AppSettings } from "@/shared/domain/settings";

import { resolveRuntimeIconPath } from "./assets";

interface AppTrayController {
  applySettings: (settings: AppSettings) => void;
  destroy: () => void;
  isEnabled: () => boolean;
}

interface CreateAppTrayOptions {
  onOpen: () => void;
  onQuit: () => void;
  onSnooze: (settings: AppSettings) => boolean;
}

function createTrayIcon() {
  return nativeImage
    .createFromPath(resolveRuntimeIconPath())
    .resize({ height: 18, width: 18 });
}

export function createAppTray({
  onOpen,
  onQuit,
  onSnooze,
}: CreateAppTrayOptions): AppTrayController {
  let tray: Tray | null = null;
  let settings: AppSettings | null = null;

  function rebuildMenu(): void {
    if (!tray || !settings) {
      return;
    }

    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          click: onOpen,
          label: "Open Zucchini",
        },
        {
          click: () => {
            if (settings) {
              onSnooze(settings);
            }
          },
          enabled: settings.reminderEnabled,
          label: `Snooze reminders for ${settings.reminderSnoozeMinutes} min`,
        },
        {
          type: "separator",
        },
        {
          click: onQuit,
          label: "Quit",
        },
      ])
    );
  }

  function ensureTray(): void {
    if (tray) {
      rebuildMenu();
      return;
    }

    tray = new Tray(createTrayIcon());
    tray.setToolTip("Zucchini");
    tray.on("click", onOpen);
    rebuildMenu();
  }

  function destroy(): void {
    tray?.destroy();
    tray = null;
  }

  function applySettings(nextSettings: AppSettings): void {
    settings = nextSettings;

    if (!nextSettings.minimizeToTray) {
      destroy();
      return;
    }

    ensureTray();
  }

  return {
    applySettings,
    destroy,
    isEnabled: () => settings?.minimizeToTray ?? false,
  };
}
