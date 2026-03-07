import { Notification } from "electron";

function showNotification(title: string, body: string): void {
  if (!Notification.isSupported()) {
    return;
  }

  new Notification({ body, title }).show();
}

export function showIncompleteReminder(): void {
  showNotification("Zucchini reminder", "You still have habits closing today.");
}

export function showMidnightWarning(): void {
  showNotification(
    "One hour left",
    "You have 1 hour left to finish habits closing today."
  );
}
