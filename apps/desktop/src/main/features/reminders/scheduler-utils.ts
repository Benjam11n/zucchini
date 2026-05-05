import type {
  ReminderRuntimeStateStore,
  ReminderTimerHandle,
  ReminderTimerPort,
} from "@/main/features/reminders/ports";
import { realReminderTimers } from "@/main/features/reminders/ports";
import type { Clock } from "@/shared/domain/clock";

import {
  getDelayUntilNextZonedOccurrence,
  isSameZonedCalendarDate,
} from "./reminder-timezone";

export type TimerHandle = ReminderTimerHandle;

export type RuntimeStateStore<TState> = ReminderRuntimeStateStore<TState>;

export function createRuntimeStateStore<TState>({
  defaultState,
  loadState,
  saveState,
}: {
  defaultState: TState;
  loadState?: () => TState;
  saveState?: (state: TState) => void;
}): RuntimeStateStore<TState> {
  let state = defaultState;
  let stateLoaded = false;

  function ensureLoaded(): void {
    if (stateLoaded) {
      return;
    }

    state = loadState?.() ?? defaultState;
    stateLoaded = true;
  }

  return {
    get() {
      ensureLoaded();
      return state;
    },
    set(nextState) {
      ensureLoaded();
      state = nextState;
      saveState?.(state);
    },
  };
}

export function clearTimer(
  timer: TimerHandle | null,
  timers: ReminderTimerPort = realReminderTimers
): null {
  if (timer) {
    timers.clearTimeout(timer);
  }

  return null;
}

export function wasSentToday({
  clock,
  sentAt,
  timezone,
}: {
  clock: Pick<Clock, "now">;
  sentAt: string | null;
  timezone: string;
}): boolean {
  if (!sentAt) {
    return false;
  }

  return isSameZonedCalendarDate(new Date(sentAt), clock.now(), timezone);
}

export function scheduleDailyNotification({
  clock,
  hours,
  minutes,
  onFire,
  setTimer,
  timers = realReminderTimers,
  timezone,
}: {
  clock: Pick<Clock, "now">;
  hours: number;
  minutes: number;
  onFire: () => void;
  setTimer: (timer: TimerHandle) => void;
  timers?: ReminderTimerPort;
  timezone: string;
}): void {
  const timer = timers.setTimeout(
    () => {
      onFire();
      scheduleDailyNotification({
        clock,
        hours,
        minutes,
        onFire,
        setTimer,
        timers,
        timezone,
      });
    },
    getDelayUntilNextZonedOccurrence(timezone, hours, minutes, clock.now())
  );

  setTimer(timer);
}
