import { Notification } from "electron";

export function showIncompleteReminder(): void {
  if (!Notification.isSupported()) {
    return;
  }

  new Notification({
    body: "Your habits are still open for today.",
    title: "Zucchini reminder",
  }).show();
}
