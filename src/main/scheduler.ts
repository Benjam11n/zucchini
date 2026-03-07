import type { ReminderSettings } from "../shared/domain/settings";
import type { TodayState } from "../shared/types/ipc";
import { showIncompleteReminder } from "./notifications";

let reminderTimeout: NodeJS.Timeout | null = null;

interface ReminderScheduler {
  schedule: (settings: ReminderSettings) => void;
  cancel: () => void;
}

export function createReminderScheduler(
  getTodayState: () => TodayState
): ReminderScheduler {
  function cancel(): void {
    if (reminderTimeout) {
      clearTimeout(reminderTimeout);
      reminderTimeout = null;
    }
  }

  function schedule(settings: ReminderSettings): void {
    cancel();

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
      const incomplete =
        today.habits.length > 0 &&
        today.habits.some((habit) => !habit.completed);

      if (incomplete) {
        showIncompleteReminder();
      }

      schedule(settings);
    }, target.getTime() - now.getTime());
  }

  return { cancel, schedule };
}
