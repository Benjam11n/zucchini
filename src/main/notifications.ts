import { nativeImage, Notification } from "electron";

import { resolveMascotAssetPath } from "./assets";

function showNotification(
  title: string,
  body: string,
  iconFilename?: string
): void {
  if (!Notification.isSupported()) {
    return;
  }

  const icon = iconFilename
    ? nativeImage.createFromPath(resolveMascotAssetPath(iconFilename))
    : undefined;

  new Notification({
    body,
    icon: icon && !icon.isEmpty() ? icon : undefined,
    title,
  }).show();
}

export function showDesktopNotification(
  title: string,
  body: string,
  iconFilename?: string
): void {
  showNotification(title, body, iconFilename);
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
