import type { TodayState } from "@/shared/contracts/today-state";
import type { Clock } from "@/shared/domain/clock";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";

export type ReminderClockPort = Pick<Clock, "now">;

export type ReminderTimerHandle = ReturnType<typeof setTimeout>;

export interface ReminderTimerPort {
  clearTimeout(timer: ReminderTimerHandle): void;
  setTimeout(callback: () => void, delayMs: number): ReminderTimerHandle;
}

export interface ReminderRuntimeStateStore<TState> {
  get: () => TState;
  set: (state: TState) => void;
}

export interface TodayStateReader {
  getTodayState: () => TodayState;
}

export interface HabitReminderNotifier {
  showCatchUpReminder: () => void;
  showIncompleteReminder: () => void;
  showMidnightWarning: () => void;
  showMissedReminderWarning: () => void;
  showSnoozedReminder: (minutes: number) => void;
}

export interface WindDownReminderNotifier {
  showWindDownReminder: (onClick: () => void) => void;
}

export interface ReminderStateRepositoryPort {
  getReminderRuntimeState(): ReminderRuntimeState;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
  getWindDownRuntimeState(): WindDownRuntimeState;
  saveWindDownRuntimeState(state: WindDownRuntimeState): void;
}

export const realReminderTimers: ReminderTimerPort = {
  clearTimeout: (timer) => {
    clearTimeout(timer);
  },
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
};
