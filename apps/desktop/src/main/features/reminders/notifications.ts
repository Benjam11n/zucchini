/**
 * Desktop notification delivery.
 *
 * Sends Electron `Notification` instances for habit reminders, including
 * catch-up, snoozed, midnight warning, and missed-reminder variants.
 * Queries the macOS native addon (when available) to check for
 * Do Not Disturb and screen lock state before sending.
 */
import path from "node:path";

import { app, nativeImage, Notification } from "electron";

import type { DesktopNotificationStatus } from "@/shared/contracts/habits-api";

import { hasNativeAddonBinary } from "./native-addon";

interface MacOsNotificationStateModule {
  getNotificationState: () => Promise<
    | "DO_NOT_DISTURB"
    | "SESSION_ON_CONSOLE_KEY"
    | "SESSION_SCREEN_IS_LOCKED"
    | "UNKNOWN"
    | "UNKNOWN_ERROR"
  >;
}

interface WindowsNotificationStateModule {
  getNotificationState: () =>
    | "QUNS_ACCEPTS_NOTIFICATIONS"
    | "QUNS_APP"
    | "QUNS_BUSY"
    | "QUNS_NOT_PRESENT"
    | "QUNS_PRESENTATION_MODE"
    | "QUNS_QUIET_TIME"
    | "QUNS_RUNNING_D3D_FULL_SCREEN"
    | "UNKNOWN_ERROR";
}

const warnedMissingAddons = new Set<string>();

function resolveMascotAssetPath(filename: string): string {
  const assetBaseDir = app.isPackaged
    ? ["dist", "mascot"]
    : ["public", "mascot"];

  return path.join(app.getAppPath(), ...assetBaseDir, filename);
}

function createBlockedStatus(
  reason: DesktopNotificationStatus["reason"]
): DesktopNotificationStatus {
  return {
    availability: "blocked",
    reason,
  };
}

function createUnknownStatus(): DesktopNotificationStatus {
  return {
    availability: "unknown",
    reason: "platform-error",
  };
}

function createAvailableStatus(): DesktopNotificationStatus {
  return {
    availability: "available",
    reason: null,
  };
}

function warnMissingNativeAddon(packageName: string): void {
  if (warnedMissingAddons.has(packageName)) {
    return;
  }

  warnedMissingAddons.add(packageName);
  console.warn(
    `[reminders] Native addon "${packageName}" is unavailable. Reminder status detection will fall back to "unknown". Run \`pnpm --dir apps/desktop rebuild:native\` to rebuild optional native modules.`
  );
}

function showNotification(
  title: string,
  body: string,
  iconFilename?: string,
  onClick?: () => void
): void {
  if (!Notification.isSupported()) {
    return;
  }

  try {
    const icon = iconFilename
      ? nativeImage.createFromPath(resolveMascotAssetPath(iconFilename))
      : undefined;
    const notificationIcon = icon && !icon.isEmpty() ? icon : null;

    const notification = new Notification({
      body,
      ...(notificationIcon ? { icon: notificationIcon } : {}),
      title,
    });

    if (onClick) {
      notification.on("click", onClick);
    }

    notification.show();
  } catch {
    // Ignore notification failures so reminder flows keep running.
  }
}

export function showDesktopNotification(
  title: string,
  body: string,
  iconFilename?: string
): void {
  showNotification(title, body, iconFilename);
}

async function getMacOsNotificationStatus(): Promise<DesktopNotificationStatus> {
  if (
    !hasNativeAddonBinary({
      bindingName: "notificationstate",
      packageName: "macos-notification-state",
    })
  ) {
    warnMissingNativeAddon("macos-notification-state");
    return createUnknownStatus();
  }

  try {
    const module =
      (await import("macos-notification-state")) as MacOsNotificationStateModule;

    switch (await module.getNotificationState()) {
      case "DO_NOT_DISTURB": {
        return createBlockedStatus("do-not-disturb");
      }
      case "SESSION_ON_CONSOLE_KEY": {
        return createAvailableStatus();
      }
      case "SESSION_SCREEN_IS_LOCKED": {
        return createBlockedStatus("session-locked");
      }
      default: {
        return createUnknownStatus();
      }
    }
  } catch {
    return createUnknownStatus();
  }
}

async function getWindowsNotificationStatus(): Promise<DesktopNotificationStatus> {
  if (
    !hasNativeAddonBinary({
      bindingName: "notificationstate",
      packageName: "windows-notification-state",
    })
  ) {
    warnMissingNativeAddon("windows-notification-state");
    return createUnknownStatus();
  }

  try {
    const module =
      (await import("windows-notification-state")) as WindowsNotificationStateModule;

    switch (module.getNotificationState()) {
      case "QUNS_ACCEPTS_NOTIFICATIONS": {
        return createAvailableStatus();
      }
      case "QUNS_APP": {
        return createBlockedStatus("other-app-active");
      }
      case "QUNS_BUSY": {
        return createBlockedStatus("app-busy");
      }
      case "QUNS_NOT_PRESENT": {
        return createBlockedStatus("session-locked");
      }
      case "QUNS_PRESENTATION_MODE": {
        return createBlockedStatus("presentation-mode");
      }
      case "QUNS_QUIET_TIME": {
        return createBlockedStatus("quiet-time");
      }
      case "QUNS_RUNNING_D3D_FULL_SCREEN": {
        return createBlockedStatus("full-screen-app");
      }
      default: {
        return createUnknownStatus();
      }
    }
  } catch {
    return createUnknownStatus();
  }
}

export function getDesktopNotificationStatus(): Promise<DesktopNotificationStatus> {
  if (!Notification.isSupported()) {
    return Promise.resolve({
      availability: "unsupported",
      reason: "unsupported-platform",
    });
  }

  if (process.platform === "darwin") {
    return getMacOsNotificationStatus();
  }

  if (process.platform === "win32") {
    return getWindowsNotificationStatus();
  }

  return Promise.resolve({
    availability: "unsupported",
    reason: "unsupported-platform",
  });
}

export function showIncompleteReminder(): void {
  showNotification(
    "Zucchini reminder",
    "You still have habits closing today.",
    "mascot-reminder.png"
  );
}

export function showCatchUpReminder(): void {
  showNotification(
    "Catch-up reminder",
    "Zucchini was closed at your reminder time. You still have habits closing today.",
    "mascot-reminder.png"
  );
}

export function showMidnightWarning(): void {
  showNotification(
    "One hour left",
    "You have 1 hour left to finish habits closing today.",
    "mascot-sleepy.png"
  );
}

export function showMissedReminderWarning(): void {
  showNotification(
    "Last reminder missed",
    "You missed today's scheduled reminder. You still have habits closing today, and there is only one hour left.",
    "mascot-sleepy.png"
  );
}

export function showSnoozedReminder(minutes: number): void {
  showNotification(
    "Snooze finished",
    `Your ${minutes}-minute Zucchini snooze has ended. You still have habits closing today.`,
    "mascot-reminder.png"
  );
}

export function showWindDownReminder(onClick: () => void): void {
  showNotification(
    "Start wind down",
    "Your wind down routine is ready.",
    "mascot-sleepy.png",
    onClick
  );
}
