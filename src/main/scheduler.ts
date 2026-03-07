import type { ReminderSettings } from "../shared/domain/settings";
import { getTodayState } from "./db";
import { showIncompleteReminder } from "./notifications";

let reminderTimeout: NodeJS.Timeout | null = null;

export function scheduleReminder(settings: ReminderSettings): void {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }

  if (!settings.reminderEnabled) {
    return;
  }

  const [hours, minutes] = settings.reminderTime.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  reminderTimeout = setTimeout(() => {
    const today = getTodayState();
    const incomplete = today.habits.length > 0 && today.habits.some((habit) => !habit.completed);

    if (incomplete) {
      showIncompleteReminder();
    }

    scheduleReminder(settings);
  }, target.getTime() - now.getTime());
}
