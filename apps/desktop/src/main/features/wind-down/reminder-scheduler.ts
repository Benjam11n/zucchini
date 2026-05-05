import { electronWindDownReminderNotifier } from "@/main/features/reminders/adapters";
import type {
  ReminderRuntimeStateStore,
  ReminderTimerPort,
  WindDownReminderNotifier,
} from "@/main/features/reminders/ports";
import { realReminderTimers } from "@/main/features/reminders/ports";
import type { TodayState } from "@/shared/contracts/today-state";
import type { Clock } from "@/shared/domain/clock";
import { systemClock } from "@/shared/domain/clock";
import type { AppSettings } from "@/shared/domain/settings";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";
import { DEFAULT_WIND_DOWN_RUNTIME_STATE } from "@/shared/domain/wind-down-runtime-state";

import {
  isAtOrPastZonedTime,
  parseReminderClockTime,
} from "../reminders/reminder-timezone";
import {
  clearTimer,
  createRuntimeStateStore,
  scheduleDailyNotification,
  wasSentToday,
} from "../reminders/scheduler-utils";
import type { TimerHandle } from "../reminders/scheduler-utils";

interface WindDownReminderSchedulerOptions {
  clock?: Pick<Clock, "now">;
  getTodayState: () => TodayState;
  loadState?: () => WindDownRuntimeState;
  notifier?: WindDownReminderNotifier;
  onOpenWindDown: () => void;
  saveState?: (state: WindDownRuntimeState) => void;
  stateStore?: ReminderRuntimeStateStore<WindDownRuntimeState>;
  timers?: ReminderTimerPort;
}

interface WindDownReminderScheduler {
  cancel: () => void;
  schedule: (settings: AppSettings) => void;
}

export function createWindDownReminderScheduler({
  clock = systemClock,
  getTodayState,
  loadState = () => ({ ...DEFAULT_WIND_DOWN_RUNTIME_STATE }),
  notifier = electronWindDownReminderNotifier,
  onOpenWindDown,
  saveState,
  stateStore,
  timers = realReminderTimers,
}: WindDownReminderSchedulerOptions): WindDownReminderScheduler {
  let reminderTimeout: TimerHandle | null = null;
  const runtimeState =
    stateStore ??
    createRuntimeStateStore({
      defaultState: { ...DEFAULT_WIND_DOWN_RUNTIME_STATE },
      loadState,
      ...(saveState ? { saveState } : {}),
    });

  function persistState(nextState: WindDownRuntimeState): void {
    runtimeState.set(nextState);
  }

  function ensureStateLoaded(): void {
    runtimeState.get();
  }

  function clearReminderTimeout(): void {
    reminderTimeout = clearTimer(reminderTimeout, timers);
  }

  function shouldSend(settings: AppSettings): boolean {
    const today = getTodayState();
    const { windDown } = today;
    const state = runtimeState.get();

    return Boolean(
      windDown &&
      windDown.totalCount > 0 &&
      !windDown.isComplete &&
      !wasSentToday({
        clock,
        sentAt: state.lastReminderSentAt,
        timezone: settings.timezone,
      })
    );
  }

  function deliverReminder(settings: AppSettings): void {
    if (!shouldSend(settings)) {
      return;
    }

    notifier.showWindDownReminder(onOpenWindDown);
    persistState({
      lastReminderSentAt: clock.now().toISOString(),
    });
  }

  function scheduleNext(
    settings: AppSettings,
    hours: number,
    minutes: number
  ): void {
    clearReminderTimeout();

    scheduleDailyNotification({
      clock,
      hours,
      minutes,
      onFire: () => {
        deliverReminder(settings);
      },
      setTimer: (timer) => {
        reminderTimeout = timer;
      },
      timers,
      timezone: settings.timezone,
    });
  }

  function schedule(settings: AppSettings): void {
    ensureStateLoaded();
    clearReminderTimeout();

    const parsedTime = parseReminderClockTime(settings.windDownTime);

    if (!parsedTime) {
      return;
    }

    if (
      isAtOrPastZonedTime(
        clock.now(),
        settings.timezone,
        parsedTime.hours,
        parsedTime.minutes
      )
    ) {
      deliverReminder(settings);
    }

    scheduleNext(settings, parsedTime.hours, parsedTime.minutes);
  }

  return {
    cancel() {
      clearReminderTimeout();
    },
    schedule,
  };
}
