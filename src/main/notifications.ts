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

export function showMidnightWarning(): void {
  showNotification(
    "One hour left",
    "You have 1 hour left to finish habits closing today.",
    "mascot-sleepy.png"
  );
}
