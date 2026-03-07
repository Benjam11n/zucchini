import { showIncompleteReminder } from "./notifications";

let reminderTimeout: NodeJS.Timeout | null = null;

export function scheduleReminder(reminderEnabled: boolean, reminderTime: string): void {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }

  if (!reminderEnabled) {
    return;
  }

  const [hours, minutes] = reminderTime.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  reminderTimeout = setTimeout(() => {
    showIncompleteReminder();
    scheduleReminder(reminderEnabled, reminderTime);
  }, target.getTime() - now.getTime());
}
