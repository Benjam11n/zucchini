import type { Clock } from "@/main/app/clock";
import { systemClock } from "@/main/app/clock";
import { showWindDownReminder } from "@/main/features/reminders/notifications";
import type { WindDownRuntimeState } from "@/main/features/wind-down/runtime-state";
import { DEFAULT_WIND_DOWN_RUNTIME_STATE } from "@/main/features/wind-down/runtime-state";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { AppSettings } from "@/shared/domain/settings";

import {
  getDelayUntilNextZonedOccurrence,
  isAtOrPastZonedTime,
  isSameZonedCalendarDate,
  parseReminderClockTime,
} from "../reminders/reminder-timezone";

type TimerHandle = ReturnType<typeof setTimeout>;

interface WindDownReminderSchedulerOptions {
  clock?: Pick<Clock, "now">;
  getTodayState: () => TodayState;
  loadState?: () => WindDownRuntimeState;
  onOpenWindDown: () => void;
  saveState?: (state: WindDownRuntimeState) => void;
}

interface WindDownReminderScheduler {
  cancel: () => void;
  schedule: (settings: AppSettings) => void;
}

function noopSaveState(_state: WindDownRuntimeState): void {
  // Tests can omit persistence when they only need scheduling behavior.
}

export function createWindDownReminderScheduler({
  clock = systemClock,
  getTodayState,
  loadState = () => ({ ...DEFAULT_WIND_DOWN_RUNTIME_STATE }),
  onOpenWindDown,
  saveState = noopSaveState,
}: WindDownReminderSchedulerOptions): WindDownReminderScheduler {
  let reminderTimeout: TimerHandle | null = null;
  let stateLoaded = false;
  let state = { ...DEFAULT_WIND_DOWN_RUNTIME_STATE };

  function ensureStateLoaded(): void {
    if (stateLoaded) {
      return;
    }

    state = loadState();
    stateLoaded = true;
  }

  function persistState(nextState: WindDownRuntimeState): void {
    ensureStateLoaded();
    state = nextState;
    saveState(state);
  }

  function clearReminderTimeout(): void {
    if (reminderTimeout) {
      clearTimeout(reminderTimeout);
      reminderTimeout = null;
    }
  }

  function wasSentToday(sentAt: string | null, timezone: string): boolean {
    if (!sentAt) {
      return false;
    }

    return isSameZonedCalendarDate(new Date(sentAt), clock.now(), timezone);
  }

  function shouldSend(settings: AppSettings): boolean {
    const today = getTodayState();
    const { windDown } = today;

    return Boolean(
      windDown &&
      windDown.totalCount > 0 &&
      !windDown.isComplete &&
      !wasSentToday(state.lastReminderSentAt, settings.timezone)
    );
  }

  function deliverReminder(settings: AppSettings): void {
    if (!shouldSend(settings)) {
      return;
    }

    showWindDownReminder(onOpenWindDown);
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

    reminderTimeout = setTimeout(
      () => {
        deliverReminder(settings);
        scheduleNext(settings, hours, minutes);
      },
      getDelayUntilNextZonedOccurrence(
        settings.timezone,
        hours,
        minutes,
        clock.now()
      )
    );
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
