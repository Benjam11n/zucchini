import { Notification } from "electron";

function showNotification(title: string, body: string): void {
  if (!Notification.isSupported()) {
    return;
  }

  new Notification({ body, title }).show();
}

export function showIncompleteReminder(): void {
  showNotification(
    "Zucchini reminder",
    "Your habits are still open for today."
  );
}

export function showMidnightWarning(): void {
  showNotification(
    "One hour left",
    "You have 1 hour to complete your habits before midnight."
  );
}
