import { Notification } from "electron";

export function showIncompleteReminder(): void {
  if (!Notification.isSupported()) {
    return;
  }

  new Notification({
    title: "Zucchini reminder",
    body: "Your habits are still open for today.",
  }).show();
}
