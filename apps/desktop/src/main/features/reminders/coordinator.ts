import { createReminderScheduler } from "@/main/features/reminders/reminder-scheduler";
import { createRuntimeStateStore } from "@/main/features/reminders/scheduler-utils";
import { createWindDownReminderScheduler } from "@/main/features/wind-down/reminder-scheduler";
import { systemClock } from "@/shared/domain/clock";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import { DEFAULT_REMINDER_RUNTIME_STATE } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";
import { DEFAULT_WIND_DOWN_RUNTIME_STATE } from "@/shared/domain/wind-down-runtime-state";

import {
  electronHabitReminderNotifier,
  electronWindDownReminderNotifier,
} from "./adapters";
import type {
  HabitReminderNotifier,
  ReminderClockPort,
  ReminderRuntimeStateStore,
  ReminderStateRepositoryPort,
  ReminderTimerPort,
  TodayStateReader,
  WindDownReminderNotifier,
} from "./ports";
import { realReminderTimers } from "./ports";

interface ReminderCoordinatorOptions {
  clock?: ReminderClockPort;
  habitNotifier?: HabitReminderNotifier;
  habitState?: ReminderRuntimeStateStore<ReminderRuntimeState>;
  onOpenWindDown: () => void;
  repository: ReminderStateRepositoryPort;
  timers?: ReminderTimerPort;
  today: TodayStateReader;
  windDownNotifier?: WindDownReminderNotifier;
  windDownState?: ReminderRuntimeStateStore<WindDownRuntimeState>;
}

export interface ReminderCoordinator {
  cancel(): void;
  schedule(settings: AppSettings): void;
  snooze(settings: AppSettings): boolean;
}

export function createReminderCoordinator({
  clock = systemClock,
  habitNotifier = electronHabitReminderNotifier,
  habitState,
  onOpenWindDown,
  repository,
  timers = realReminderTimers,
  today,
  windDownNotifier = electronWindDownReminderNotifier,
  windDownState,
}: ReminderCoordinatorOptions): ReminderCoordinator {
  const reminders = createReminderScheduler({
    clock,
    getTodayState: today.getTodayState,
    notifier: habitNotifier,
    stateStore:
      habitState ??
      createRuntimeStateStore({
        defaultState: { ...DEFAULT_REMINDER_RUNTIME_STATE },
        loadState: () => repository.getReminderRuntimeState(),
        saveState: (state) => {
          repository.saveReminderRuntimeState(state);
        },
      }),
    timers,
  });
  const windDownReminders = createWindDownReminderScheduler({
    clock,
    getTodayState: today.getTodayState,
    notifier: windDownNotifier,
    onOpenWindDown,
    stateStore:
      windDownState ??
      createRuntimeStateStore({
        defaultState: { ...DEFAULT_WIND_DOWN_RUNTIME_STATE },
        loadState: () => repository.getWindDownRuntimeState(),
        saveState: (state) => {
          repository.saveWindDownRuntimeState(state);
        },
      }),
    timers,
  });

  return {
    cancel() {
      reminders.cancel();
      windDownReminders.cancel();
    },
    schedule(settings) {
      reminders.schedule(settings);
      windDownReminders.schedule(settings);
    },
    snooze(settings) {
      return reminders.snooze(settings);
    },
  };
}
