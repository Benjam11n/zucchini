import { nativeImage, Notification } from "electron";

import { resolveMascotAssetPath } from "@/main/app/assets";
import type { DesktopNotificationStatus } from "@/shared/contracts/habits-ipc";

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

function showNotification(
  title: string,
  body: string,
  iconFilename?: string
): void {
  if (!Notification.isSupported()) {
    return;
  }

  try {
    const icon = iconFilename
      ? nativeImage.createFromPath(resolveMascotAssetPath(iconFilename))
      : undefined;

    new Notification({
      body,
      icon: icon && !icon.isEmpty() ? icon : undefined,
      title,
    }).show();
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
  try {
    const module =
      (await import("macos-notification-state")) as MacOsNotificationStateModule;

    switch (await module.getNotificationState()) {
      case "DO_NOT_DISTURB": {
        return createBlockedStatus("do-not-disturb");
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
  try {
    const module =
      (await import("windows-notification-state")) as WindowsNotificationStateModule;

    switch (module.getNotificationState()) {
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
