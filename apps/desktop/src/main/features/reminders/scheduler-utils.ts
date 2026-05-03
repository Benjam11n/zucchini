import type { Clock } from "@/main/app/clock";

import {
  getDelayUntilNextZonedOccurrence,
  isSameZonedCalendarDate,
} from "./reminder-timezone";

export type TimerHandle = ReturnType<typeof setTimeout>;

export interface RuntimeStateStore<TState> {
  get: () => TState;
  set: (state: TState) => void;
}

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

export function clearTimer(timer: TimerHandle | null): null {
  if (timer) {
    clearTimeout(timer);
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
  timezone,
}: {
  clock: Pick<Clock, "now">;
  hours: number;
  minutes: number;
  onFire: () => void;
  setTimer: (timer: TimerHandle) => void;
  timezone: string;
}): void {
  const timer = setTimeout(
    () => {
      onFire();
      scheduleDailyNotification({
        clock,
        hours,
        minutes,
        onFire,
        setTimer,
        timezone,
      });
    },
    getDelayUntilNextZonedOccurrence(timezone, hours, minutes, clock.now())
  );

  setTimer(timer);
}
