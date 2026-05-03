import {
  showCatchUpReminder,
  showIncompleteReminder,
  showMidnightWarning,
  showMissedReminderWarning,
  showSnoozedReminder,
  showWindDownReminder,
} from "@/main/features/reminders/notifications";
import type {
  HabitReminderNotifier,
  WindDownReminderNotifier,
} from "@/main/features/reminders/ports";

export const electronHabitReminderNotifier: HabitReminderNotifier = {
  showCatchUpReminder,
  showIncompleteReminder,
  showMidnightWarning,
  showMissedReminderWarning,
  showSnoozedReminder,
};

export const electronWindDownReminderNotifier: WindDownReminderNotifier = {
  showWindDownReminder,
};
