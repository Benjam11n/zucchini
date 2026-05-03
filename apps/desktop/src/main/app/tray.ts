/**
 * System tray creation and management.
 *
 * Creates the macOS/Windows system tray icon with a context menu for
 * opening the main window, focus widget, snoozing reminders, and quitting.
 * Respects the `minimizeToTray` setting to show/hide the tray icon.
 */
import { electronAppTrayShell } from "@/main/app/adapters";
import type { AppTrayShellPort } from "@/main/app/ports";
import type { AppSettings } from "@/shared/domain/settings";

interface AppTrayController {
  applySettings: (settings: AppSettings) => void;
  destroy: () => void;
  isEnabled: () => boolean;
}

interface CreateAppTrayOptions {
  shell?: AppTrayShellPort;
  onOpen: () => void;
  onOpenWidget: () => void;
  onQuit: () => void;
  onSnooze: (settings: AppSettings) => boolean;
}

function hasTrayMenuChanged(
  previousSettings: AppSettings | null,
  nextSettings: AppSettings
): boolean {
  if (!previousSettings) {
    return true;
  }

  return (
    previousSettings.reminderEnabled !== nextSettings.reminderEnabled ||
    previousSettings.reminderSnoozeMinutes !==
      nextSettings.reminderSnoozeMinutes
  );
}

function createTrayIcon(shell: AppTrayShellPort) {
  return shell
    .createImageFromPath(shell.resolveIconPath())
    .resize({ height: 18, width: 18 });
}

export function createAppTray({
  shell = electronAppTrayShell,
  onOpen,
  onOpenWidget,
  onQuit,
  onSnooze,
}: CreateAppTrayOptions): AppTrayController {
  let tray: ReturnType<AppTrayShellPort["createTray"]> | null = null;
  let settings: AppSettings | null = null;

  function rebuildMenu(): void {
    if (!tray || !settings) {
      return;
    }

    tray.setContextMenu(
      shell.buildMenuFromTemplate([
        {
          click: onOpen,
          label: "Open Zucchini",
        },
        {
          click: onOpenWidget,
          label: "Show Focus Widget",
        },
        {
          type: "separator",
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

    tray = shell.createTray(createTrayIcon(shell));
    tray.setToolTip("Zucchini");
    tray.on("click", onOpen);
    rebuildMenu();
  }

  function destroy(): void {
    tray?.destroy();
    tray = null;
  }

  function applySettings(nextSettings: AppSettings): void {
    const previousSettings = settings;
    settings = nextSettings;

    if (!nextSettings.minimizeToTray) {
      destroy();
      return;
    }

    if (!tray) {
      ensureTray();
      return;
    }

    if (hasTrayMenuChanged(previousSettings, nextSettings)) {
      rebuildMenu();
    }
  }

  return {
    applySettings,
    destroy,
    isEnabled: () => settings?.minimizeToTray ?? false,
  };
}
